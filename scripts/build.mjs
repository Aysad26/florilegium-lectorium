import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const shell=await readFile(new URL('page-shell.html',root),'utf8');
const sections=(await readFile(new URL('sections-content.html',root),'utf8'))
  .replace('id="featured"','id="catalog"')
  .replace('href="#latest"','href="https://florilegium.ru/proekty-2/"');
if(!shell.includes('<!-- CONTENT_SECTIONS -->'))throw new Error('Missing content slot');
await writeFile(new URL('dist/index.html',root),shell.replace('<!-- CONTENT_SECTIONS -->',sections));
console.log('Built dist/index.html');
