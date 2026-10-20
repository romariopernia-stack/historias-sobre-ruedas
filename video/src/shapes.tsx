import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND} from './brand';

export const Glow: React.FC<{id: string; std?: number}> = ({id, std = 8}) => (
  <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation={std} result="b" />
    <feMerge>
      <feMergeNode in="b" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
);

const Wheel: React.FC<{cx: number; cy: number; r: number; spin: number; rim?: string}> = ({cx, cy, r, spin, rim = '#c9ccd3'}) => (
  <g transform={`translate(${cx} ${cy}) rotate(${spin})`}>
    <circle r={r} fill="#0c0f16" />
    <circle r={r * 0.62} fill={rim} />
    <circle r={r * 0.5} fill="#5b6273" />
    {[0, 72, 144, 216, 288].map((a) => (
      <rect key={a} x={-r * 0.06} y={-r * 0.5} width={r * 0.12} height={r * 0.5} fill={rim} transform={`rotate(${a})`} />
    ))}
    <circle r={r * 0.14} fill={rim} />
  </g>
);

/** Deportivo genérico de los 60 (vista lateral). viewBox 600x200 */
export const SportsCar: React.FC<{color: string; spin?: number; low?: boolean; glow?: boolean; width?: number}> = ({
  color,
  spin = 0,
  low = false,
  glow = false,
  width = 600,
}) => {
  const body = low
    ? 'M14,150 Q16,124 70,116 Q170,106 240,84 Q300,58 372,66 Q430,74 476,98 Q556,106 582,118 Q594,128 592,150 Z'
    : 'M18,150 Q22,122 70,112 Q150,100 228,92 Q262,62 330,58 Q392,58 430,92 Q540,100 578,114 Q592,124 590,150 Z';
  const glass = low
    ? 'M258,88 Q306,66 368,72 Q412,78 446,98 L262,100 Z'
    : 'M246,94 Q272,70 330,68 Q382,68 410,94 Z';
  return (
    <svg width={width} height={width / 3} viewBox="0 0 600 200" style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id={`car-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} />
          <stop offset="1" stopColor={color} stopOpacity={0.72} />
        </linearGradient>
      </defs>
      <ellipse cx={300} cy={190} rx={280} ry={10} fill="#000" opacity={0.45} />
      <path d={body} fill={`url(#car-${color})`} />
      <path d={glass} fill="#0d1320" opacity={0.92} />
      <path d={low ? 'M90,128 L560,124' : 'M80,126 L565,122'} stroke="#fff" strokeOpacity={0.25} strokeWidth={3} />
      <rect x={570} y={118} width={18} height={8} rx={3} fill={BRAND.goldSoft} />
      <rect x={16} y={124} width={12} height={8} rx={3} fill={BRAND.red} />
      {glow && <ellipse cx={640} cy={124} rx={70} ry={14} fill={BRAND.goldSoft} opacity={0.25} />}
      <Wheel cx={130} cy={150} r={38} spin={spin} />
      <Wheel cx={480} cy={150} r={38} spin={spin} />
    </svg>
  );
};

/** Tractor genérico. viewBox 400x300 */
export const Tractor: React.FC<{color?: string; spin?: number; width?: number; smoke?: number}> = ({
  color = BRAND.gold,
  spin = 0,
  width = 400,
  smoke = 0,
}) => (
  <svg width={width} height={(width * 300) / 400} viewBox="0 0 400 300" style={{overflow: 'visible'}}>
    <ellipse cx={210} cy={292} rx={190} ry={9} fill="#000" opacity={0.45} />
    {/* humo */}
    {[0, 1, 2].map((i) => {
      const p = (smoke + i / 3) % 1;
      return <circle key={i} cx={305 - p * 40} cy={70 - p * 90} r={8 + p * 22} fill="#c7cbd4" opacity={0.35 * (1 - p)} />;
    })}
    <rect x={298} y={78} width={12} height={80} rx={4} fill="#3b4459" />
    {/* cabina */}
    <path d="M70,40 L200,40 L200,52 L82,52 Z" fill={color} />
    <rect x={76} y={50} width={10} height={110} fill="#3b4459" />
    <rect x={186} y={50} width={10} height={110} fill="#3b4459" />
    {/* cuerpo */}
    <path d="M150,150 L180,118 L372,128 Q384,132 384,150 L384,214 L170,214 Z" fill={color} />
    <path d="M196,134 L360,140" stroke="#fff" strokeOpacity={0.3} strokeWidth={4} />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={352} y={156 + i * 12} width={26} height={5} rx={2} fill="#1b2232" />
    ))}
    <path d="M60,160 L200,160 L200,214 L40,214 Z" fill={color} opacity={0.85} />
    <rect x={118} y={128} width={44} height={14} rx={6} fill="#1b2232" />
    <Wheel cx={110} cy={210} r={84} spin={spin} rim={color} />
    <Wheel cx={326} cy={246} r={46} spin={spin * 1.8} rim={color} />
  </svg>
);

/** Disco de embrague */
export const Clutch: React.FC<{size?: number; spin?: number; color?: string}> = ({size = 300, spin = 0, color = '#c9ccd3'}) => (
  <svg width={size} height={size} viewBox="-100 -100 200 200">
    <g transform={`rotate(${spin})`}>
      <circle r={96} fill="#3a2f22" />
      <circle r={90} fill="none" stroke="#6b5640" strokeWidth={6} strokeDasharray="10 6" />
      <circle r={70} fill={color} />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <g key={a} transform={`rotate(${a}) translate(0 -44)`}>
          <rect x={-9} y={-14} width={18} height={28} rx={4} fill="#1b2232" />
          <path d="M-6,-10 L6,-5 L-6,0 L6,5 L-6,10" stroke={BRAND.gold} strokeWidth={2.5} fill="none" />
        </g>
      ))}
      <circle r={22} fill="#1b2232" />
      <circle r={12} fill={color} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <rect key={a} x={-2} y={-12} width={4} height={6} fill="#1b2232" transform={`rotate(${a})`} />
      ))}
    </g>
  </svg>
);

/** Busto plano (silueta) */
export const Bust: React.FC<{color: string; flip?: boolean; size?: number; mustache?: boolean}> = ({color, flip, size = 300, mustache}) => (
  <svg width={size} height={size} viewBox="0 0 200 200" style={{transform: flip ? 'scaleX(-1)' : undefined}}>
    <path d="M30,200 Q36,140 100,132 Q164,140 170,200 Z" fill={color} />
    <path d="M84,120 L116,120 L118,140 L82,140 Z" fill={color} opacity={0.8} />
    <ellipse cx={100} cy={82} rx={40} ry={48} fill={color} />
    <path d="M62,70 Q66,32 104,32 Q140,34 140,66 Q124,50 96,54 Q74,56 62,70 Z" fill="#0d1320" opacity={0.55} />
    <circle cx={122} cy={84} r={4} fill="#0d1320" />
    <path d="M136,84 L146,96 L136,100" fill={color} />
    {mustache && <path d="M112,106 Q126,100 138,108 Q126,112 112,110 Z" fill="#0d1320" opacity={0.6} />}
  </svg>
);

/** Toro genérico (cabeza frontal) */
export const BullHead: React.FC<{size?: number; color?: string}> = ({size = 260, color = BRAND.gold}) => (
  <svg width={size} height={size} viewBox="-100 -100 200 200">
    <path d="M-38,-40 Q-90,-44 -92,-92 Q-70,-62 -40,-62 Z" fill={color} />
    <path d="M38,-40 Q90,-44 92,-92 Q70,-62 40,-62 Z" fill={color} />
    <path d="M-62,-46 Q-80,-30 -60,-20 L-46,-30 Z M62,-46 Q80,-30 60,-20 L46,-30 Z" fill={color} opacity={0.85} />
    <path d="M-46,-62 Q0,-80 46,-62 Q52,-10 34,40 Q24,74 0,78 Q-24,74 -34,40 Q-52,-10 -46,-62 Z" fill={color} />
    <path d="M-30,30 Q0,22 30,30 Q34,64 0,70 Q-34,64 -30,30 Z" fill="#0d1320" opacity={0.35} />
    <circle cx={-12} cy={50} r={5} fill="#0d1320" />
    <circle cx={12} cy={50} r={5} fill="#0d1320" />
    <path d="M-30,-14 L-14,-6 L-30,-2 Z M30,-14 L14,-6 L30,-2 Z" fill="#0d1320" />
  </svg>
);

/** Caballo genérico (cabeza de perfil) */
export const HorseHead: React.FC<{size?: number; color?: string}> = ({size = 260, color = BRAND.red}) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <path
      d="M70,186 Q60,120 84,84 Q92,60 92,40 L104,22 L110,40 Q130,46 150,74 Q170,102 168,118 Q166,132 152,130 Q140,124 126,116 Q112,112 110,126 Q112,160 128,186 Z"
      fill={color}
    />
    <path d="M92,40 Q70,60 66,100 Q62,140 70,186 L58,186 Q46,120 66,74 Z" fill="#0d1320" opacity={0.35} />
    <circle cx={126} cy={72} r={5} fill="#0d1320" />
    <circle cx={158} cy={116} r={3} fill="#0d1320" />
  </svg>
);

/** Etiqueta con línea guía (estilo documental) */
export const Label: React.FC<{
  x: number; y: number; tx: number; ty: number; text: string; color?: string; delay?: number; size?: number;
}> = ({x, y, tx, ty, text, color = BRAND.white, delay = 0, size = 40}) => {
  const f = useCurrentFrame() - delay;
  const p = interpolate(f, [0, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const o = interpolate(f, [8, 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const right = tx >= x;
  return (
    <>
      <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
        <circle cx={x} cy={y} r={7 * p} fill={color} />
        <line x1={x} y1={y} x2={x + (tx - x) * p} y2={y + (ty - y) * p} stroke={color} strokeWidth={3} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: right ? tx + 12 : undefined,
          right: right ? undefined : 1080 - tx + 12,
          top: ty - size * 0.7,
          color,
          opacity: o,
          fontFamily: BRAND.font,
          fontWeight: 700,
          fontSize: size,
          letterSpacing: size * 0.12,
          whiteSpace: 'nowrap',
          transform: `translateY(${(1 - o) * 10}px)`,
        }}
      >
        {text}
      </div>
    </>
  );
};

export const usePop = (delay = 0, damping = 14) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: f - delay, fps, config: {damping, mass: 0.8}});
};
