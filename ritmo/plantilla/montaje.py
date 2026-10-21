"""Monta el reel de Ritmo: ajusta el ritmo de la animación a la voz, genera efectos y mezcla.
Uso: python3 montaje.py <carpeta_voz>   (carpeta con <id>.mp3 y duraciones.json)
"""
import sys, json, os, subprocess
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
VOZ = sys.argv[1]
SR = 48000
FPS = 30
ids_all = ["gancho", "paso1", "paso2", "paso3", "paso4", "paso5", "paso6", "cierre"]
clips, dur = {}, {}
for k in ids_all:
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", f"{VOZ}/{k}.mp3", "-ac", "1", "-ar", str(SR), "-f", "f32le", "pipe:1"],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.float32).copy()
    idx = np.where(np.abs(a) > 0.02 * np.abs(a).max())[0]
    a = a[max(0, idx[0] - 1200): idx[-1] + 2400]
    clips[k] = a; dur[k] = len(a) / SR

# ---------- 1) línea de tiempo: segmentos de la animación y dónde entra cada frase ----------
ids = ["gancho", "paso1", "paso2", "paso3", "paso4", "paso5", "paso6", "cierre"]
B = [0, 2.3, 5.0, 8.7, 12.3, 15.4, 18.2, 21.4, 24.5]            # bordes originales (tiempo de animación)
OFF = {"gancho": 0.45, "cierre": 0.75}                          # retraso de la voz dentro de su segmento
segs_new, voice_at = [], {}
T = 0.0
for i, k in enumerate(ids):
    orig = B[i + 1] - B[i]
    off = OFF.get(k, 0.3)
    tail = 1.1 if k == "cierre" else 0.35
    L = max(orig, off + dur[k] + tail)
    voice_at[k] = T + off
    segs_new.append((T, T + L, B[i], B[i + 1]))
    T += L
TOTAL = T


def to_anim(t_out):
    for a, b, oa, ob in segs_new:
        if t_out <= b:
            return oa + (t_out - a) / (b - a) * (ob - oa)
    return B[-1]


def to_out(t_anim):
    for a, b, oa, ob in segs_new:
        if t_anim <= ob:
            return a + (t_anim - oa) / (ob - oa) * (b - a)
    return TOTAL


json.dump({"fps": FPS, "frames": [round(to_anim(i / FPS), 4) for i in range(int(TOTAL * FPS))]},
          open(f"{HERE}/tiempos.json", "w"))
print(f"Duración final: {TOTAL:.2f}s"); print({k: round(v, 2) for k, v in dur.items()})

# ---------- 2) efectos de sonido sintetizados (libres de derechos) ----------
rng = np.random.default_rng(3)
N = int((TOTAL + 0.5) * SR)
sfx = np.zeros(N, np.float32)


def t_(L):
    return np.arange(int(L * SR)) / SR


def add(sig, at, gain=1.0):
    s = int(at * SR)
    if s < 0 or s >= N:
        return
    e = min(N, s + len(sig))
    sfx[s:e] += sig[: e - s].astype(np.float32) * gain


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x)


def click():
    x = t_(0.06)
    body = np.sin(2 * np.pi * 1900 * x) * np.exp(-x * 160) * 0.6
    thump = np.sin(2 * np.pi * (180 * np.exp(-x * 40) + 90) * x) * np.exp(-x * 60) * 0.7
    tick = bp(rng.standard_normal(len(x)), 2500, 7000) * np.exp(-x * 400) * 0.5
    return body + thump + tick


def key():
    x = t_(0.04)
    f = rng.uniform(2600, 3600)
    return (bp(rng.standard_normal(len(x)), f * 0.6, f * 1.6) * np.exp(-x * 350) * 0.55
            + np.sin(2 * np.pi * 220 * x) * np.exp(-x * 120) * 0.15)


def whoosh(L=0.55, lo=300, hi=3500):
    x = t_(L)
    n = rng.standard_normal(len(x))
    env = np.sin(np.pi * x / L) ** 2
    # barrido: mezcla de una banda grave y una aguda que cambia en el tiempo
    a = bp(n, lo, lo * 3); b = bp(n, hi / 3, hi)
    mix = a * (1 - x / L) + b * (x / L)
    return mix * env * 0.9


def pop(f0=650, f1=320):
    x = t_(0.12)
    f = f1 + (f0 - f1) * np.exp(-x * 35)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 28) * 0.8


def bell(f, L=1.1):
    x = t_(L)
    return sum(np.sin(2 * np.pi * f * m * x) * a * np.exp(-x * d) for m, a, d in [(1, 1, 4), (2.01, .35, 7), (3.02, .15, 10)])


def chime():
    s = np.zeros(int(1.6 * SR))
    for i, f in enumerate([783.99, 987.77, 1318.5]):          # G5 B5 E6
        b = bell(f) * 0.5
        st = int(i * 0.09 * SR); s[st:st + len(b)] += b[: len(s) - st]
    return s


def blip(up=True):
    x = t_(0.09)
    f = (900 + 700 * x / 0.09) if up else (1400 - 500 * x / 0.09)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * x / 0.09) * 0.6


def impact():
    x = t_(1.4)
    boom = np.sin(2 * np.pi * (45 + 70 * np.exp(-x * 12)) * x) * np.exp(-x * 3.5)
    air = bp(rng.standard_normal(len(x)), 800, 6000) * np.exp(-x * 6) * 0.25
    return boom + air


def shimmer(L=0.9):
    x = t_(L)
    s = sum(np.sin(2 * np.pi * f * x + rng.uniform(0, 6)) for f in [2093, 2637, 3136, 4186]) / 4
    return s * np.sin(np.pi * x / L) ** 2 * 0.25


A = to_out  # tiempo de animación -> tiempo final
add(shimmer(), A(0.0), 0.5)
add(whoosh(0.9, 120, 2500), A(0.25), 0.55)
for tt in [3.9, 8.25, 13.1, 13.9, 16.4, 17.05, 18.0]:
    add(click(), A(tt), 0.55)
add(whoosh(0.5), A(4.35), 0.35)
for i in range(3):
    add(pop(700 + i * 90, 340 + i * 40), A(5.55 + i * 0.15), 0.35)
add(whoosh(0.45, 400, 2500), A(7.15), 0.22)
add(whoosh(0.5, 200, 2000), A(8.35), 0.35)
# tecleo
for a, b, txt in [(9.0, 9.8, "María Pérez"), (9.95, 10.75, "0414 555 0123"), (10.9, 11.45, "V-12.345.678"), (11.6, 12.2, "maria@gmail.com")]:
    n = len(txt)
    for j in range(n):
        add(key(), A(a + (b - a) * (j + 0.5) / n) + rng.uniform(-0.01, 0.01), 0.28)
add(whoosh(0.5, 500, 4000), A(12.3), 0.15)
add(whoosh(0.5, 500, 4000), A(15.45), 0.15)
add(chime(), A(17.42), 0.4)
add(whoosh(0.55, 200, 2500), A(18.25), 0.35)
add(blip(True), A(18.9), 0.45)
add(blip(True), A(19.6), 0.45)
add(blip(False), A(20.4), 0.5)
add(whoosh(0.7, 150, 2000), A(21.3), 0.35)
add(impact(), A(21.85), 0.55)
add(shimmer(1.2), A(21.9), 0.45)

# ---------- 3) voz ----------
voice = np.zeros(N, np.float32)
for k in ids:
    a = clips[k]
    s = int(voice_at[k] * SR); e = min(N, s + len(a))
    voice[s:e] += a[: e - s]
voice /= np.abs(voice).max() + 1e-6

# ducking: efectos más bajos mientras habla
env = np.convolve(np.abs(voice), np.ones(2400) / 2400, mode="same")
duck = 1 - 0.45 * np.clip(env / (env.max() + 1e-6) * 4, 0, 1)
mix = voice * 0.85 + sfx * duck
mix /= max(1.0, np.abs(mix).max() / 0.95)
wavfile.write(f"{HERE}/audio_mix.wav", SR, (mix * 32767).astype(np.int16))
wavfile.write(f"{HERE}/audio_sfx.wav", SR, (np.clip(sfx, -1, 1) * 32767).astype(np.int16))
print("Audio listo")
