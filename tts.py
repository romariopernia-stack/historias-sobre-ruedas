"""Genera la voz (offline, gratis) + tiempos por palabra + música/sfx para una historia.
Uso: python3 tts.py historias/lamborghini.json
Salida: video/public/<slug>/voice.wav, music.wav  y  video/src/data/<slug>.json
"""
import sys, json, re, glob, os, subprocess, asyncio, io
import numpy as np, soundfile as sf

ROOT = os.path.dirname(os.path.abspath(__file__))
# ENGINE=edge -> voz neuronal de Microsoft (natural, gratis, necesita internet)
# ENGINE=piper -> voz offline (respaldo)
ENGINE = os.environ.get("ENGINE", "edge")
EDGE_VOICE = os.environ.get("EDGE_VOICE", "es-MX-JorgeNeural")
EDGE_RATE = os.environ.get("EDGE_RATE", "+8%")
VOICE = os.environ.get("VOICE", "vits-piper-es_MX-ald-medium")
SPEED = float(os.environ.get("SPEED", "1.22"))
SR_OUT = 44100
PAUSE = {",": 0.1, ":": 0.2, ";": 0.15, ".": 0.3, "?": 0.3, "!": 0.3, "…": 0.45}
LEAD_IN = 0.35
SCENE_GAP = 0.18

story = json.load(open(sys.argv[1]))
slug = story["slug"]

if ENGINE == "piper":
    import sherpa_onnx
    d = f"{ROOT}/models/{VOICE}"
    tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(
                model=glob.glob(d + "/*.onnx")[0], tokens=d + "/tokens.txt", data_dir=d + "/espeak-ng-data",
                noise_scale=0.6, noise_scale_w=0.75),
            num_threads=2)))


def edge_synth(text):
    """-> (audio float32 a 44.1k, [(palabra, inicio_s, fin_s), ...])"""
    import edge_tts

    async def run():
        com = edge_tts.Communicate(text, EDGE_VOICE, rate=EDGE_RATE, boundary="WordBoundary")
        mp3, bounds = bytearray(), []
        async for ch in com.stream():
            if ch["type"] == "audio":
                mp3 += ch["data"]
            elif ch["type"] == "WordBoundary":
                bounds.append((ch["text"], ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7))
        return bytes(mp3), bounds

    mp3, bounds = asyncio.run(run())
    wav = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", "pipe:0", "-ac", "1", "-ar", str(SR_OUT), "-f", "wav", "pipe:1"],
                         input=mp3, capture_output=True, check=True).stdout
    a, _ = sf.read(io.BytesIO(wav), dtype="float32")
    return a, bounds


def norm(s):
    return re.sub(r"[^\wáéíóúñü]", "", s.lower())


def tokenize(text):
    """-> lista de palabras {disp, spoken, color, punct}"""
    text = text.replace("...", "…")
    out = []
    # {disp|spoken} puede contener espacios: protegerlo
    parts = re.findall(r"\S*\{[^}]*\}\S*|\S+", text)
    for p in parts:
        color = "white"
        m = re.match(r"^([¿¡]?)([*^]?)(.*?)([*^]?)([,.:;?!…]*)$", p) if "{" not in p else None
        if "{" in p:
            mm = re.match(r"^([¿¡]?)([*^]?)\{([^|]*)\|([^}]*)\}([*^]?)([,.:;?!…]*)$", p)
            pre, mk, disp, spoken, mk2, punct = mm.groups()
            disp, spoken = pre + disp, pre + spoken
        else:
            pre, mk, core, mk2, punct = m.groups()
            # el marcador de cierre puede ir antes o después de la puntuación
            core2 = re.match(r"^(.*?)([,.:;?!…]*)([*^]?)$", core)
            if core2 and core2.group(3):
                core, punct, mk2 = core2.group(1), core2.group(2) + punct, core2.group(3)
            elif core2 and core2.group(2):
                core, punct = core2.group(1), core2.group(2) + punct
            disp = spoken = pre + core
        if mk == "*" or mk2 == "*":
            color = "gold"
        if mk == "^" or mk2 == "^":
            color = "red"
        out.append({"disp": disp + punct, "spoken": spoken + punct, "color": color, "punct": punct[-1:] if punct else ""})
    return out


def trim(a, thr=0.012):
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0:
        return a
    s, e = max(0, idx[0] - 200), min(len(a), idx[-1] + 600)
    return a[s:e]


def weight(w):
    s = re.sub(r"[^\wáéíóúñü]", "", w.lower())
    return len(s) + 1.5


audio = [np.zeros(int(LEAD_IN * SR_OUT), np.float32)]
t = LEAD_IN
scenes = []
for sc in story["scenes"]:
    words = tokenize(sc["text"])
    if ENGINE == "edge":
        # una sola petición por escena: mejor entonación y tiempos reales por palabra
        text = " ".join(w["disp"] for w in words).replace("…", "...")
        a, bounds = edge_synth(text)
        lead = 0
        s_start = t
        out_words, bi = [], 0
        for w in words:
            target = norm(w["disp"])
            if bi >= len(bounds):
                st = en = bounds[-1][2] if bounds else 0
            else:
                st, acc, en = bounds[bi][1], norm(bounds[bi][0]), bounds[bi][2]
                bi += 1
                # una palabra en pantalla puede venir partida en varias (p.ej. números)
                while bi < len(bounds) and len(acc) < len(target) and target.startswith(acc + norm(bounds[bi][0])):
                    acc += norm(bounds[bi][0]); en = bounds[bi][2]; bi += 1
            out_words.append({"text": w["disp"], "color": w["color"], "start": round(t + st, 3), "end": round(t + en, 3)})
        audio.append(a)
        t += len(a) / SR_OUT
        audio.append(np.zeros(int(SCENE_GAP * SR_OUT), np.float32)); t += SCENE_GAP
        scenes.append({"id": sc["id"], "visual": sc["visual"], "start": round(s_start, 3), "end": round(t, 3), "words": out_words})
        continue
    # dividir en cláusulas por puntuación
    clauses, cur = [], []
    for w in words:
        cur.append(w)
        if w["punct"]:
            clauses.append(cur); cur = []
    if cur:
        clauses.append(cur)
    s_start = t
    out_words = []
    for cl in clauses:
        sentence = " ".join(w["spoken"] for w in cl).replace("…", ".")
        g = tts.generate(sentence, sid=0, speed=SPEED)
        a = np.array(g.samples, np.float32)
        a = trim(a)
        # resample a 44.1k
        n = int(len(a) * SR_OUT / g.sample_rate)
        a = np.interp(np.linspace(0, len(a) - 1, n), np.arange(len(a)), a).astype(np.float32)
        dur = len(a) / SR_OUT
        tot = sum(weight(w["spoken"]) for w in cl)
        acc = t
        for w in cl:
            wd = dur * weight(w["spoken"]) / tot
            out_words.append({"text": w["disp"], "color": w["color"], "start": round(acc, 3), "end": round(acc + wd, 3)})
            acc += wd
        audio.append(a)
        t += dur
        p = PAUSE.get(cl[-1]["punct"], 0.12)
        audio.append(np.zeros(int(p * SR_OUT), np.float32))
        t += p
    scenes.append({"id": sc["id"], "visual": sc["visual"], "start": round(s_start, 3), "end": round(t, 3), "words": out_words})

# cola final
audio.append(np.zeros(int(1.6 * SR_OUT), np.float32))
t += 1.6
scenes[-1]["end"] = round(t, 3)
voice = np.concatenate(audio)
voice = voice / (np.abs(voice).max() + 1e-6) * 0.89

# ---------- subtítulos: agrupar en bloques de pantalla ----------
for sc in scenes:
    chunk, n_chars, cid = 0, 0, 0
    for i, w in enumerate(sc["words"]):
        if n_chars and (n_chars + len(w["text"]) > 20 or cid >= 4):
            chunk += 1; n_chars = 0; cid = 0
        w["chunk"] = chunk
        n_chars += len(w["text"]) + 1; cid += 1
        if re.search(r"[.:?!…]$", w["text"]):
            chunk += 1; n_chars = 0; cid = 0

# ---------- música ambiente + whooshes (sintetizada, libre de derechos) ----------
rng = np.random.default_rng(7)
N = len(voice)
tt = np.arange(N) / SR_OUT
music = np.zeros(N, np.float32)
# progresión menor oscura: Am - F - C - G (graves + pad)
chords = [[110.0, 164.81, 220.0, 261.63], [87.31, 130.81, 174.61, 220.0], [65.41, 130.81, 196.0, 261.63], [98.0, 146.83, 196.0, 246.94]]
bar = 4.0
for i, ch in enumerate(chords * 20):
    s = int(i * bar * SR_OUT)
    if s >= N: break
    e = min(N, int((i + 1) * bar * SR_OUT + 0.6 * SR_OUT))
    seg = tt[: e - s]
    env = np.minimum(1, seg / 1.2) * np.exp(-np.maximum(0, seg - bar) * 4)
    pad = sum(np.sin(2 * np.pi * f * seg + 0.3 * np.sin(2 * np.pi * 0.2 * seg)) * (0.5 if f < 120 else 0.22) for f in ch)
    music[s:e] += (pad * env * 0.06).astype(np.float32)
# pulso tipo latido (bombo suave) cada 1s
for k in np.arange(0.0, N / SR_OUT, 1.0):
    s = int(k * SR_OUT); L = int(0.35 * SR_OUT)
    if s + L > N: break
    x = np.arange(L) / SR_OUT
    kick = np.sin(2 * np.pi * (50 + 60 * np.exp(-x * 30)) * x) * np.exp(-x * 9)
    music[s:s + L] += (kick * 0.13).astype(np.float32)
# whoosh en cada cambio de escena
for sc in scenes[1:]:
    s = int((sc["start"] - 0.35) * SR_OUT); L = int(0.7 * SR_OUT)
    if s < 0 or s + L > N: continue
    noise = rng.standard_normal(L).astype(np.float32)
    # filtro paso bajo móvil sencillo
    out = np.zeros(L, np.float32); y = 0.0
    x = np.arange(L) / L
    alpha = 0.02 + 0.25 * np.sin(np.pi * x) ** 2
    for j in range(L):
        y += alpha[j] * (noise[j] - y); out[j] = y
    music[s:s + L] += out * np.sin(np.pi * x) ** 2 * 0.22
# fade in/out
fade = int(1.0 * SR_OUT)
music[:fade] *= np.linspace(0, 1, fade); music[-fade * 2:] *= np.linspace(1, 0, fade * 2)

outdir = f"{ROOT}/video/public/{slug}"; os.makedirs(outdir, exist_ok=True)
os.makedirs(f"{ROOT}/video/src/data", exist_ok=True)
sf.write(f"{outdir}/voice.wav", voice, SR_OUT)
sf.write(f"{outdir}/music.wav", music, SR_OUT)
json.dump({"slug": slug, "duration": round(t, 3), "scenes": scenes}, open(f"{ROOT}/video/src/data/{slug}.json", "w"), ensure_ascii=False, indent=1)
print(f"{slug}: {t:.1f}s, {sum(len(s['words']) for s in scenes)} palabras")
for s in scenes:
    print(f"  {s['id']:8s} {s['start']:5.1f}-{s['end']:5.1f}  ", " ".join(w["text"] for w in s["words"])[:90])
