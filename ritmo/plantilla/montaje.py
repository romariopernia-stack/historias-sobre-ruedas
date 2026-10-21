"""Monta el reel de Ritmo: ajusta la animación a la voz, crea efectos y música (sintetizados, libres de derechos) y mezcla.
Uso: python3 montaje.py <carpeta_voz>   (carpeta con <id>.mp3)
"""
import sys, json, os, subprocess
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
VOZ = sys.argv[1]
SR = 48000
FPS = 30
rng = np.random.default_rng(3)
ids = ["gancho", "paso1", "paso2", "paso3", "paso4", "paso5", "paso6", "cierre"]

# ---------- voz: cargar y recortar silencios ----------
clips, dur = {}, {}
for k in ids:
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", f"{VOZ}/{k}.mp3", "-ac", "1", "-ar", str(SR), "-f", "f32le", "pipe:1"],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.float32).copy()
    idx = np.where(np.abs(a) > 0.02 * np.abs(a).max())[0]
    a = a[max(0, idx[0] - 1200): idx[-1] + 2400]
    clips[k] = a; dur[k] = len(a) / SR

# ---------- línea de tiempo ----------
B = [0, 2.3, 5.0, 8.7, 12.3, 15.4, 18.2, 21.4, 24.5]
OFF = {"gancho": 0.45, "cierre": 0.75}
segs, voice_at, T = [], {}, 0.0
for i, k in enumerate(ids):
    orig = B[i + 1] - B[i]
    off = OFF.get(k, 0.3)
    L = max(orig, off + dur[k] + (1.6 if k == "cierre" else 0.35))
    voice_at[k] = T + off
    segs.append((T, T + L, B[i], B[i + 1]))
    T += L
TOTAL = T


def to_anim(t):
    for a, b, oa, ob in segs:
        if t <= b:
            return oa + (t - a) / (b - a) * (ob - oa)
    return B[-1]


def A(t):  # tiempo de animación -> tiempo final
    for a, b, oa, ob in segs:
        if t <= ob:
            return a + (t - oa) / (ob - oa) * (b - a)
    return TOTAL


json.dump({"fps": FPS, "frames": [round(to_anim(i / FPS), 4) for i in range(int(TOTAL * FPS))]}, open(f"{HERE}/tiempos.json", "w"))
print(f"Duración final: {TOTAL:.2f}s")

N = int((TOTAL + 0.5) * SR)


def t_(L):
    return np.arange(int(L * SR)) / SR


def filt(x, f, kind):
    return sosfilt(butter(2, f, btype=kind, fs=SR, output="sos"), x)


def place(buf, sig, at, gain=1.0):
    s = int(at * SR)
    if s < 0 or s >= len(buf):
        return
    e = min(len(buf), s + len(sig))
    buf[s:e] += sig[: e - s].astype(np.float32) * gain


# =================== EFECTOS ===================
sfx = np.zeros(N, np.float32)


def ios_key():
    """Tic corto y seco, parecido al del teclado del iPhone."""
    x = t_(0.035)
    f = rng.uniform(0.95, 1.05)
    tick = filt(rng.standard_normal(len(x)), [1800 * f, 7000], "band") * np.exp(-x * 520)
    tone = np.sin(2 * np.pi * 1250 * f * x) * np.exp(-x * 380) * 0.35
    body = np.sin(2 * np.pi * 320 * x) * np.exp(-x * 260) * 0.25
    return (tick * 0.9 + tone + body)


def tap():
    """Toque 'burbuja' brillante para los botones."""
    x = t_(0.16)
    f = 520 + 900 * np.exp(-x * 45)
    bub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 26) * 0.7
    tk = filt(rng.standard_normal(len(x)), [3000, 9000], "band") * np.exp(-x * 600) * 0.4
    return bub + tk


def whoosh(L=0.5, lo=400, hi=5000):
    x = t_(L)
    n = rng.standard_normal(len(x))
    env = np.sin(np.pi * x / L) ** 2
    a, b = filt(n, [lo, lo * 3], "band"), filt(n, [hi / 3, hi], "band")
    return (a * (1 - x / L) + b * (x / L)) * env


def pop(f0, f1):
    x = t_(0.13)
    f = f1 + (f0 - f1) * np.exp(-x * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 24)


def bell(f, L=1.2):
    x = t_(L)
    return sum(np.sin(2 * np.pi * f * m * x) * a * np.exp(-x * d) for m, a, d in [(1, 1, 4), (2.01, .35, 7), (3.02, .15, 10)])


def chime():
    s = np.zeros(int(1.8 * SR))
    for i, f in enumerate([783.99, 987.77, 1174.66, 1567.98]):   # arpegio alegre
        b = bell(f) * 0.45
        st = int(i * 0.07 * SR); s[st:st + len(b)] += b[: len(s) - st]
    return s


def blip(up=True):
    x = t_(0.1)
    f = (900 + 800 * x / 0.1) if up else (1500 - 600 * x / 0.1)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * x / 0.1)


def impact():
    x = t_(1.5)
    boom = np.sin(2 * np.pi * (45 + 80 * np.exp(-x * 12)) * x) * np.exp(-x * 3.2)
    air = filt(rng.standard_normal(len(x)), [800, 7000], "band") * np.exp(-x * 5) * 0.3
    return boom + air


def riser(L):
    x = t_(L)
    n = filt(rng.standard_normal(len(x)), [2000, 9000], "band")
    return n * (x / L) ** 2 * 0.6


def shimmer(L=0.9):
    x = t_(L)
    s = sum(np.sin(2 * np.pi * f * x + rng.uniform(0, 6)) for f in [2093, 2637, 3136, 4186]) / 4
    return s * np.sin(np.pi * x / L) ** 2 * 0.3


place(sfx, shimmer(), A(0.0), 0.5)
place(sfx, whoosh(0.9, 150, 3000), A(0.25), 0.5)
for tt in [3.9, 8.25, 13.1, 13.9, 16.4, 17.05, 18.0]:
    place(sfx, tap(), A(tt), 0.55)
place(sfx, whoosh(0.45), A(4.35), 0.4)
for i in range(3):
    place(sfx, pop(760 + i * 120, 380 + i * 60), A(5.55 + i * 0.15), 0.45)
place(sfx, whoosh(0.4, 600, 4000), A(7.15), 0.25)
place(sfx, whoosh(0.5, 250, 3000), A(8.35), 0.4)
# tecleo estilo iPhone, con ritmo humano (sincronizado con las letras en pantalla)
for a, b, txt in [(9.0, 9.8, "María Pérez"), (9.95, 10.75, "0414 555 0123"), (10.9, 11.45, "V-12.345.678"), (11.6, 12.2, "maria@gmail.com")]:
    n = len(txt)
    for j in range(n):
        at = A(a + (b - a) * (j + 0.6) / n) + rng.uniform(-0.012, 0.012)
        place(sfx, ios_key(), at, 0.5 if txt[j] != " " else 0.62)
place(sfx, whoosh(0.4, 700, 5000), A(12.3), 0.18)
place(sfx, whoosh(0.4, 700, 5000), A(15.45), 0.18)
place(sfx, chime(), A(17.42), 0.42)
place(sfx, whoosh(0.5, 250, 3000), A(18.25), 0.4)
place(sfx, blip(True), A(18.9), 0.45)
place(sfx, blip(True), A(19.6), 0.45)
place(sfx, blip(False), A(20.4), 0.5)
place(sfx, riser(A(21.85) - A(20.9)), A(20.9), 0.35)
place(sfx, impact(), A(21.85), 0.6)
place(sfx, shimmer(1.4), A(21.9), 0.5)

# =================== MÚSICA (house alegre, 122 BPM) ===================
BPM = 122
beat = 60 / BPM
step = beat / 4
mus_drums = np.zeros(N, np.float32)
mus_bass = np.zeros(N, np.float32)
mus_keys = np.zeros(N, np.float32)
pump = np.ones(N, np.float32)


def saw(f, x):
    return 2 * ((f * x) % 1) - 1


def kick():
    x = t_(0.4)
    f = 48 + 110 * np.exp(-x * 30)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 7) * 1.6) + filt(rng.standard_normal(len(x)), [2000, 6000], "band") * np.exp(-x * 400) * 0.2


def clap():
    x = t_(0.25)
    n = filt(rng.standard_normal(len(x)), [900, 3500], "band")
    env = np.zeros(len(x))
    for d in [0, 0.011, 0.022]:
        env += np.where(x >= d, np.exp(-(x - d) * (60 if d < 0.02 else 14)), 0)
    return n * env * 0.8


def hat(open_=False):
    x = t_(0.25 if open_ else 0.05)
    return filt(rng.standard_normal(len(x)), 7000, "high") * np.exp(-x * (14 if open_ else 70))


def bass_note(f, L):
    x = t_(L)
    s = np.sin(2 * np.pi * f * x) + 0.5 * np.sin(2 * np.pi * 2 * f * x) + 0.25 * saw(f, x)
    env = np.minimum(1, x / 0.005) * np.exp(-x * 6)
    return np.tanh(s * env * 1.2) * 0.8


def stab(freqs, L=0.28):
    x = t_(L)
    s = sum(saw(f * d, x) for f in freqs for d in (0.996, 1.004))
    s = filt(s, 2600, "low")
    return s * np.exp(-x * 9) * 0.18


def pad(freqs, L):
    x = t_(L)
    s = sum(np.sin(2 * np.pi * f * x) + 0.3 * np.sin(2 * np.pi * 2 * f * x) for f in freqs)
    env = np.minimum(1, x / 0.3) * np.minimum(1, (L - x) / 0.3)
    return s * env * 0.05


# progresión alegre: F - G - Em - Am  (cada una 1 compás)
prog = [([174.61, 220.0, 261.63], 43.65), ([196.0, 246.94, 293.66], 49.0), ([164.81, 196.0, 246.94], 41.2), ([220.0, 261.63, 329.63], 55.0)]
drop = A(2.3)            # el ritmo completo entra en el Paso 1
brk_a, brk_b = A(21.2), A(21.85)   # pequeña pausa antes del cierre
bar = beat * 4
nbars = int(TOTAL / bar) + 2
for bi in range(nbars):
    t0 = bi * bar
    chord, root = prog[bi % 4]
    place(mus_keys, pad(chord, bar + 0.1), t0)
    for s16 in range(16):
        ts = t0 + s16 * step
        if ts >= TOTAL - 0.2:
            break
        full = ts >= drop and not (brk_a <= ts < brk_b)
        if s16 % 4 == 0 and full:
            place(mus_drums, kick(), ts, 0.9)
            L = int(0.3 * SR); s = int(ts * SR)
            e = min(N, s + L); pump[s:e] = np.minimum(pump[s:e], 1 - 0.55 * np.exp(-np.arange(e - s) / SR * 11))
        if s16 in (4, 12) and full:
            place(mus_drums, clap(), ts, 0.55)
        if s16 % 4 == 2:
            place(mus_drums, hat(open_=full), ts, 0.22 if full else 0.12)
        elif full and s16 % 2 == 1:
            place(mus_drums, hat(), ts, 0.08)
        if full and s16 in (2, 6, 10, 14, 15):
            place(mus_bass, bass_note(root * (2 if s16 == 15 else 1), step * 1.8), ts, 0.55)
        if s16 in (0, 3, 6, 10) and (full or ts < drop):
            place(mus_keys, stab(chord), ts, 1.0 if full else 0.6)

intro_end = int(drop * SR)
mus_keys[:intro_end] = filt(mus_keys[:intro_end], 900, "low") * 1.6   # intro filtrada, luego "abre"
music = mus_drums + mus_bass + mus_keys * pump
music[:int(0.6 * SR)] *= np.linspace(0, 1, int(0.6 * SR))
fo = int(1.2 * SR); end_i = int(TOTAL * SR)
music[end_i - fo:end_i] *= np.linspace(1, 0, fo); music[end_i:] = 0
music /= np.abs(music).max() + 1e-6

# =================== VOZ + MEZCLA ===================
voice = np.zeros(N, np.float32)
for k in ids:
    place(voice, clips[k], voice_at[k])
voice /= np.abs(voice).max() + 1e-6
env = np.convolve(np.abs(voice), np.ones(4800) / 4800, mode="same")
talk = np.clip(env / (env.max() + 1e-6) * 5, 0, 1)
talk = np.convolve(talk, np.ones(9600) / 9600, mode="same")      # suaviza el ducking
mix = voice * 0.9 + sfx * (1 - 0.35 * talk) + music * (0.30 - 0.17 * talk)
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix /= max(1.0, np.abs(mix).max() / 0.95)
wavfile.write(f"{HERE}/audio_mix.wav", SR, (mix * 32767).astype(np.int16))
wavfile.write(f"{HERE}/musica_sola.wav", SR, (music * 0.8 * 32767).astype(np.int16))
print("Audio listo")
