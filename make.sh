#!/bin/bash
# Uso: ./make.sh historias/<slug>.json   -> salida/<slug>.mp4
set -e
cd "$(dirname "$0")"
STORY=$1; SLUG=$(python3 -c "import json,sys;print(json.load(open('$STORY'))['slug'])")
python3 tts.py "$STORY"
# registrar todas las historias en el proyecto de video
( cd video/src/data && echo "// generado por make.sh" > ../stories.ts && for f in *.json; do n=$(basename $f .json | tr '-' '_'); echo "import $n from './data/$f';" >> ../stories.ts; done; echo "export default [$(ls *.json | sed 's/.json//;s/-/_/g' | paste -sd, -)];" >> ../stories.ts )
mkdir -p salida
# 1) imagen (sin audio)  2) se mezcla la voz y la música con ffmpeg
cd video && npx remotion render src/index.ts "$SLUG" ../salida/$SLUG-mudo.mp4 --muted \
  ${CHROME:+--browser-executable=$CHROME} --concurrency=${CONCURRENCY:-2} --crf=20 --timeout=120000 --log=error
ffmpeg -loglevel error -y -i ../salida/$SLUG-mudo.mp4 -i public/$SLUG/voice.wav -i public/$SLUG/music.wav \
  -filter_complex "[1:a][2:a]amix=inputs=2:normalize=0[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart ../salida/$SLUG.mp4
rm ../salida/$SLUG-mudo.mp4
python3 -c "import json;print(json.load(open('../$STORY'))['caption'])" > ../salida/$SLUG.txt
echo "Listo: salida/$SLUG.mp4"
