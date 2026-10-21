"""Genera una pista de voz por línea del guion (voz neuronal de Microsoft, gratis).
Uso: python3 ritmo/voz.py ritmo/guion.json  ->  ritmo/salida/<id>.mp3 + duraciones.json"""
import sys, json, os, asyncio, subprocess, time
import edge_tts

g = json.load(open(sys.argv[1]))
out = os.path.join(os.path.dirname(os.path.abspath(sys.argv[1])), "salida")
os.makedirs(out, exist_ok=True)
dur = {}
for ln in g["lineas"]:
    path = f"{out}/{ln['id']}.mp3"
    for intento in range(6):
        try:
            asyncio.run(edge_tts.Communicate(ln["texto"], g["voz"], rate=g.get("rate", "+0%")).save(path))
            break
        except Exception as e:
            print("reintentando:", str(e)[:80]); time.sleep(5 * (intento + 1))
    else:
        raise RuntimeError("El servicio de voz no respondió")
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                             capture_output=True, text=True).stdout.strip())
    dur[ln["id"]] = round(d, 3)
    print(f"{ln['id']:8s} {d:5.2f}s  {ln['texto']}")
json.dump(dur, open(f"{out}/duraciones.json", "w"), indent=1)
