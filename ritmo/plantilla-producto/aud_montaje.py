"""Video audífonos Ritmo: línea de tiempo + música + efectos + voz.  Uso: python3 aud_montaje.py voz/audifonos"""
import sys, json, os, subprocess, math
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
VOZ = sys.argv[1]
SR = 48000
rng = np.random.default_rng(5)
BPM = 120
beat = 60 / BPM
ids = ["detalle", "prensa", "revela", "mujer", "bici", "cierre"]
VOICED = ["detalle", "revela", "mujer", "bici", "cierre"]

clips, dur = {}, {}
for k in VOICED:
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", f"{VOZ}/{k}.mp3", "-ac", "1", "-ar", str(SR), "-f", "f32le", "pipe:1"],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.float32).copy()
    idx = np.where(np.abs(a) > 0.02 * np.abs(a).max())[0]
    a = a[max(0, idx[0] - 1200): idx[-1] + 2400]
    clips[k] = a; dur[k] = len(a) / SR
dur["prensa"] = 0
print({k: round(v, 2) for k, v in dur.items()})

OFF = {"detalle": 0.5, "revela": 0.6, "mujer": 0.5, "bici": 0.15, "cierre": 0.5}
MINB = {"detalle": 10, "prensa": 5, "revela": 8, "mujer": 10, "bici": 6, "cierre": 12}
TAIL = {"detalle": 0.2, "revela": 0.3, "mujer": 0.0, "bici": 0.3, "cierre": 0.8}
seg, voice_at, T = {}, {}, 0.0
for k in ids:
    need = OFF.get(k, 0) + dur[k] + TAIL.get(k, 0)
    nb = max(MINB[k], math.ceil(need / beat))
    seg[k] = [round(T, 4), round(T + nb * beat, 4)]
    if k in VOICED:
        voice_at[k] = T + OFF[k]
    T += nb * beat
TOTAL = T
print("segmentos:", seg, "total", round(TOTAL, 2))

# ---------- tomas ----------
shots = []
def add(kind, t0, t1, **kw):
    prev = len(shots) - 1 if shots else None
    shots.append(dict(kind=kind, t0=round(t0, 4), t1=round(t1, 4), prev=prev, **kw))

# detalles (fotos reales): img, foco inicial->final, zoom inicial->final
D = [("d_0361.png", .50, .45, .50, .55, 1.25, 1.10),   # plegados
     ("d_0370.png", .28, .55, .34, .50, 2.6, 2.3),     # cuero de la almohadilla
     ("d_0364.png", .50, .16, .50, .22, 2.4, 2.8),     # ajuste metálico de la diadema
     ("d_0372.png", .40, .90, .48, .86, 2.6, 2.3),     # LED verde + puerto
     ("d_0365.png", .50, .80, .50, .76, 2.3, 1.9),     # logo RITMO
     ("d_0362.png", .50, .50, .50, .50, 1.12, 1.0)]    # frente completo
a, b = seg["detalle"]; L = (b - a) / len(D)
for i, (img, fx, fy, fx1, fy1, z0, z1) in enumerate(D):
    add("detail", a + i * L, a + (i + 1) * L, img=img, fx=fx, fy=fy, fx1=fx1, fy1=fy1, z0=z0, z1=z1)
a, b = seg["prensa"]
add("vid", a, b, dir="fr/prensa", start=0.0, speed=77 / 30 / (b - a) * 0.98, n=77, z0=1.0, z1=1.08)
a, b = seg["revela"]
add("vid", a, b, dir="fr/pedestal", start=0.0, speed=min(1.0, 4.85 / (b - a)), n=147, z0=1.0, z1=1.06)
a, b = seg["mujer"]
add("vid", a, b, dir="fr/mujer", start=0.0, speed=min(1.0, 5.9 / (b - a)), n=180, z0=1.02, z1=1.08, xf=0.3)
a, b = seg["bici"]; bs = ["S6", "S3", "S7"]; L = (b - a) / len(bs)
for i, s in enumerate(bs):
    add("vid", a + i * L, a + (i + 1) * L, dir=f"cf2/{s}", start=0.05, speed=0.9, n=78, z0=1.04, z1=1.1, xf=0.25)
a, b = seg["cierre"]
add("vid", a, b, dir="fr/pedestal", start=2.5, speed=0.5, n=147, blur=18, z0=1.1, z1=1.15)

subs = [[voice_at["detalle"] - 0.1, seg["detalle"][1] - 0.05, "Cada detalle… pensado para que sientas la música"],
        [voice_at["revela"] - 0.1, seg["revela"][1] - 0.1, "No son simples audífonos…"],
        [voice_at["mujer"] - 0.1, seg["mujer"][1] - 0.05, "Póntelos… cierra los ojos…"],
        [voice_at["bici"] - 0.05, seg["bici"][1] - 0.1, "y deja que el ritmo te mueva"]]
# momento en que el LED se enciende en la prensa (~65% del clip) y cuando los audífonos quedan puestos
led_t = seg["prensa"][0] + 0.62 * (seg["prensa"][1] - seg["prensa"][0])
on_t = seg["mujer"][0] + 1.5 / shots[[s["dir"] for s in shots if s["kind"] == "vid"].index("fr/mujer") + len(D)]["speed"]
hits = [[led_t, 0.25, 0.55], [seg["revela"][0], 0.3, 0.6], [on_t, 0.35, 0.5], [seg["cierre"][0], 0.3, 0.5]]
json.dump({"total": round(TOTAL, 4), "seg": seg, "shots": shots, "subs": subs, "hits": hits}, open(f"{HERE}/timeline.json", "w"))
print("LED", round(led_t, 2), "puestos", round(on_t, 2))

# =================== AUDIO ===================
N = int((TOTAL + 0.5) * SR)
def t_(L): return np.arange(int(L * SR)) / SR
def filt(x, f, kind): return sosfilt(butter(2, f, btype=kind, fs=SR, output="sos"), x)
def place(buf, sig, at, gain=1.0):
    s = int(at * SR)
    if s < 0 or s >= len(buf): return
    e = min(len(buf), s + len(sig)); buf[s:e] += np.asarray(sig[: e - s], np.float32) * gain
def saw(f, x): return 2 * ((f * x) % 1) - 1
def kick():
    x = t_(0.42); f = 46 + 120 * np.exp(-x * 32)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 6.5) * 1.8)
def clap():
    x = t_(0.25); n = filt(rng.standard_normal(len(x)), [900, 3800], "band")
    return n * sum(np.where(x >= d, np.exp(-(x - d) * (60 if d < 0.02 else 13)), 0) for d in (0, 0.011, 0.022)) * 0.8
def hat(o=False):
    x = t_(0.25 if o else 0.05); return filt(rng.standard_normal(len(x)), 7500, "high") * np.exp(-x * (13 if o else 70))
def bass(f, L):
    x = t_(L); s = filt(np.sin(2 * np.pi * f * x) + 0.6 * saw(f, x), 900, "low")
    return np.tanh(s * np.minimum(1, x / 0.004) * np.exp(-x * 5) * 2.2) * 0.7
def stab(freqs, L=0.22):
    x = t_(L); return filt(sum(saw(f * d, x) for f in freqs for d in (0.994, 1.006)), 3200, "low") * np.exp(-x * 10) * 0.16
def pad(freqs, L):
    x = t_(L); s = sum(np.sin(2 * np.pi * f * x + 0.4 * np.sin(2 * np.pi * 0.3 * x)) + 0.25 * np.sin(2 * np.pi * f * 2.003 * x) for f in freqs)
    return s * np.minimum(1, x / 0.8) * np.minimum(1, (L - x) / 0.6) * 0.06
def riser(L):
    x = t_(L); return filt(rng.standard_normal(len(x)), [1500, 9000], "band") * (x / L) ** 2 * 0.5 + np.sin(2 * np.pi * np.cumsum(200 + 1400 * (x / L) ** 2) / SR) * (x / L) ** 2 * 0.15
def impact():
    x = t_(1.6); return np.sin(2 * np.pi * (40 + 90 * np.exp(-x * 12)) * x) * np.exp(-x * 3) + filt(rng.standard_normal(len(x)), [600, 8000], "band") * np.exp(-x * 5) * 0.35
def whoosh(L=0.45, lo=400, hi=5000):
    x = t_(L); n = rng.standard_normal(len(x)); env = np.sin(np.pi * x / L) ** 2
    return (filt(n, [lo, lo * 3], "band") * (1 - x / L) + filt(n, [hi / 3, hi], "band") * (x / L)) * env
def mech_click():
    x = t_(0.09)
    return (filt(rng.standard_normal(len(x)), [2500, 9000], "band") * np.exp(-x * 220) * 0.9
            + np.sin(2 * np.pi * 1700 * x) * np.exp(-x * 120) * 0.3 + np.sin(2 * np.pi * 180 * x) * np.exp(-x * 60) * 0.4)
def hydraulic(L):
    x = t_(L); n = filt(rng.standard_normal(len(x)), [300, 2500], "band")
    hum = np.sin(2 * np.pi * (90 - 30 * x / L) * x) * 0.3
    return (n * 0.5 + hum) * np.minimum(1, x / 0.15) * np.minimum(1, (L - x) / 0.1)
def led_zap():
    x = t_(0.7); f = 300 + 2200 * (1 - np.exp(-x * 9))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 4) * 0.4 + filt(rng.standard_normal(len(x)), [4000, 10000], "band") * np.exp(-x * 9) * 0.3
def heartbeat():
    s = np.zeros(int(0.6 * SR))
    for d, g in ((0, 1), (0.18, 0.7)):
        x = t_(0.25); k = np.sin(2 * np.pi * (45 + 25 * np.exp(-x * 30)) * x) * np.exp(-x * 14) * g
        st = int(d * SR); s[st:st + len(k)] += k
    return s

drums = np.zeros(N, np.float32); bsl = np.zeros(N, np.float32); keys = np.zeros(N, np.float32); fx = np.zeros(N, np.float32)
pump = np.ones(N, np.float32)
prog = [([220.0, 261.63, 329.63], 55.0), ([174.61, 220.0, 261.63], 43.65), ([196.0, 246.94, 293.66], 49.0), ([164.81, 207.65, 246.94], 41.2)]
for bi in range(int(TOTAL / beat) + 1):
    tb = bi * beat
    if tb >= TOTAL - 0.3: break
    chord, root = prog[(bi // 4) % 4]
    if bi % 4 == 0: place(keys, pad(chord, 4 * beat + 0.6), tb, 1.0)
    if tb < seg["revela"][0]:
        place(drums, hat(), tb, 0.12); place(drums, hat(), tb + beat / 2, 0.06)       # tic-tac de taller
        continue
    if tb < seg["mujer"][0]:
        if bi % 2 == 0: place(fx, heartbeat(), tb, 0.5)
        continue
    # desde la mujer: groove completo (luego se filtra hasta que tiene puestos los audífonos)
    place(drums, kick(), tb, 0.95)
    s_ = int(tb * SR); e = min(N, s_ + int(0.3 * SR)); pump[s_:e] = np.minimum(pump[s_:e], 1 - 0.6 * np.exp(-np.arange(e - s_) / SR * 11))
    if bi % 2 == 1: place(drums, clap(), tb, 0.5)
    place(drums, hat(True), tb + beat / 2, 0.2); place(drums, hat(), tb + beat / 4, 0.06); place(drums, hat(), tb + 3 * beat / 4, 0.06)
    place(bsl, bass(root, beat * 0.45), tb + beat / 2, 0.75)
    place(keys, stab(chord), tb + beat * 0.75, 0.8)
music = drums + bsl + keys * pump
# efecto "audífonos": antes de ponérselos la música suena apagada, luego se abre
m0 = int(seg["mujer"][0] * SR); m1 = int(on_t * SR)
music[m0:m1] = filt(music[m0:m1], 380, "low") * 1.6
xf = int(0.08 * SR); music[m1:m1 + xf] *= np.linspace(0.3, 1, xf)
ei = int(TOTAL * SR); fo = int(1.2 * SR); music[ei - fo:ei] *= np.linspace(1, 0, fo); music[ei:] = 0
music /= np.abs(music).max() + 1e-6

for sh in shots:                                          # click mecánico en cada detalle
    if sh["kind"] == "detail": place(fx, mech_click(), sh["t0"], 0.55)
pa, pb = seg["prensa"]
place(fx, whoosh(0.4, 300, 3000), pa - 0.2, 0.3)
place(fx, hydraulic(led_t - pa - 0.05), pa, 0.45)
place(fx, mech_click() * 1.6, led_t - 0.06, 0.8); place(fx, impact() * 0.6, led_t - 0.05, 0.6)
place(fx, led_zap(), led_t, 0.6)
place(fx, whoosh(0.6, 150, 2500), seg["revela"][0] - 0.3, 0.4)
place(fx, riser(seg["mujer"][0] - seg["revela"][0] - 0.3), seg["revela"][0] + 0.3, 0.3)
place(fx, impact(), on_t, 0.75)
place(fx, whoosh(0.45), seg["bici"][0] - 0.2, 0.35)
place(fx, impact() * 0.7, seg["cierre"][0], 0.55)
fx /= max(1.0, np.abs(fx).max())

voice = np.zeros(N, np.float32)
for k in VOICED: place(voice, clips[k], voice_at[k])
voice /= np.abs(voice).max() + 1e-6
env = np.convolve(np.abs(voice), np.ones(4800) / 4800, mode="same")
talk = np.convolve(np.clip(env / (env.max() + 1e-6) * 5, 0, 1), np.ones(9600) / 9600, mode="same")
mix = voice * 0.95 + fx * 0.7 * (1 - 0.3 * talk) + music * (0.42 - 0.2 * talk)
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
mix /= max(1.0, np.abs(mix).max() / 0.95)
wavfile.write(f"{HERE}/audio_mix.wav", SR, (mix * 32767).astype(np.int16))
print("Audio listo")
