import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {BRAND, H, W} from './brand';
import {color} from './escena';
import {ICONS} from './icons';

// Portadas (1080x1920). El contenido importante queda en la franja central 1080x1440,
// que es lo que Instagram muestra en la cuadrícula del perfil.
export type PortadaData = {top: string; big: string; acento?: string; iconos: {i: string; c: string}[]; tag?: string};

export const PORTADAS: Record<string, PortadaData> = {
  lamborghini: {top: 'DE TRACTORES A', big: 'LAMBORGHINI', acento: 'gold', iconos: [{i: 'tractor', c: 'gold'}, {i: 'toro', c: 'gold'}], tag: 'NACIÓ DE UNA PELEA'},
  'ford-ferrari': {top: 'EL "NO" DE FERRARI', big: 'QUE FORD SE COBRÓ', acento: 'blue', iconos: [{i: 'carrera', c: 'blue'}, {i: 'bandera', c: 'white'}], tag: 'LE MANS 1966'},
  honda: {top: 'LO PERDIÓ TODO…', big: 'Y CREÓ HONDA', acento: 'red', iconos: [{i: 'explosion', c: 'red'}, {i: 'bici', c: 'gold'}], tag: 'NUNCA SE RINDIÓ'},
  rolex: {top: 'EL RELOJ', big: 'QUE NO SE MOJÓ', acento: 'gold', iconos: [{i: 'reloj', c: 'gold'}, {i: 'nadadora', c: 'white'}], tag: 'LA JUGADA DE ROLEX'},
  gshock: {top: 'LO TIRÓ POR LA VENTANA', big: '+200 VECES', acento: 'red', iconos: [{i: 'edificio', c: 'grey'}, {i: 'digital', c: 'gold'}], tag: 'ASÍ NACIÓ EL G-SHOCK'},
  airbnb: {top: 'SALVADA POR', big: 'UNA CAJA DE CEREAL', acento: 'gold', iconos: [{i: 'cereal', c: 'red'}, {i: 'colchon', c: 'blue'}], tag: 'LA HISTORIA DE AIRBNB'},
};

export const Portada: React.FC<{slug: string}> = ({slug}) => {
  const p = PORTADAS[slug];
  const ac = color(p.acento);
  const f = 40;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 55%, ${BRAND.bgBottom} 0%, ${BRAND.bgTop} 75%)`, fontFamily: BRAND.font, alignItems: 'center'}}>
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <defs>
          <radialGradient id="pt2"><stop offset="0" stopColor={BRAND.goldSoft} /><stop offset="0.4" stopColor={BRAND.gold} stopOpacity={0.5} /><stop offset="1" stopColor={BRAND.gold} stopOpacity={0} /></radialGradient>
        </defs>
        {Array.from({length: 70}).map((_, i) => (
          <circle key={i} cx={random(`a${i}`) * W} cy={random(`b${i}`) * H} r={(3 + random(`c${i}`) * (random(`d${i}`) > 0.85 ? 14 : 5)) * 2.2} fill="url(#pt2)" opacity={0.25 + random(`e${i}`) * 0.5} />
        ))}
        <ellipse cx={540} cy={1260} rx={460} ry={60} fill={ac} opacity={0.12} />
      </svg>
      <div style={{position: 'absolute', top: 330, fontSize: 30, fontWeight: 700, letterSpacing: 10, color: BRAND.gold, opacity: 0.8}}>{BRAND.name}</div>
      <div style={{position: 'absolute', top: 470, width: 980, textAlign: 'center'}}>
        <div style={{fontSize: 70, fontWeight: 800, color: BRAND.white, letterSpacing: 2, lineHeight: 1.1}}>{p.top}</div>
        <div style={{fontSize: p.big.length > 14 ? 104 : 130, fontWeight: 900, color: ac, lineHeight: 1.02, marginTop: 14, textShadow: `0 0 50px ${ac}88`}}>{p.big}</div>
      </div>
      <div style={{position: 'absolute', top: 920, display: 'flex', gap: 60, alignItems: 'center'}}>
        {p.iconos.map((it, k) => {
          const Icon = ICONS[it.i];
          return <div key={k}><Icon c={color(it.c)} f={f} size={340} /></div>;
        })}
      </div>
      {p.tag && (
        <div style={{position: 'absolute', top: 1360, fontSize: 44, fontWeight: 800, letterSpacing: 4, color: '#0d1320', background: BRAND.gold, padding: '16px 40px', borderRadius: 60, boxShadow: `0 0 40px ${BRAND.gold}88`}}>{p.tag}</div>
      )}
    </AbsoluteFill>
  );
};
