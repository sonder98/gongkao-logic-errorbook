const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const css=read('single-scroll.css'),script=read('single-scroll.js'),index=read('index.html'),sw=read('sw.js');
new Function(script);
assert.ok(css.includes('#practiceView>aside{'),'Reading sidebar style missing');
assert.ok(css.includes('overflow:visible'),'No nested scrolling rule missing');
assert.ok(css.includes('flex-direction:column-reverse'),'Mobile must place question above material');
assert.ok(css.includes('.exam-library-drawer'),'Full library drawer style missing');
assert.ok(css.includes('body.exam-drawer-open'),'Drawer background scroll-lock missing');
assert.ok(index.includes('ExamLayout.onRender(q,f,QUESTIONS,currentModule)'));
assert.ok(index.includes('ExamLayout.closeLibrary()'));
assert.ok(index.includes('ExamScratch.mount(q.id'),'Pencil pad must remain');
assert.ok(index.includes("$('saveNote').onclick"),'Manual note save must remain');
assert.ok(index.includes("const replaceAnalysisButton="),'Personal analysis replacement must remain');
assert.ok(sw.includes("'./single-scroll.css'")&&sw.includes("'./single-scroll.js'"));
require('../data-analysis.js');
const da=globalThis.DataAnalysis;
const materials=JSON.parse(read('data-materials.json'));
const city=materials.find(m=>m.id==='data-material-2020-major-cities-congestion-traffic');
assert.ok(city);
const table=city.blocks.find(b=>b.type==='table');
assert.equal(table.columns.length,7);
assert.equal(table.rows.length,19);
const defaultHtml=da.materialHtml(city);
assert.match(defaultHtml,/data-da-group="0"/);
assert.match(defaultHtml,/data-da-group="all"/);
assert.match(defaultHtml,/拥堵指标/);
assert.ok(!defaultHtml.includes('地铁线路网密度'),'Default group should show only first three metrics');
da.setTableView(city.id,'1');
const secondary=da.materialHtml(city);
assert.match(secondary,/地铁线路网密度/);
assert.ok(!secondary.includes('2020年度排名'),'Secondary group is independent');
da.setTableView(city.id,'all');
const full=da.materialHtml(city);
assert.equal((full.match(/<tbody>/g)||[]).length,2);
assert.equal((full.match(/<tr>/g)||[]).length,40,'19 rows x 2 groups plus headers');
for(const column of table.columns)assert.ok(full.includes(column),'Missing city table column '+column);
for(const row of table.rows)for(const cell of row)assert.ok(full.includes(String(cell)),'Missing cell '+cell);
const retail=materials.find(m=>m.id==='data-material-2016-2018-social-retail-sales-monthly-cumulative');
assert.equal(retail.blocks.find(b=>b.type==='table').columns.length,13);
da.setTableView(retail.id,'all');
const retailFull=da.materialHtml(retail);
assert.equal((retailFull.match(/<tbody>/g)||[]).length,4,'Thirteen-column table is four metric groups');
for(const column of retail.blocks[0].columns)assert.ok(retailFull.includes(column),'Missing 13-column field '+column);
const simple=materials.find(m=>m.id==='data-material-2018-q-transport-passenger-distance');
assert.equal(simple.blocks[0].columns.length,4);
assert.doesNotMatch(da.materialHtml(simple),/data-da-group=/,'Four columns need no grouped tabs');

// Generic future-material regression: verify *every* normal rectangular table
// survives automatic grouping with all source rows and every original cell.
// One-off city/retail fixtures above are examples, not the only protected tables.
const plain=v=>String(v??'');
const htmlEscape=v=>plain(v).replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;');
let checkedTables=0;
for(const material of materials){
 const tables=material.blocks.filter(b=>b.type==='table');
 if(!tables.length)continue;
 da.setTableView(material.id,'all');
 const markup=da.materialHtml(material);
 const renderedTables=[...markup.matchAll(/<table>([\s\S]*?)<\/table>/g)].map(m=>m[1]);
 let renderedIndex=0;
 for(const tableBlock of tables){
  const regular=tableBlock.columns.every(v=>v!==null&&typeof v!=='object')&&
   tableBlock.rows.every(row=>row.length===tableBlock.columns.length&&
    row.every(v=>v!==null&&typeof v!=='object'));
  if(!regular){
   // Merged cell structures retain the original table without forced splitting.
   assert.ok(renderedTables[renderedIndex],material.id+': complex table missing');
   renderedIndex+=1;
   continue;
  }
  const n=tableBlock.columns.length;
  const groups=n>4?Array.from({length:Math.ceil((n-1)/3)},(_,i)=>
   [0,...Array.from({length:Math.min(3,n-1-i*3)},(_,j)=>i*3+j+1)])
   :[tableBlock.columns.map((_,i)=>i)];
  for(const columns of groups){
   const tableHtml=renderedTables[renderedIndex++];
   assert.ok(tableHtml,material.id+': missing indicator group');
   const headers=[...tableHtml.matchAll(/<th(?:\s[^>]*)?>([\s\S]*?)<\/th>/g)]
    .map(match=>match[1]);
   assert.equal(headers.length,columns.length,material.id+': number of columns differs from source');
   columns.forEach((sourceCol,i)=>{
    const source=plain(tableBlock.columns[sourceCol]);
    if(!/\\\(|\\\[/.test(source))
     assert.equal(headers[i],htmlEscape(source),material.id+': changed source header '+sourceCol);
   });
   const body=tableHtml.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1];
   assert.ok(body,material.id+': table body not rendered');
   const rowHtml=[...body.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(match=>match[1]);
   assert.equal(rowHtml.length,tableBlock.rows.length,material.id+': lost source rows');
   rowHtml.forEach((row,sourceRow)=>{
    const cells=[...row.matchAll(/<td(?:\s[^>]*)?>([\s\S]*?)<\/td>/g)].map(m=>m[1]);
    assert.equal(cells.length,columns.length,material.id+': lost source columns in row '+sourceRow);
    columns.forEach((sourceCol,i)=>{
     const original=plain(tableBlock.rows[sourceRow][sourceCol]);
     if(!/\\\(|\\\[/.test(original))
      assert.equal(cells[i],htmlEscape(original),
       material.id+': changed cell '+sourceRow+','+sourceCol);
    });
   });
  }
  checkedTables++;
 }
 assert.equal(renderedIndex,renderedTables.length,material.id+': unexpected generated tables');
}
assert.ok(checkedTables>0,'No ordinary source tables checked');
console.log('Full-row / full-column verification for',checkedTables,'regular source tables: OK');

console.log('Single-scroll layout & complete data table grouping: OK');