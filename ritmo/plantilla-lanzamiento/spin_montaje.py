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
BPM = 120
beat = 60 / BPM
ids = ["gancho", "intro", "montaje", "revela", "johan", "sala", "fecha", "cierre"]

clips, dur = {}, {}
for k in ids:
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", f"{VOZ}/{k}.mp3", "-ac", "1", "-ar", str(SR), "-f", "f32le", "pipe:1"],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.float32).copy()
    idx = np.where(np.abs(a) > 0.02 * np.abs(a).max())[0]
    a = a[max(0, idx[0] - 1200): idx[-1] + 2400]
    clips[k] = a; dur[k] = len(a) / SR
print({k: round(v, 2) for k, v in dur.items()})

OFF = {"gancho": 0.9, "intro": 0.3, "montaje": 0.25, "revela": 0.5, "johan": 0.25, "sala": 0.1, "fecha": 0.3, "cierre": 0.25}
MINB = {"gancho": 6, "intro": 8, "montaje": 10, "revela": 8, "johan": 4, "sala": 4, "fecha": 6, "cierre": 10}
TAIL = {"cierre": 0.6, "johan": 0.0, "sala": 0.25, "gancho": 0.3, "revela": 0.2, "intro": 0.2, "montaje": 0.15, "fecha": 0.25}
seg, voice_at, T = {}, {}, 0.0
for k in ids:
    need = OFF[k] + dur[k] + TAIL.get(k, 0.4)
    nb = max(MINB[k], math.ceil(need / beat))
    if k in ("montaje", "revela"):
        nb += nb % 2
    seg[k] = [round(T, 4), round(T + nb * beat, 4)]
    voice_at[k] = T + OFF[k]
    T += nb * beat
TOTAL = T
print("segmentos:", seg, "total", round(TOTAL, 2))

# ---------- tomas en cámara lenta (siluetas) ----------
NF = 78
cuts = []
def add_seq(k, shots):
    a, b = seg[k]; n = len(shots); L = (b - a) / n
    for i, sh in enumerate(shots):
        prev = len(cuts) - 1 if cuts and abs(cuts[-1]["t1"] - (a + i * L)) < 1e-3 else None
        cuts.append({"t0": round(a + i * L, 4), "t1": round(a + (i + 1) * L, 4), "dir": "cf2", "clip": sh, "start": 0.05,
                     "speed": min(1.0, (NF / 30 - 0.1) / L), "n": NF, "xf": 0.35 if prev is not None or i > 0 else 0.6, "prev": prev, "flash": 0})
add_seq("intro", ["P1", "P2", "S5"])
add_seq("montaje", ["S3", "S4", "S6", "S7", "S8"])
cuts[0]["xf"] = 0
bg = ["P1", "S4", "S6", "S3", "S7"]
j = 0
for k in ("revela", "fecha", "cierre"):
    a, b = seg[k]; t = a
    while t < b - 1e-6:
        d = min(4 * beat, b - t)
        cuts.append({"t0": round(t, 4), "t1": round(t + d, 4), "dir": "cf2", "clip": bg[j % len(bg)], "start": 0.1, "speed": 0.6, "n": NF, "blur": 16, "op": 1, "flash": 0})
        t += d; j += 1

subs = [[voice_at["intro"] - 0.1, seg["intro"][1] - 0.1, "Ponte los audífonos… y deja que la música te lleve"]]
va, vd = voice_at["montaje"], dur["montaje"]
w = [va + vd * f for f in (0.02, 0.36, 0.72)]
words = [[w[0], w[1]], [w[1], w[2]], [w[2], seg["montaje"][1] - 0.05]]
hits = [seg["revela"][0]]
json.dump({"total": round(TOTAL, 4), "seg": seg, "cuts": cuts, "words": words, "hits": hits, "subs": subs}, open(f"{HERE}/timeline.json", "w"))

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
drop = seg["revela"][0]
m0, m1 = seg["montaje"]
i0 = seg["intro"][0]


def pad(freqs, L):
    x = t_(L)
    s_ = sum(np.sin(2 * np.pi * f * x + 0.4 * np.sin(2 * np.pi * 0.3 * x)) + 0.25 * np.sin(2 * np.pi * f * 2.003 * x) for f in freqs)
    env = np.minimum(1, x / 0.8) * np.minimum(1, (L - x) / 0.6)
    return s_ * env * 0.06


for bi in range(int(TOTAL / beat) + 1):
    tb = bi * beat
    if tb >= TOTAL - 0.4:
        break
    chord, root = prog[(bi // 4) % 4]
    if bi % 4 == 0:
        place(keys, pad(chord, 4 * beat + 0.6), tb, 1.0 if tb < drop else 0.6)
    if tb < i0:
        continue                                    # gancho: solo ambiente
    if tb < m0:                                     # intro: latido lento
        if bi % 2 == 0:
            place(fx, heartbeat(), tb, 0.6)
        continue
    if tb < drop - 2 * beat:                        # montaje: build filtrado
        prog_ = (tb - m0) / (drop - m0)
        place(drums, filt(kick(), 300 + 2500 * prog_, "low"), tb, 0.55 + 0.35 * prog_)
        place(drums, hat(), tb + beat / 2, 0.05 + 0.15 * prog_)
        if bi % 2 == 1:
            place(bs, bass(root, beat * 0.4), tb + beat / 2, 0.35 * prog_)
        continue
    if tb < drop:
        continue                                    # silencio antes del golpe
    place(drums, kick(), tb, 0.95)
    s_ = int(tb * SR); e = min(N, s_ + int(0.3 * SR)); pump[s_:e] = np.minimum(pump[s_:e], 1 - 0.6 * np.exp(-np.arange(e - s_) / SR * 11))
    if bi % 2 == 1:
        place(drums, clap(), tb, 0.5)
    place(drums, hat(True), tb + beat / 2, 0.2)
    place(drums, hat(), tb + beat / 4, 0.06); place(drums, hat(), tb + 3 * beat / 4, 0.06)
    place(bs, bass(root, beat * 0.45), tb + beat / 2, 0.75)
    place(keys, stab(chord), tb + beat * 0.75, 0.8)
place(fx, riser(drop - m0), m0, 0.55)
place(fx, impact(), drop, 0.9)
for k in ("johan", "sala", "fecha", "cierre"):
    place(fx, whoosh(0.5), seg[k][0] - 0.25, 0.35)
place(fx, neon_buzz(), seg["sala"][0] + 0.2, 0.6)
place(fx, impact(), seg["cierre"][0], 0.45)
place(fx, whoosh(1.2, 120, 2000), i0 - 0.6, 0.35)
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
mix = voice * 0.95 + fx * 0.7 * (1 - 0.3 * talk) + music * (0.40 - 0.2 * talk)
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
mix /= max(1.0, np.abs(mix).max() / 0.95)
wavfile.write(f"{HERE}/audio_mix.wav", SR, (mix * 32767).astype(np.int16))
print("Audio listo")
