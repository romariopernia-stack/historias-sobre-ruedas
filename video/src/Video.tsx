import React from 'react';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// Fuente de la marca empaquetada en el proyecto (funciona en cualquier máquina)
const FONT_HANDLE = delayRender('fuentes');
Promise.all(
  [600, 700, 800, 900].map((w) =>
    new FontFace('Poppins', `url(${staticFile(`fonts/poppins-${w}.woff2`)})`, {weight: String(w)}).load().then((f) => document.fonts.add(f)),
  ),
).then(() => continueRender(FONT_HANDLE)).catch(() => continueRender(FONT_HANDLE));
import {BRAND, H, HORIZON, W} from './brand';
import {SceneData, VISUALS, Word} from './scenes';

export type StoryData = {slug: string; duration: number; scenes: SceneData[]};

// ------------------------------------------------ fondo
const Particles: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{position: 'absolute'}}>
      <defs>
        <radialGradient id="pt">
          <stop offset="0" stopColor={BRAND.goldSoft} stopOpacity={1} />
          <stop offset="0.35" stopColor={BRAND.gold} stopOpacity={0.6} />
          <stop offset="1" stopColor={BRAND.gold} stopOpacity={0} />
        </radialGradient>
      </defs>
      {Array.from({length: 90}).map((_, i) => {
        const r = 3 + random(`r${i}`) * (random(`b${i}`) > 0.85 ? 16 : 6);
        const x = random(`x${i}`) * W + Math.sin(f / 60 + i) * 14;
        const sp = 0.15 + random(`s${i}`) * 0.5;
        const y = (((random(`y${i}`) * H - f * sp) % H) + H) % H;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(f / (20 + random(`t${i}`) * 40) + i));
        return <circle key={i} cx={x} cy={y} r={r * 2.4} fill="url(#pt)" opacity={tw * 0.7} />;
      })}
    </svg>
  );
};

const Road: React.FC<{offset: number}> = ({offset}) => {
  const vx = W / 2;
  const project = (z: number) => HORIZON + 260 / z; // z: distancia
  const dashes = [];
  for (let k = 0; k < 14; k++) {
    const z = 0.35 + ((k * 0.55 - offset) % 7.7 + 7.7) % 7.7;
    const z2 = z + 0.25;
    const y1 = project(z), y2 = project(z2);
    if (y1 > H + 200) continue;
    const w1 = 38 / z, w2 = 38 / z2;
    dashes.push(<path key={k} d={`M${vx - w1 / 2},${y1} L${vx + w1 / 2},${y1} L${vx + w2 / 2},${y2} L${vx - w2 / 2},${y2} Z`} fill={BRAND.gold} opacity={Math.min(0.85, 0.25 + 0.6 / z)} />);
  }
  return (
    <svg width={W} height={H} style={{position: 'absolute'}}>
      <defs>
        <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141c2e" />
          <stop offset="1" stopColor="#0a0e18" />
        </linearGradient>
        <linearGradient id="hz" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={BRAND.gold} stopOpacity={0} />
          <stop offset="1" stopColor={BRAND.gold} stopOpacity={0.16} />
        </linearGradient>
      </defs>
      <rect x={0} y={HORIZON - 260} width={W} height={260} fill="url(#hz)" />
      <path d={`M${vx - 60},${HORIZON} L${vx + 60},${HORIZON} L${W + 900},${H} L${-900},${H} Z`} fill="url(#road)" />
      <path d={`M${vx - 60},${HORIZON} L${-900},${H}`} stroke={BRAND.gold} strokeOpacity={0.35} strokeWidth={4} />
      <path d={`M${vx + 60},${HORIZON} L${W + 900},${H}`} stroke={BRAND.gold} strokeOpacity={0.35} strokeWidth={4} />
      <line x1={0} y1={HORIZON} x2={W} y2={HORIZON} stroke={BRAND.gold} strokeOpacity={0.25} strokeWidth={2} />
      {dashes}
    </svg>
  );
};

// ------------------------------------------------ subtítulos palabra por palabra
const Subtitles: React.FC<{words: Word[]}> = ({words}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  // bloque activo = el de la última palabra que ya empezó
  let cur = words.findIndex((w) => w.start > t) - 1;
  if (cur === -2) cur = words.length - 1;
  if (cur < 0) return null;
  const chunk = words[cur].chunk;
  const sceneKey = words[cur];
  const group = words.filter((w) => w.chunk === chunk && (words.indexOf(w) >= 0));
  const colorOf = (c: string) => (c === 'gold' ? BRAND.gold : c === 'red' ? BRAND.red : BRAND.white);
  return (
    <div style={{position: 'absolute', top: 470, left: 70, width: W - 140, height: 300, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', gap: '0 22px', fontFamily: BRAND.font}}>
      {group.map((w, i) => {
        const idx = words.indexOf(w);
        if (w.start > t) return null;
        const age = (t - w.start) * fps;
        const active = idx === cur;
        const pop = interpolate(age, [0, 5], [0.6, 1], {extrapolateRight: 'clamp'});
        const op = interpolate(age, [0, 3], [0, 1], {extrapolateRight: 'clamp'});
        const special = w.color !== 'white';
        const color = active ? colorOf(w.color) : special ? colorOf(w.color) : BRAND.grey;
        return (
          <span
            key={`${sceneKey.start}-${i}`}
            style={{
              fontSize: 88, lineHeight: 1.15, fontWeight: active || special ? 800 : 600, color, opacity: op,
              transform: `scale(${pop})`, display: 'inline-block',
              textShadow: active ? `0 0 28px ${special ? colorOf(w.color) : '#ffffff'}66, 0 4px 18px #000` : '0 4px 18px #000',
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

const SceneWrap: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 7, dur - 6, dur], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sc = interpolate(f, [0, 10], [1.05, 1], {extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{opacity: o, transform: `scale(${sc})`}}>{children}</AbsoluteFill>;
};

export const Story: React.FC<{data: StoryData}> = ({data}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  // velocidad de la carretera (más rápida en la escena del Miura)
  let offset = 0;
  for (let k = 0; k <= f; k++) {
    const tk = k / fps;
    const fast = data.scenes.find((s) => s.visual === 'miura' && tk >= s.start && tk < s.end);
    offset += (fast ? 0.09 : 0.025);
  }
  const allWords = data.scenes.flatMap((s, si) => s.words.map((w) => ({...w, chunk: si * 1000 + w.chunk})));
  const intro = interpolate(t, [0, 0.6], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${BRAND.bgTop} 0%, ${BRAND.bgBottom} 68%, #0a0e18 100%)`}}>
      <Road offset={offset} />
      <Particles />
      {data.scenes.map((s) => {
        const from = Math.round(s.start * fps);
        const dur = Math.max(1, Math.round(s.end * fps) - from);
        const V = VISUALS[s.visual];
        return (
          <Sequence key={s.id} from={from} durationInFrames={dur} layout="none">
            <SceneWrap dur={dur}>{V ? <V s={s} /> : null}</SceneWrap>
          </Sequence>
        );
      })}
      <Subtitles words={allWords} />
      {/* marca de agua */}
      <div style={{position: 'absolute', top: 300, width: W, textAlign: 'center', fontFamily: BRAND.font, fontWeight: 700, fontSize: 26, letterSpacing: 8, color: BRAND.gold, opacity: 0.55 * intro}}>
        HISTORIAS SOBRE RUEDAS
      </div>
      {/* viñeta */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)'}} />
      <Audio src={staticFile(`${data.slug}/voice.wav`)} />
      <Audio src={staticFile(`${data.slug}/music.wav`)} volume={0.9} />
    </AbsoluteFill>
  );
};
