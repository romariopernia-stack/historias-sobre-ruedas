import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND} from './brand';
import {BullHead, Bust, Clutch, HorseHead, Label, SportsCar, Tractor, usePop} from './shapes';
import {EscenaGenerica} from './escena';

export type Word = {text: string; color: string; start: number; end: number; chunk: number};
export type SceneData = {id: string; visual: string; start: number; end: number; words: Word[]; e?: any};

/** frame local (dentro de la escena) en que se dice la primera palabra que contiene `w` */
export const wf = (s: SceneData, w: string, fps: number) => {
  const x = s.words.find((k) => k.text.toLowerCase().includes(w.toLowerCase()));
  return x ? Math.round((x.start - s.start) * fps) : 0;
};

const Abs: React.FC<{x: number; y: number; children: React.ReactNode; style?: React.CSSProperties}> = ({x, y, children, style}) => (
  <div style={{position: 'absolute', left: x, top: y, ...style}}>{children}</div>
);

const BigText: React.FC<{text: string; y: number; color?: string; size?: number; delay?: number; sub?: string}> = ({
  text, y, color = BRAND.white, size = 150, delay = 0, sub,
}) => {
  const p = usePop(delay, 16);
  return (
    <div style={{position: 'absolute', top: y, width: 1080, textAlign: 'center', fontFamily: BRAND.font, opacity: p}}>
      <div
        style={{
          fontSize: size, fontWeight: 800, color, letterSpacing: size * 0.06, lineHeight: 1,
          transform: `scale(${0.85 + 0.15 * p})`, textShadow: color === BRAND.white ? 'none' : `0 0 40px ${color}88`,
        }}
      >
        {text}
      </div>
      {sub && (
        <div style={{fontSize: size * 0.3, fontWeight: 600, color: BRAND.grey, letterSpacing: size * 0.04, marginTop: 14}}>{sub}</div>
      )}
    </div>
  );
};

const enterX = (f: number, delay: number, from: number, to: number, fps: number) =>
  interpolate(spring({frame: f - delay, fps, config: {damping: 18, mass: 1}}), [0, 1], [from, to]);

// ---------------------------------------------------------------- escenas
const Versus: React.FC<{s: SceneData}> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tT = wf(s, 'tractor', fps) - 6;
  const tP = wf(s, 'pelea', fps);
  const vs = usePop(tP, 9);
  return (
    <AbsoluteFill>
      <Abs x={enterX(f, 0, 1200, 500, fps)} y={1230}>
        <SportsCar color={BRAND.gold} width={560} spin={-f * 12} glow />
      </Abs>
      <Abs x={enterX(f, tT, -560, 10, fps)} y={1080}>
        <Tractor width={470} spin={f * 6} smoke={f / 40} />
      </Abs>
      <div
        style={{
          position: 'absolute', top: 880, width: 1080, textAlign: 'center', fontFamily: BRAND.font, fontWeight: 900,
          fontSize: 200, color: BRAND.gold, opacity: vs, transform: `scale(${0.4 + vs * 0.6}) rotate(${(1 - vs) * -20}deg)`,
          textShadow: `0 0 60px ${BRAND.gold}`,
        }}
      >
        VS
      </div>
    </AbsoluteFill>
  );
};

const Fabrica: React.FC<{s: SceneData}> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const b = usePop(0, 18);
  const tM = wf(s, 'tractores', fps);
  return (
    <AbsoluteFill>
      <BigText text="ITALIA" sub="AÑOS 60" y={780} size={140} />
      <svg width={1080} height={1920} style={{position: 'absolute', opacity: b}}>
        <g transform={`translate(0 ${(1 - b) * 40})`}>
          {/* fábrica */}
          <rect x={250} y={1110} width={580} height={220} fill={BRAND.steel} />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${250 + i * 116},1110 L${250 + i * 116 + 116},1110 L${250 + i * 116 + 116},1050 Z`} fill="#34405a" />
          ))}
          <rect x={720} y={960} width={46} height={150} fill="#34405a" />
          {[0, 1, 2, 3].map((i) => {
            const p = ((f / 50 + i / 4) % 1);
            return <circle key={i} cx={743 + p * 60} cy={950 - p * 160} r={16 + p * 40} fill="#c7cbd4" opacity={0.3 * (1 - p)} />;
          })}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={282 + i * 90} y={1160} width={56} height={46} fill={BRAND.gold} opacity={0.5 + 0.4 * Math.sin(f / 10 + i)} />
          ))}
          <rect x={440} y={1240} width={200} height={90} fill="#1b2232" />
        </g>
      </svg>
      {[0, 1].map((i) => {
        const x = ((f * 7 + i * 620) % 1500) - 420;
        return (
          <Abs key={i} x={x} y={1290 + i * 30}>
            <Tractor width={250} spin={f * 8} smoke={f / 30 + i} />
          </Abs>
        );
      })}
      <Label x={540} y={1120} tx={760} ty={1040} text="TRACTORES" color={BRAND.gold} delay={tM - 4} />
    </AbsoluteFill>
  );
};

const Garaje: React.FC<{s: SceneData}> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tE = wf(s, 'embrague', fps);
  const tP = wf(s, 'problema', fps);
  const warn = usePop(tE - 4, 8);
  const shake = f > tP ? Math.sin(f * 2.3) * 6 * Math.min(1, (f - tP) / 6) : 0;
  return (
    <AbsoluteFill>
      {[0, 1, 2].map((i) => {
        const x = enterX(f, i * 5, 1100, 130 + i * 70, fps);
        const sh = i === 1 ? shake : 0;
        return (
          <Abs key={i} x={x + sh} y={830 + i * 180} style={{opacity: i === 1 ? 1 : f > tP ? 0.45 : 1}}>
            <SportsCar color={BRAND.red} width={i === 1 ? 600 : 520} />
          </Abs>
        );
      })}
      <Label x={420} y={880} tx={560} ty={790} text="SUS FERRARI" color={BRAND.red} delay={wf(s, 'Ferrari', fps)} />
      <div
        style={{
          position: 'absolute', left: 540, top: 880, width: 300, textAlign: 'center', opacity: warn,
          transform: `scale(${warn}) translateY(${Math.sin(f / 4) * 6}px)`,
        }}
      >
        <svg width={200} height={180} viewBox="0 0 200 180">
          <path d="M100,10 L190,170 L10,170 Z" fill={BRAND.gold} stroke="#000" strokeOpacity={0.2} strokeWidth={6} strokeLinejoin="round" />
          <rect x={92} y={60} width={16} height={60} rx={6} fill="#0d1320" />
          <circle cx={100} cy={142} r={10} fill="#0d1320" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

const Pieza: React.FC<{s: SceneData}> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tM = wf(s, 'misma', fps);
  const tT = wf(s, 'tractores', fps);
  const tC = wf(s, 'cobraba', fps);
  const a = usePop(0);
  const b = usePop(tT - 6);
  const eq = usePop(tM, 9);
  const bars = interpolate(f, [tC, tC + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const moneyR = Math.round(interpolate(f, [tC, tC + 30], [1, 6], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return (
    <AbsoluteFill>
      <Abs x={90} y={840} style={{opacity: a, transform: `scale(${a})`}}>
        <Clutch size={340} spin={f * 2} />
      </Abs>
      <Abs x={650} y={840} style={{opacity: b, transform: `scale(${b})`}}>
        <Clutch size={340} spin={-f * 2} />
      </Abs>
      <div style={{position: 'absolute', top: 920, width: 1080, textAlign: 'center', fontFamily: BRAND.font, fontWeight: 900, fontSize: 170, color: BRAND.gold, opacity: eq, transform: `scale(${eq})`, textShadow: `0 0 50px ${BRAND.gold}`}}>
        =
      </div>
      <div style={{position: 'absolute', top: 1200, left: 90, width: 340, textAlign: 'center', fontFamily: BRAND.font, fontWeight: 700, fontSize: 42, letterSpacing: 5, color: BRAND.gold, opacity: a}}>FERRARI</div>
      <div style={{position: 'absolute', top: 1200, left: 650, width: 340, textAlign: 'center', fontFamily: BRAND.font, fontWeight: 700, fontSize: 42, letterSpacing: 5, color: BRAND.gold, opacity: b}}>TRACTOR</div>
      <div style={{position: 'absolute', top: 1290, left: 120, width: 840, fontFamily: BRAND.font, opacity: bars}}>
        {[
          {t: 'TRACTOR', c: BRAND.gold, w: 0.18, m: '$'},
          {t: 'FERRARI', c: BRAND.red, w: 0.92, m: '$'.repeat(moneyR)},
        ].map((r) => (
          <div key={r.t} style={{display: 'flex', alignItems: 'center', marginBottom: 18}}>
            <div style={{width: 200, color: BRAND.white, fontWeight: 700, fontSize: 34, letterSpacing: 3}}>{r.t}</div>
            <div style={{height: 46, width: 600 * r.w * bars, background: r.c, borderRadius: 8, boxShadow: `0 0 30px ${r.c}66`, display: 'flex', alignItems: 'center', paddingLeft: 12, color: '#0d1320', fontWeight: 900, fontSize: 34, overflow: 'hidden', whiteSpace: 'nowrap'}}>
              {r.m}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Enzo: React.FC<{s: SceneData}> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tE = wf(s, 'Enzo', fps);
  const tR = wf(s, 'respondió', fps);
  const bub = usePop(tR, 10);
  return (
    <AbsoluteFill>
      <Abs x={enterX(f, 0, -400, 60, fps)} y={900}>
        <Bust color={BRAND.gold} size={400} />
      </Abs>
      <Abs x={enterX(f, tE - 4, 1100, 620, fps)} y={900}>
        <Bust color={BRAND.red} size={400} flip mustache />
      </Abs>
      <Label x={260} y={1300} tx={262} ty={1420} text="FERRUCCIO" color={BRAND.gold} delay={4} size={38} />
      <Label x={820} y={1300} tx={818} ty={1420} text="ENZO" color={BRAND.red} delay={tE + 6} size={38} />
      <div style={{position: 'absolute', left: 560, top: 820, opacity: bub, transform: `scale(${bub})`, transformOrigin: '80% 100%'}}>
        <svg width={220} height={150} viewBox="0 0 220 150">
          <path d="M20,10 L200,10 Q212,10 212,22 L212,96 Q212,108 200,108 L150,108 L170,142 L118,108 L20,108 Q8,108 8,96 L8,22 Q8,10 20,10 Z" fill={BRAND.white} />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={70 + i * 40} cy={59} r={11} fill="#0d1320" opacity={0.4 + 0.6 * ((Math.floor(f / 6) % 3) === i ? 1 : 0)} />
          ))}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

const Frase: React.FC<{s: SceneData}> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const q = usePop(0, 12);
  const tN = wf(s, 'nunca', fps);
  const flash = interpolate(f, [tN, tN + 4, tN + 18], [0, 0.35, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const carX = interpolate(f, [tN, tN + 40], [-700, 1200], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: BRAND.red, opacity: flash}} />
      <div style={{position: 'absolute', left: 70, top: 300, fontFamily: 'Georgia, serif', fontSize: 380, color: BRAND.gold, opacity: 0.9 * q, lineHeight: 1, transform: `scale(${q})`}}>“</div>
      <div style={{position: 'absolute', right: 70, top: 640, fontFamily: 'Georgia, serif', fontSize: 380, color: BRAND.gold, opacity: 0.9 * q, lineHeight: 1, transform: `scale(${q})`}}>”</div>
      <Abs x={enterX(f, 6, -500, 90, fps)} y={1110} style={{opacity: 0.95}}>
        <Tractor width={360} spin={f * 4} smoke={f / 40} />
      </Abs>
      <Abs x={carX} y={1260}>
        <SportsCar color={BRAND.red} width={560} spin={f * 25} />
      </Abs>
      <div style={{position: 'absolute', top: 1000, width: 1080, textAlign: 'center', fontFamily: BRAND.font, fontWeight: 600, fontSize: 36, letterSpacing: 8, color: BRAND.grey, opacity: q}}>
        — ENZO FERRARI (SEGÚN LA LEYENDA)
      </div>
    </AbsoluteFill>
  );
};

const Mapa: React.FC<{s: SceneData}> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t63 = wf(s, '1963', fps);
  const tK = wf(s, 'kilómetros', fps);
  const yr = usePop(t63 - 2, 12);
  const pinA = usePop(tK - 20, 10);
  const pinB = usePop(t63 + 6, 10);
  const line = interpolate(f, [tK - 10, tK + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const digits = '1963'.split('');
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 800, width: 1080, display: 'flex', justifyContent: 'center', fontFamily: BRAND.font, fontWeight: 800, fontSize: 210, color: BRAND.gold, textShadow: `0 0 50px ${BRAND.gold}88`}}>
        {digits.map((d, i) => {
          const p = spring({frame: f - t63 + 2 - i * 3, fps, config: {damping: 14}});
          return <span key={i} style={{display: 'inline-block', opacity: p * yr, transform: `translateY(${(1 - p) * 80}px)`}}>{d}</span>;
        })}
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <path
          d="M300,1250 Q500,1120 760,1130"
          stroke={BRAND.white}
          strokeWidth={5}
          strokeDasharray="14 12"
          fill="none"
          pathLength={1}
          style={{strokeDasharray: `${line} 1`}}
          opacity={0.85}
        />
        <g transform={`translate(300 1250) scale(${pinA})`}>
          <path d="M0,0 Q-34,-50 -34,-74 A34,34 0 1 1 34,-74 Q34,-50 0,0 Z" fill={BRAND.red} />
          <circle cy={-76} r={13} fill="#0d1320" />
        </g>
        <g transform={`translate(760 1130) scale(${pinB})`}>
          <path d="M0,0 Q-34,-50 -34,-74 A34,34 0 1 1 34,-74 Q34,-50 0,0 Z" fill={BRAND.gold} />
          <circle cy={-76} r={13} fill="#0d1320" />
        </g>
      </svg>
      <div style={{position: 'absolute', left: 140, top: 1280, fontFamily: BRAND.font, fontWeight: 700, fontSize: 34, letterSpacing: 4, color: BRAND.red, opacity: pinA}}>MARANELLO<br /><span style={{color: BRAND.grey, fontSize: 28}}>FERRARI</span></div>
      <div style={{position: 'absolute', left: 600, top: 1160, fontFamily: BRAND.font, fontWeight: 700, fontSize: 34, letterSpacing: 4, color: BRAND.gold, opacity: pinB}}>SANT'AGATA<br /><span style={{color: BRAND.grey, fontSize: 28}}>LAMBORGHINI</span></div>
      <div style={{position: 'absolute', left: 430, top: 1110, fontFamily: BRAND.font, fontWeight: 800, fontSize: 40, color: BRAND.white, opacity: line}}>≈ 25 KM</div>
    </AbsoluteFill>
  );
};

const Miura: React.FC<{s: SceneData}> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tM = wf(s, 'Miura', fps);
  const tS = wf(s, 'superdeportivo', fps);
  const x = enterX(f, 0, -800, 230, fps);
  const tag = usePop(tS - 4, 10);
  return (
    <AbsoluteFill>
      <BigText text="1966" y={800} size={150} color={BRAND.white} delay={2} />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const len = 200 + ((i * 97) % 160);
        const y = 1170 + i * 30;
        const off = (f * 40 + i * 180) % 1400;
        return <div key={i} style={{position: 'absolute', left: x - off * 0.4 - len + 100, top: y, width: len, height: 4, borderRadius: 2, background: `linear-gradient(90deg, transparent, ${BRAND.goldSoft})`, opacity: 0.5}} />;
      })}
      <Abs x={x} y={1150 + Math.sin(f / 3) * 2}>
        <SportsCar color={BRAND.gold} width={680} spin={f * 30} low glow />
      </Abs>
      <Label x={560} y={1200} tx={700} ty={1060} text="MIURA" color={BRAND.gold} delay={tM} size={46} />
      <div style={{position: 'absolute', top: 1420, width: 1080, display: 'flex', justifyContent: 'center', opacity: tag, transform: `scale(${tag})`}}>
        <div style={{fontFamily: BRAND.font, fontWeight: 800, fontSize: 40, letterSpacing: 4, color: '#0d1320', background: BRAND.gold, padding: '14px 34px', borderRadius: 60, boxShadow: `0 0 40px ${BRAND.gold}88`}}>
          1er SUPERDEPORTIVO
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Toro: React.FC<{s: SceneData}> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tTa = wf(s, 'Tauro', fps);
  const tC = wf(s, 'caballo', fps);
  const tB = wf(s, 'bravo', fps);
  const bull = usePop(0, 12);
  const horse = usePop(tC - 6, 12);
  const sign = usePop(tTa - 4, 12);
  const move = spring({frame: f - tC + 8, fps, config: {damping: 18}});
  const pulse = 1 + 0.12 * Math.max(0, Math.sin(Math.max(0, f - tB) / 3)) * (f > tB ? 1 : 0);
  const bx = interpolate(move, [0, 1], [540, 760]);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: bx - 190, top: 860, width: 380, height: 380, borderRadius: 400, border: `6px solid ${BRAND.gold}`, background: `radial-gradient(circle, ${BRAND.gold}33, transparent 70%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: bull, transform: `scale(${bull * pulse})`, boxShadow: `0 0 60px ${BRAND.gold}55`}}>
        <BullHead size={270} />
      </div>
      <div style={{position: 'absolute', left: 130, top: 900, width: 300, height: 300, borderRadius: 400, border: `6px solid ${BRAND.red}`, background: `radial-gradient(circle, ${BRAND.red}33, transparent 70%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: horse, transform: `scale(${horse})`}}>
        <HorseHead size={220} />
      </div>
      <div style={{position: 'absolute', top: 1290, width: 1080, textAlign: 'center', fontFamily: BRAND.font, opacity: sign, transform: `translateY(${(1 - sign) * 30}px)`}}>
        <div style={{fontSize: 70, fontWeight: 800, color: BRAND.gold, letterSpacing: 10}}>♉ TAURO</div>
        <div style={{fontSize: 34, fontWeight: 600, color: BRAND.grey, letterSpacing: 6, marginTop: 6}}>NACIÓ EL 28 · ABR · 1916</div>
      </div>
    </AbsoluteFill>
  );
};

const Cierre: React.FC<{s: SceneData}> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tT = wf(s, 'tractor', fps);
  const tO = wf(s, 'orgullo', fps);
  const g1 = interpolate(f, [tT, tT + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const g2 = interpolate(f, [tO, tO + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <Abs x={enterX(f, 0, -500, 40, fps)} y={1000} style={{filter: `drop-shadow(0 0 ${30 * g1}px ${BRAND.gold})`}}>
        <Tractor width={400} spin={f * 3} smoke={f / 40} />
      </Abs>
      <Abs x={enterX(f, 4, 1200, 470, fps)} y={1180} style={{filter: `drop-shadow(0 0 ${30 * g2}px ${BRAND.gold})`}}>
        <SportsCar color={BRAND.gold} width={560} low />
      </Abs>
      <div style={{position: 'absolute', top: 1500, left: 140, width: 800, height: 6, borderRadius: 3, background: BRAND.gold, opacity: g2, transform: `scaleX(${g2})`, boxShadow: `0 0 30px ${BRAND.gold}`}} />
    </AbsoluteFill>
  );
};

const Cta: React.FC<{s: SceneData}> = () => {
  const f = useCurrentFrame();
  const p = usePop(0, 14);
  const p2 = usePop(10, 12);
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 820, opacity: p, transform: `scale(${p}) rotate(${(1 - p) * -90}deg)`}}>
        <BrandBadge size={300} spin={f * 2} />
      </div>
      <div style={{position: 'absolute', top: 1150, width: 1080, textAlign: 'center', fontFamily: BRAND.font, opacity: p2}}>
        <div style={{fontSize: 72, fontWeight: 800, color: BRAND.white, letterSpacing: 4, lineHeight: 1.1}}>{BRAND.name}</div><div style={{fontSize: 34, fontWeight: 600, color: BRAND.gold, letterSpacing: 2, marginTop: 10}}>{BRAND.tagline}</div>
        <div style={{display: 'inline-block', marginTop: 34, fontSize: 40, fontWeight: 800, color: '#0d1320', background: BRAND.gold, padding: '14px 40px', borderRadius: 60, letterSpacing: 4, transform: `scale(${1 + 0.04 * Math.sin(f / 5)})`}}>
          SÍGUENOS
        </div>
        {BRAND.handle ? <div style={{marginTop: 22, fontSize: 34, fontWeight: 600, color: BRAND.grey}}>{BRAND.handle}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

/** Logo: monograma de la marca */
export const BrandBadge: React.FC<{size?: number; spin?: number}> = ({size = 200, spin = 0}) => (
  <svg width={size} height={size} viewBox="-100 -100 200 200">
    <circle r={96} fill="#0d1320" stroke={BRAND.gold} strokeWidth={6} />
    <g transform={`rotate(${spin})`}>
      {Array.from({length: 36}).map((_, i) => (
        <circle key={i} cx={0} cy={-84} r={3} fill={BRAND.gold} opacity={0.55} transform={`rotate(${i * 10})`} />
      ))}
    </g>
    <text x={0} y={30} textAnchor="middle" fontFamily={BRAND.font} fontWeight={900} fontSize={92} fill={BRAND.white} letterSpacing={-4}>E<tspan fill={BRAND.gold}>L</tspan></text>
  </svg>
);

export const VISUALS: Record<string, React.FC<{s: SceneData}>> = {
  versus: Versus, fabrica: Fabrica, garaje: Garaje, pieza: Pieza, enzo: Enzo, frase: Frase,
  mapa: Mapa, miura: Miura, toro: Toro, cierre: Cierre, cta: Cta, escena: EscenaGenerica as any,
};
