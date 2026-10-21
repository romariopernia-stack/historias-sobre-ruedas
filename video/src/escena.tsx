import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND} from './brand';
import {ICONS} from './icons';
import type {SceneData} from './scenes';

/**
 * Escena genérica configurable desde el guion (campo "e"):
 * {
 *   "titulo": {"t": "1963", "sub": "LE MANS", "c": "gold", "at": "1963"},
 *   "items": [{"i": "persona", "c": "blue", "l": "FORD", "at": "Ford", "flip": false}],
 *   "entre": {"t": "VS", "at": "plantado"},
 *   "pill": {"t": "1° · 2° · 3°", "at": "tercer"},
 *   "mover": true   // los íconos cruzan la pantalla (carros en movimiento)
 * }
 */
export type Escena = {
  titulo?: {t: string; sub?: string; c?: string; at?: string};
  items?: {i: string; c?: string; l?: string; at?: string; flip?: boolean}[];
  entre?: {t: string; at?: string; c?: string};
  pill?: {t: string; at?: string; c?: string};
  mover?: boolean;
};

export const color = (c?: string) =>
  ({gold: BRAND.gold, red: BRAND.red, blue: BRAND.blue, white: BRAND.white, grey: BRAND.grey, steel: BRAND.steel} as Record<string, string>)[c || 'gold'] || c || BRAND.gold;

const atFrame = (s: SceneData, w: string | undefined, fps: number) => {
  if (!w) return 0;
  const x = s.words.find((k) => k.text.toLowerCase().replace(/[^\p{L}\p{N}%$']/gu, '').includes(w.toLowerCase()));
  return x ? Math.max(0, Math.round((x.start - s.start) * fps) - 4) : 0;
};

export const EscenaGenerica: React.FC<{s: SceneData & {e?: Escena}}> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const e: Escena = s.e || {};
  const pop = (d: number, damping = 13) => spring({frame: f - d, fps, config: {damping, mass: 0.8}});
  const items = e.items || [];
  const n = items.length;
  const hasTitle = !!e.titulo;
  const size = n <= 1 ? (hasTitle ? 340 : 480) : n === 2 ? (hasTitle ? 300 : 330) : 260;
  const cy = hasTitle ? 1230 : 1080;
  const xs = n <= 1 ? [540] : n === 2 ? [280, 800] : [190, 540, 890];

  return (
    <AbsoluteFill>
      {e.titulo && (() => {
        const p = pop(atFrame(s, e.titulo!.at, fps), 15);
        const c = color(e.titulo!.c);
        return (
          <div style={{position: 'absolute', top: 790, width: 1080, textAlign: 'center', fontFamily: BRAND.font, opacity: p}}>
            <div style={{fontSize: e.titulo!.t.length > 9 ? 100 : 150, fontWeight: 800, color: c, letterSpacing: 6, lineHeight: 1, transform: `scale(${0.8 + 0.2 * p})`, textShadow: c === BRAND.white ? 'none' : `0 0 40px ${c}88`}}>{e.titulo!.t}</div>
            {e.titulo!.sub && <div style={{fontSize: 40, fontWeight: 600, color: BRAND.grey, letterSpacing: 6, marginTop: 12}}>{e.titulo!.sub}</div>}
          </div>
        );
      })()}
      {items.map((it, k) => {
        const d = atFrame(s, it.at, fps);
        const p = pop(d);
        const c = color(it.c);
        const Icon = ICONS[it.i] || ICONS.idea;
        const float = Math.sin((f + k * 20) / 18) * 6;
        let x = xs[k] - size / 2;
        if (e.mover) x += interpolate(spring({frame: f - d, fps, config: {damping: 20}}), [0, 1], [k % 2 ? 1100 : -1100, 0]);
        return (
          <React.Fragment key={k}>
            <div style={{position: 'absolute', left: x, top: cy - size / 2 + float, opacity: e.mover ? 1 : p, transform: e.mover ? undefined : `scale(${p})`}}>
              <Icon c={c} f={f} size={size} flip={it.flip} />
            </div>
            {it.l && (
              <div style={{position: 'absolute', left: xs[k] - 260, width: 520, top: cy + size / 2 + 18, textAlign: 'center', fontFamily: BRAND.font, fontWeight: 700, fontSize: 40, letterSpacing: 5, color: c, opacity: interpolate(f - d, [8, 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
                {it.l}
              </div>
            )}
          </React.Fragment>
        );
      })}
      {e.entre && (() => {
        const p = pop(atFrame(s, e.entre!.at, fps), 9);
        const c = color(e.entre!.c);
        return (
          <div style={{position: 'absolute', top: cy - 90, width: 1080, textAlign: 'center', fontFamily: BRAND.font, fontWeight: 900, fontSize: 150, color: c, opacity: p, transform: `scale(${0.4 + 0.6 * p})`, textShadow: `0 0 50px ${c}`}}>
            {e.entre!.t}
          </div>
        );
      })()}
      {e.pill && (() => {
        const p = pop(atFrame(s, e.pill!.at, fps), 10);
        const c = color(e.pill!.c);
        return (
          <div style={{position: 'absolute', top: 1500, width: 1080, display: 'flex', justifyContent: 'center', opacity: p, transform: `scale(${p})`}}>
            <div style={{fontFamily: BRAND.font, fontWeight: 800, fontSize: 44, letterSpacing: 3, color: '#0d1320', background: c, padding: '14px 36px', borderRadius: 60, boxShadow: `0 0 40px ${c}88`}}>{e.pill!.t}</div>
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};
