import React from 'react';
import {BRAND} from './brand';
import {BullHead, Bust, HorseHead, SportsCar, Tractor} from './shapes';

// Biblioteca de íconos planos genéricos (sin logos de marcas). viewBox 200x200.
export type IconProps = {c: string; f: number; size: number; flip?: boolean};
const D = '#0d1320';
const Svg: React.FC<{size: number; children: React.ReactNode}> = ({size, children}) => (
  <svg width={size} height={size} viewBox="0 0 200 200" style={{overflow: 'visible'}}>{children}</svg>
);
const Wide: React.FC<{size: number; children: React.ReactNode}> = ({size, children}) => (
  <div style={{width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{children}</div>
);

export const ICONS: Record<string, React.FC<IconProps>> = {
  persona: ({c, size, flip}) => <Bust color={c} size={size} flip={flip} />,
  auto: ({c, size, f}) => <Wide size={size}><SportsCar color={c} width={size * 1.3} spin={f * 10} /></Wide>,
  carrera: ({c, size, f}) => (
    <Wide size={size}>
      <div style={{position: 'relative'}}>
        <SportsCar color={c} width={size * 1.3} spin={f * 20} low />
        <div style={{position: 'absolute', left: '42%', top: '58%', width: size * 0.16, height: size * 0.16, borderRadius: 99, background: '#fff', color: D, fontFamily: BRAND.font, fontWeight: 900, fontSize: size * 0.11, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>1</div>
      </div>
    </Wide>
  ),
  tractor: ({c, size, f}) => <Tractor color={c} width={size} spin={f * 5} smoke={f / 40} />,
  toro: ({c, size}) => <BullHead color={c} size={size} />,
  caballo: ({c, size}) => <HorseHead color={c} size={size} />,
  fabrica: ({c, size, f}) => (
    <Svg size={size}>
      {[0, 1, 2].map((i) => { const p = (f / 50 + i / 3) % 1; return <circle key={i} cx={150 + p * 20} cy={40 - p * 50} r={8 + p * 16} fill="#c7cbd4" opacity={0.35 * (1 - p)} />; })}
      <rect x={140} y={40} width={20} height={70} fill={BRAND.steel} />
      <path d="M20,180 L20,110 L60,80 L60,110 L100,80 L100,110 L140,80 L140,110 L180,110 L180,180 Z" fill={c} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={34 + i * 38} y={128} width={22} height={18} fill={D} opacity={0.6} />)}
      <rect x={84} y={150} width={32} height={30} fill={D} opacity={0.8} />
    </Svg>
  ),
  explosion: ({c, size, f}) => {
    const s = 1 + 0.08 * Math.sin(f / 2);
    const pts = Array.from({length: 16}).map((_, i) => { const r = i % 2 ? 45 : 92; const a = (i / 16) * Math.PI * 2; return `${100 + r * Math.cos(a)},${100 + r * Math.sin(a)}`; }).join(' ');
    const pts2 = Array.from({length: 16}).map((_, i) => { const r = i % 2 ? 25 : 55; const a = (i / 16) * Math.PI * 2 + 0.2; return `${100 + r * Math.cos(a)},${100 + r * Math.sin(a)}`; }).join(' ');
    return <Svg size={size}><g transform={`translate(100 100) scale(${s}) translate(-100 -100)`}><polygon points={pts} fill={c} /><polygon points={pts2} fill={BRAND.goldSoft} /></g></Svg>;
  },
  grieta: ({c, size, f}) => {
    const sh = Math.sin(f * 1.7) * 4;
    return (
      <Svg size={size}>
        <g transform={`translate(${sh} 0) rotate(${-6} 100 170)`}>
          <rect x={50} y={30} width={100} height={140} fill={c} />
          {[0, 1, 2, 3].map((r) => [0, 1].map((k) => <rect key={`${r}${k}`} x={66 + k * 40} y={46 + r * 30} width={26} height={18} fill={D} opacity={0.6} />))}
          <path d="M100,30 L88,70 L110,95 L92,130 L104,170" stroke={D} strokeWidth={6} fill="none" />
        </g>
        <path d="M0,172 L80,172 L92,184 L108,166 L120,180 L200,172" stroke={c} strokeWidth={6} fill="none" />
      </Svg>
    );
  },
  piston: ({c, size, f}) => {
    const y = Math.sin(f / 4) * 14;
    return (
      <Svg size={size}>
        <rect x={50} y={20} width={100} height={150} rx={10} fill="none" stroke={BRAND.steel} strokeWidth={8} />
        <g transform={`translate(0 ${y})`}>
          <rect x={60} y={50} width={80} height={60} rx={8} fill={c} />
          {[0, 1, 2].map((i) => <rect key={i} x={60} y={58 + i * 12} width={80} height={5} fill={D} opacity={0.5} />)}
          <rect x={92} y={100} width={16} height={70} fill={BRAND.grey} />
          <circle cx={100} cy={112} r={10} fill={D} />
        </g>
      </Svg>
    );
  },
  bici: ({c, size, f}) => (
    <Svg size={size}>
      {[50, 150].map((x) => (
        <g key={x} transform={`translate(${x} 140) rotate(${f * 8})`}>
          <circle r={38} fill="none" stroke={BRAND.white} strokeWidth={7} />
          {[0, 60, 120].map((a) => <line key={a} x1={-36} y1={0} x2={36} y2={0} stroke={BRAND.grey} strokeWidth={2} transform={`rotate(${a})`} />)}
        </g>
      ))}
      <path d="M50,140 L85,80 L140,80 L150,140 M85,80 L100,140 L140,80 M140,80 L135,60 M78,72 L98,72" stroke={c} strokeWidth={7} fill="none" strokeLinecap="round" />
      <rect x={88} y={112} width={30} height={26} rx={4} fill={BRAND.gold} />
      {[0, 1].map((i) => { const p = (f / 30 + i / 2) % 1; return <circle key={i} cx={84 - p * 40} cy={120 - p * 30} r={5 + p * 10} fill="#c7cbd4" opacity={0.4 * (1 - p)} />; })}
    </Svg>
  ),
  reloj: ({c, size, f}) => (
    <Svg size={size}>
      <rect x={72} y={0} width={56} height={60} rx={8} fill={BRAND.steel} />
      <rect x={72} y={140} width={56} height={60} rx={8} fill={BRAND.steel} />
      <circle cx={100} cy={100} r={64} fill={c} />
      <circle cx={100} cy={100} r={52} fill={D} />
      {Array.from({length: 12}).map((_, i) => <rect key={i} x={98} y={52} width={4} height={i % 3 ? 6 : 12} fill={BRAND.white} transform={`rotate(${i * 30} 100 100)`} />)}
      <rect x={97} y={66} width={6} height={36} rx={3} fill={BRAND.white} transform={`rotate(${f * 0.5} 100 100)`} />
      <rect x={98.5} y={58} width={3} height={44} rx={2} fill={BRAND.gold} transform={`rotate(${f * 6} 100 100)`} />
      <circle cx={100} cy={100} r={5} fill={c} />
      <rect x={162} y={92} width={10} height={16} rx={3} fill={c} />
    </Svg>
  ),
  digital: ({c, size, f}) => (
    <Svg size={size}>
      <rect x={70} y={0} width={60} height={50} rx={10} fill="#1b2232" />
      <rect x={70} y={150} width={60} height={50} rx={10} fill="#1b2232" />
      <rect x={36} y={36} width={128} height={128} rx={30} fill={c} />
      <rect x={52} y={60} width={96} height={80} rx={10} fill="#9fb3a0" />
      <text x={100} y={112} textAnchor="middle" fontFamily="monospace" fontWeight={900} fontSize={30} fill={D}>{`12:${String(Math.floor(f / 30) % 60).padStart(2, '0')}`}</text>
      {[60, 140].map((y) => [26, 174].map((x) => <rect key={`${x}${y}`} x={x - 6} y={y - 10} width={12} height={20} rx={4} fill={c} />))}
    </Svg>
  ),
  edificio: ({c, size, f}) => (
    <Svg size={size}>
      <rect x={45} y={10} width={110} height={190} fill={c} />
      {[0, 1, 2, 3, 4].map((r) => [0, 1, 2].map((k) => <rect key={`${r}${k}`} x={57 + k * 32} y={24 + r * 34} width={22} height={22} fill={D} opacity={r === 1 && k === 2 ? 0 : 0.55} />))}
      <rect x={121} y={58} width={22} height={22} fill={BRAND.goldSoft} opacity={0.6 + 0.4 * Math.sin(f / 5)} />
    </Svg>
  ),
  pelota: ({c, size, f}) => {
    const y = -Math.abs(Math.sin(f / 9)) * 60;
    return (
      <Svg size={size}>
        <ellipse cx={100} cy={188} rx={40 + y * 0.3} ry={8} fill="#000" opacity={0.4} />
        <g transform={`translate(0 ${y})`}>
          <circle cx={100} cy={136} r={48} fill={c} />
          <path d="M56,120 Q100,150 144,120" stroke={BRAND.white} strokeWidth={8} fill="none" />
        </g>
      </Svg>
    );
  },
  colchon: ({c, size, f}) => (
    <Svg size={size}>
      <g transform={`translate(0 ${Math.sin(f / 10) * 3})`}>
        <rect x={10} y={100} width={180} height={56} rx={22} fill={c} />
        {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={44 + i * 28} y1={108} x2={44 + i * 28} y2={148} stroke={D} strokeOpacity={0.25} strokeWidth={5} />)}
        <rect x={22} y={84} width={56} height={26} rx={12} fill={BRAND.white} />
      </g>
    </Svg>
  ),
  casa: ({c, size}) => (
    <Svg size={size}>
      <path d="M20,100 L100,30 L180,100 Z" fill={c} />
      <rect x={40} y={96} width={120} height={90} fill={BRAND.white} opacity={0.92} />
      <rect x={88} y={130} width={26} height={56} fill={c} />
      <rect x={54} y={116} width={24} height={22} fill={BRAND.gold} />
      <rect x={124} y={116} width={24} height={22} fill={BRAND.gold} />
    </Svg>
  ),
  cereal: ({c, size, f}) => (
    <Svg size={size}>
      <g transform={`rotate(${Math.sin(f / 12) * 4} 100 190)`}>
        <rect x={50} y={20} width={100} height={170} rx={6} fill={c} />
        <rect x={60} y={34} width={80} height={36} rx={4} fill={BRAND.white} />
        <text x={100} y={60} textAnchor="middle" fontFamily={BRAND.font} fontWeight={900} fontSize={24} fill={D}>O's</text>
        <ellipse cx={100} cy={130} rx={36} ry={22} fill={BRAND.white} />
        {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={78 + i * 11} cy={126 + (i % 2) * 6} r={7} fill={BRAND.gold} stroke={D} strokeOpacity={0.3} strokeWidth={4} />)}
      </g>
    </Svg>
  ),
  dinero: ({c, size, f}) => (
    <Svg size={size}>
      <path d="M78,46 L122,46 L112,64 L88,64 Z" fill={c} />
      <path d="M88,64 Q30,100 40,150 Q48,190 100,190 Q152,190 160,150 Q170,100 112,64 Z" fill={c} />
      <text x={100} y={160} textAnchor="middle" fontFamily={BRAND.font} fontWeight={900} fontSize={70} fill={D} opacity={0.7}>$</text>
      {[0, 1, 2].map((i) => { const p = (f / 40 + i / 3) % 1; return <text key={i} x={40 + i * 60} y={40 - p * 50} fontFamily={BRAND.font} fontWeight={900} fontSize={26} fill={BRAND.gold} opacity={1 - p}>$</text>; })}
    </Svg>
  ),
  trofeo: ({c, size, f}) => (
    <Svg size={size}>
      <path d="M60,30 L140,30 L136,90 Q130,124 100,128 Q70,124 64,90 Z" fill={c} />
      <path d="M62,40 Q24,40 30,70 Q36,96 66,96 M138,40 Q176,40 170,70 Q164,96 134,96" stroke={c} strokeWidth={9} fill="none" />
      <rect x={92} y={126} width={16} height={30} fill={c} />
      <rect x={66} y={156} width={68} height={22} rx={4} fill={BRAND.steel} />
      <path d="M86,50 L94,50 L94,100" stroke={BRAND.white} strokeOpacity={0.5} strokeWidth={6} fill="none" />
      {[0, 1, 2, 3].map((i) => <circle key={i} cx={100 + Math.cos(f / 10 + i * 1.6) * 80} cy={80 + Math.sin(f / 10 + i * 1.6) * 60} r={4} fill={BRAND.goldSoft} />)}
    </Svg>
  ),
  bandera: ({size, f}) => (
    <Svg size={size}>
      <rect x={36} y={20} width={8} height={170} fill={BRAND.grey} />
      {Array.from({length: 24}).map((_, i) => {
        const col = i % 6, row = Math.floor(i / 6);
        const w = Math.sin(f / 6 + col * 0.8) * 6;
        return <rect key={i} x={44 + col * 22} y={24 + row * 22 + w} width={22} height={22} fill={(col + row) % 2 ? '#111' : BRAND.white} />;
      })}
    </Svg>
  ),
  nadadora: ({c, size, f}) => (
    <Svg size={size}>
      <g transform={`translate(${Math.sin(f / 15) * 10} 0)`}>
        <circle cx={100} cy={100} r={22} fill={c} />
        <path d={`M100,110 Q${130 + Math.sin(f / 5) * 20},${50 + Math.cos(f / 5) * 20} 160,80`} stroke={c} strokeWidth={14} fill="none" strokeLinecap="round" />
        <circle cx={100} cy={136} r={9} fill={BRAND.gold} stroke={BRAND.white} strokeWidth={3} />
      </g>
      {[0, 1, 2].map((i) => <path key={i} d={`M0,${125 + i * 22} ${Array.from({length: 9}).map((_, k) => `Q${k * 25 + 12},${125 + i * 22 + (k % 2 ? 10 : -10) + Math.sin(f / 6 + i) * 3} ${(k + 1) * 25},${125 + i * 22}`).join(' ')}`} stroke={BRAND.blue} strokeWidth={6} fill="none" opacity={0.85 - i * 0.2} />)}
    </Svg>
  ),
  periodico: ({c, size}) => (
    <Svg size={size}>
      <rect x={24} y={30} width={152} height={150} rx={4} fill={BRAND.white} />
      <rect x={36} y={42} width={128} height={20} fill={D} />
      <rect x={36} y={72} width={60} height={56} fill={c} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={104} y={74 + i * 14} width={60} height={7} fill={BRAND.grey} />)}
      {[0, 1, 2].map((i) => <rect key={i} x={36} y={140 + i * 12} width={128} height={6} fill={BRAND.grey} />)}
    </Svg>
  ),
  mundo: ({c, size, f}) => (
    <Svg size={size}>
      <circle cx={100} cy={100} r={80} fill={BRAND.blue} />
      <defs><clipPath id="globo"><circle cx={100} cy={100} r={80} /></clipPath></defs>
      <g clipPath="url(#globo)">
        {[0, 1].map((k) => <path key={k} d="M30,50 Q70,30 95,62 Q90,100 62,104 Q34,98 30,50 Z M110,104 Q150,84 172,118 Q160,168 122,160 Q98,146 110,104 Z M120,30 Q150,24 160,46 Q140,60 122,50 Z" fill={c} transform={`translate(${((f * 0.6) % 200) - 200 * k} 0)`} />)}
      </g>
      <circle cx={100} cy={100} r={80} fill="none" stroke={BRAND.white} strokeOpacity={0.3} strokeWidth={4} />
    </Svg>
  ),
  tarjeta: ({c, size}) => (
    <Svg size={size}>
      <rect x={20} y={50} width={160} height={104} rx={12} fill={c} />
      <rect x={20} y={72} width={160} height={18} fill={D} opacity={0.7} />
      <rect x={34} y={108} width={30} height={22} rx={4} fill={BRAND.gold} />
      <text x={170} y={142} textAnchor="end" fontFamily={BRAND.font} fontWeight={800} fontSize={22} fill={BRAND.white}>- $20.000</text>
    </Svg>
  ),
  idea: ({c, size, f}) => (
    <Svg size={size}>
      {Array.from({length: 8}).map((_, i) => <line key={i} x1={100} y1={20} x2={100} y2={2} stroke={c} strokeWidth={6} strokeLinecap="round" transform={`rotate(${i * 45} 100 84)`} opacity={0.5 + 0.5 * Math.sin(f / 4 + i)} />)}
      <circle cx={100} cy={84} r={46} fill={c} />
      <rect x={80} y={124} width={40} height={30} rx={6} fill={BRAND.steel} />
      <rect x={86} y={156} width={28} height={10} rx={4} fill={BRAND.steel} />
    </Svg>
  ),
};
