"""Lanzamiento XtremeBike Inmersivo: línea de tiempo (al beat) + música + efectos + voz.
Uso: python3 spin_montaje.py <carpeta_voz>"""
import sys, json, os, subprocess, math
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
VOZ = sys.argv[1]
SR = 48000
rng = np.random.default_rng(11)
BPM = 128
beat = 60 / BPM
ids = ["gancho", "montaje", "revela", "johan", "sala", "fecha", "cierre"]

clips, dur = {}, {}
for k in ids:
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", f"{VOZ}/{k}.mp3", "-ac", "1", "-ar", str(SR), "-f", "f32le", "pipe:1"],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.float32).copy()
    idx = np.where(np.abs(a) > 0.02 * np.abs(a).max())[0]
    a = a[max(0, idx[0] - 1200): idx[-1] + 2400]
    clips[k] = a; dur[k] = len(a) / SR
print({k: round(v, 2) for k, v in dur.items()})

# ---------- línea de tiempo en compases ----------
OFF = {"gancho": 0.3, "montaje": 0.2, "revela": 0.45, "johan": 0.25, "sala": 0.15, "fecha": 0.3, "cierre": 0.35}
MINB = {"gancho": 6, "montaje": 16, "revela": 6, "johan": 4, "sala": 4, "fecha": 6, "cierre": 10}
TAIL = {"cierre": 0.9, "johan": 0.0, "sala": 0.25}
seg, voice_at, T = {}, {}, 0.0
for k in ids:
    need = OFF[k] + dur[k] + TAIL.get(k, 0.3)
    nb = max(MINB[k], math.ceil(need / beat))
    if k in ("montaje", "revela", "fecha"):
        nb += nb % 2
    seg[k] = [round(T, 4), round(T + nb * beat, 4)]
    voice_at[k] = T + OFF[k]
    T += nb * beat
TOTAL = T
print("segmentos:", seg, "total", round(TOTAL, 2))

# ---------- cortes de video ----------
N_FR = {n: len(os.listdir(f"{HERE}/cf/{n}")) for n in os.listdir(f"{HERE}/cf")}
# (clip, inicio_s, beats, velocidad)
plan = [("IMG_1974", 0.5, 1, 1.0), ("IMG_1951", 0.2, 1, 1.0), ("IMG_1948", 0.3, 1, 1.3), ("IMG_1963", 0.6, 1, 1.0),
        ("IMG_1948", 4.6, 2, 1.0), ("IMG_1974", 4.0, 1, 1.4), ("IMG_1963", 2.2, 1, 1.0), ("IMG_1951", 1.0, 1, 1.0),
        ("IMG_1948", 2.0, 1, 1.5), ("IMG_1974", 7.0, 1, 1.0), ("IMG_1963", 3.6, 2, 1.0), ("IMG_1948", 5.6, 1, 1.0),
        ("IMG_1974", 2.0, 1, 1.0), ("IMG_1951", 0.7, 1, 1.0), ("IMG_1963", 1.2, 1, 1.0), ("IMG_1948", 1.0, 1, 1.2),
        ("IMG_1974", 8.4, 1, 1.0), ("IMG_1963", 4.4, 1, 1.0), ("IMG_1948", 3.3, 1, 1.0), ("IMG_1951", 0.0, 1, 1.0)]
cuts = []
a, b = seg["montaje"]
t = a; i = 0
while t < b - 1e-6:
    c, st, nb, sp = plan[i % len(plan)]
    d = min(nb * beat, b - t)
    if nb == 1 and (b - t) > 3 * beat and i % 5 == 3:   # algunos cortes a medio beat (ráfaga)
        d = beat / 2
    cuts.append({"t0": round(t, 4), "t1": round(t + d, 4), "clip": c, "start": st, "speed": sp, "n": N_FR[c], "flash": 0.35 if i % 4 == 0 else 0})
    t += d; i += 1
# fondo borroso para revela / fecha / cierre (se ve detrás de la capa oscura)
bg_plan = [("IMG_1963", 0.5), ("IMG_1948", 0.5), ("IMG_1974", 3.0), ("IMG_1951", 0.3), ("IMG_1948", 4.8)]
j = 0
for k in ("revela", "fecha", "cierre"):
    a, b = seg[k]; t = a
    while t < b - 1e-6:
        c, st = bg_plan[j % len(bg_plan)]
        d = min(2 * beat, b - t)
        cuts.append({"t0": round(t, 4), "t1": round(t + d, 4), "clip": c, "start": st, "speed": 1.0, "n": N_FR[c], "blur": 14, "op": 1, "flash": 0})
        t += d; j += 1
# destellos de 2 cuadros en el gancho, al beat
a, b = seg["gancho"]
for n in range(4, int((b - a) / beat)):
    if n % 2 == 0:
        t0 = a + n * beat
        c, st = bg_plan[n % len(bg_plan)]
        cuts.append({"t0": round(t0, 4), "t1": round(t0 + 0.07, 4), "clip": c, "start": st, "speed": 1, "n": N_FR[c], "op": 0.35, "flash": 0})

# palabras durante el montaje (siguen la frase de la voz)
va = voice_at["montaje"]; vd = dur["montaje"]
wt = [va + vd * f for f in (0.30, 0.47, 0.66)]
snap = lambda x: seg["montaje"][0] + round((x - seg["montaje"][0]) / (beat / 2)) * (beat / 2)
wt = [snap(x) for x in wt]
end_m = seg["montaje"][1]
words = [[wt[0], wt[1]], [wt[1], wt[2]], [wt[2], wt[2] + 2 * beat], [end_m - 3 * beat, end_m]]
hits = [seg["revela"][0], seg["fecha"][0], seg["cierre"][0]]
json.dump({"total": round(TOTAL, 4), "seg": seg, "cuts": cuts, "words": words, "hits": hits}, open(f"{HERE}/timeline.json", "w"))

# =================== AUDIO ===================
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
    buf[s:e] += np.asarray(sig[: e - s], np.float32) * gain


def saw(f, x):
    return 2 * ((f * x) % 1) - 1


def kick():
    x = t_(0.42)
    f = 46 + 120 * np.exp(-x * 32)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 6.5) * 1.8) + filt(rng.standard_normal(len(x)), [2000, 6000], "band") * np.exp(-x * 400) * 0.25


def clap():
    x = t_(0.25)
    n = filt(rng.standard_normal(len(x)), [900, 3800], "band")
    env = sum(np.where(x >= d, np.exp(-(x - d) * (60 if d < 0.02 else 13)), 0) for d in (0, 0.011, 0.022))
    return n * env * 0.8


def hat(o=False):
    x = t_(0.25 if o else 0.05)
    return filt(rng.standard_normal(len(x)), 7500, "high") * np.exp(-x * (13 if o else 70))


def bass(f, L):
    x = t_(L)
    s = np.sin(2 * np.pi * f * x) + 0.6 * saw(f, x)
    s = filt(s, 900, "low")
    return np.tanh(s * np.minimum(1, x / 0.004) * np.exp(-x * 5) * 2.2) * 0.7


def stab(freqs, L=0.22):
    x = t_(L)
    s = sum(saw(f * d, x) for f in freqs for d in (0.994, 1.006))
    return filt(s, 3200, "low") * np.exp(-x * 10) * 0.16


def riser(L):
    x = t_(L)
    n = filt(rng.standard_normal(len(x)), [1500, 9000], "band") * (x / L) ** 2 * 0.5
    tone = np.sin(2 * np.pi * np.cumsum(200 + 1400 * (x / L) ** 2) / SR) * (x / L) ** 2 * 0.15
    return n + tone


def impact():
    x = t_(1.6)
    boom = np.sin(2 * np.pi * (40 + 90 * np.exp(-x * 12)) * x) * np.exp(-x * 3)
    air = filt(rng.standard_normal(len(x)), [600, 8000], "band") * np.exp(-x * 5) * 0.35
    return boom + air


def whoosh(L=0.45, lo=400, hi=5000):
    x = t_(L)
    n = rng.standard_normal(len(x))
    env = np.sin(np.pi * x / L) ** 2
    return (filt(n, [lo, lo * 3], "band") * (1 - x / L) + filt(n, [hi / 3, hi], "band") * (x / L)) * env


def heartbeat():
    s = np.zeros(int(0.6 * SR))
    for d, g in ((0, 1), (0.18, 0.7)):
        x = t_(0.25)
        k = np.sin(2 * np.pi * (45 + 25 * np.exp(-x * 30)) * x) * np.exp(-x * 14) * g
        st = int(d * SR); s[st:st + len(k)] += k
    return s


def neon_buzz(L=0.6):
    x = t_(L)
    s = (saw(120, x) * 0.5 + np.sin(2 * np.pi * 240 * x)) * 0.12
    flick = (np.sin(x * 60) > 0).astype(float) * 0.7 + 0.3
    return filt(s, [150, 3000], "band") * flick * np.exp(-x * 2)


drums = np.zeros(N, np.float32); bs = np.zeros(N, np.float32); keys = np.zeros(N, np.float32); fx = np.zeros(N, np.float32)
pump = np.ones(N, np.float32)
prog = [([220.0, 261.63, 329.63], 55.0), ([174.61, 220.0, 261.63], 43.65), ([196.0, 246.94, 293.66], 49.0), ([164.81, 207.65, 246.94], 41.2)]
g0, g1 = seg["gancho"]
drop = seg["montaje"][0]
brk = (seg["revela"][0] - 2 * beat, seg["revela"][0])     # silencio antes de la revelación
for bi in range(int(TOTAL / beat) + 1):
    tb = bi * beat
    if tb >= TOTAL - 0.4:
        break
    chord, root = prog[(bi // 4) % 4]
    full = tb >= drop and not (brk[0] <= tb < brk[1])
    if full:
        place(drums, kick(), tb, 0.95)
        s = int(tb * SR); e = min(N, s + int(0.3 * SR)); pump[s:e] = np.minimum(pump[s:e], 1 - 0.6 * np.exp(-np.arange(e - s) / SR * 11))
        if bi % 2 == 1:
            place(drums, clap(), tb, 0.55)
        place(drums, hat(True), tb + beat / 2, 0.22)
        place(drums, hat(), tb + beat / 4, 0.07); place(drums, hat(), tb + 3 * beat / 4, 0.07)
        place(bs, bass(root, beat * 0.45), tb + beat / 2, 0.75)
        if bi % 4 == 3:
            place(bs, bass(root * 2, beat * 0.2), tb + 3 * beat / 4, 0.5)
        place(keys, stab(chord), tb + beat * 0.75, 0.9)
    elif tb < drop:
        # intro: latido + acordes filtrados que se van abriendo
        if (bi % 2) == 0:
            place(fx, heartbeat(), tb, 0.55)
        place(keys, filt(stab(chord, 0.4), 500 + 3000 * (tb - g0) / (g1 - g0), "low"), tb, 1.1)
# risers y golpes
place(fx, riser(drop - g0 - 0.2), g0 + 0.2, 0.55)
place(fx, impact(), drop, 0.7)
place(fx, riser(2 * beat), brk[0], 0.6)
place(fx, impact(), seg["revela"][0], 0.85)
for k in ("johan", "sala", "fecha", "cierre"):
    place(fx, whoosh(0.45), seg[k][0] - 0.22, 0.4)
place(fx, neon_buzz(), seg["sala"][0] + 0.2, 0.6)
place(fx, impact(), seg["cierre"][0], 0.55)
for c in cuts:
    if "blur" not in c and c.get("op", 1) == 1 and c["t0"] > drop and rng.random() < 0.35:
        place(fx, whoosh(0.18, 1500, 8000), c["t0"] - 0.08, 0.12)

music = drums + bs + keys * pump
fo = int(1.2 * SR); ei = int(TOTAL * SR)
music[ei - fo:ei] *= np.linspace(1, 0, fo); music[ei:] = 0
music /= np.abs(music).max() + 1e-6
fx /= max(1.0, np.abs(fx).max())

voice = np.zeros(N, np.float32)
for k in ids:
    place(voice, clips[k], voice_at[k])
voice /= np.abs(voice).max() + 1e-6
env = np.convolve(np.abs(voice), np.ones(4800) / 4800, mode="same")
talk = np.clip(env / (env.max() + 1e-6) * 5, 0, 1)
talk = np.convolve(talk, np.ones(9600) / 9600, mode="same")
mix = voice * 0.92 + fx * 0.75 * (1 - 0.3 * talk) + music * (0.42 - 0.2 * talk)
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
mix /= max(1.0, np.abs(mix).max() / 0.95)
wavfile.write(f"{HERE}/audio_mix.wav", SR, (mix * 32767).astype(np.int16))
print("Audio listo")
