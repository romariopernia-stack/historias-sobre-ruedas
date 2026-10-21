import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const {frames} = JSON.parse(fs.readFileSync('tiempos.json'));
fs.rmSync('frames',{recursive:true,force:true}); fs.mkdirSync('frames');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto('file:///home/claude/ritmo/video.html'); await p.waitForTimeout(500);
for(let i=0;i<frames.length;i++){await p.evaluate(t=>render(t),frames[i]);await p.screenshot({path:`frames/f${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:92});}
await b.close();
