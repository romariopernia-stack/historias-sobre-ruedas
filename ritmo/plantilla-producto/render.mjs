import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const TL=JSON.parse(fs.readFileSync('timeline.json'));
fs.rmSync('frames',{recursive:true,force:true}); fs.mkdirSync('frames');
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file:///home/claude/ritmo/audif/aud.html'); await p.waitForTimeout(500);
await p.evaluate(j=>setTL(j),TL);
const n=Math.floor(TL.total*30);
for(let i=0;i<n;i++){await p.evaluate(t=>render(t),i/30); await p.screenshot({path:`frames/f${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:92});}
await b.close();
