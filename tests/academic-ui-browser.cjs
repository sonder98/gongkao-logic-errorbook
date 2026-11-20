const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const target=process.env.TEST_URL||'http://127.0.0.1:8000/';
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(target,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('.nav-item').first().waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('header.academic-topbar').isVisible(),true);
  assert.equal(await page.locator('#academicPracticeMode').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#practiceView > aside > .site-tabs').count(),1);
  assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(246, 245, 241)');
  await page.locator('#academicKnowledgeMode').click();
  await page.locator('#knowledgeCard h2').waitFor({state:'visible'});
  assert.equal(await page.locator('#academicKnowledgeMode').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#knowledgeView > aside > .site-tabs').count(),1);
  assert.equal(await page.locator('#knowledgeCard .academic-eyebrow').count(),1);

  // Browser-computed legibility checks, not just CSS source assertions.
  const metrics=await page.evaluate(()=>{
   const get=selector=>{
    const el=document.querySelector(selector),style=getComputedStyle(el);
    return {size:parseFloat(style.fontSize),weight:parseFloat(style.fontWeight),
      color:style.color,background:style.backgroundColor};
   };
   const rgb=value=>[...value.matchAll(/[\d.]+/g)].slice(0,3).map(part=>Number(part[0])/255);
   const luminance=value=>{
    const [r,g,b]=rgb(value).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
    return .2126*r+.7152*g+.0722*b;
   };
   const contrast=(fg,bg)=>{
    const a=luminance(fg),b=luminance(bg);
    return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
   };
   const body=get('body');
   const chapter=get('.kb-chapter');
   const group=get('.kb-group');
   const topic=get('.kb-nav-item');
   const summary=get('.kb-summary');
   return {body,chapter,group,topic,summary,
    summaryContrast:contrast(summary.color,summary.background),
    chapterContrast:contrast(chapter.color,'rgb(246, 245, 241)')};
  });
  assert.ok(metrics.body.weight>=500,'Reading text must not be ultra-light');
  assert.ok(metrics.chapter.size>=13,'Chapter heading must be at least 13px');
  assert.ok(metrics.group.size>=15&&metrics.group.weight>=700,'Section headings should be stronger');
  assert.ok(metrics.topic.size>=14&&metrics.topic.weight>=600,'Knowledge entry should be readable');
  assert.ok(metrics.summary.size>=15,'Key principle should not shrink below 15px');
  assert.ok(metrics.summaryContrast>=7,'Green-accent key principle must have dark-text contrast');
  assert.ok(metrics.chapterContrast>=4.5,'Chapter label must meet normal-text contrast');
  await page.locator('#tabFormalKnowledge').click();
  assert.match(await page.locator('#knowledgeCard h2').innerText(),/翻译推理|条件翻译/);
  await page.locator('#tabDataKnowledge').click();
  const scalingTopic=page.locator('[data-knowledge-topic="data-topic-course-03-scaling"]');
  if(await scalingTopic.count()===0)await page.locator('[data-knowledge-section="data-speed"]').click();
  await scalingTopic.click();
  assert.match(await page.locator('#knowledgeCard h2').innerText(),/放缩运算/);
  assert.equal(await page.locator('#knowledgeCard .kb-structured-jump button').count(),3);
  assert.equal(await page.locator('#knowledgeCard .kb-structured-group').count(),3);
  await page.setViewportSize({width:1500,height:950});
  assert.equal(await page.locator('#academicReadingRail').isVisible(),true);
  assert.ok(await page.locator('#academicReadingRail .academic-rail-link').count()>=3);
  assert.ok(await page.locator('#academicReadingRail .academic-rail-link').first()
    .evaluate(el=>parseFloat(getComputedStyle(el).fontSize))>=13,'Reading outline must be legible');
  const head=page.locator('#knowledgeCard .kb-structured-head').first();
  assert.equal(await head.evaluate(el=>getComputedStyle(el).position),'sticky');
  await head.scrollIntoViewIfNeeded();
  await page.evaluate(()=>window.scrollBy(0,260));
  const topInfo=await head.evaluate(el=>({
   top:el.getBoundingClientRect().top,header:document.querySelector('header.academic-topbar').getBoundingClientRect().height
  }));
  assert.ok(topInfo.top>=topInfo.header-3,'Sticky subsection heading should stay below masthead: '+JSON.stringify(topInfo));

  await page.locator('#academicPracticeMode').click();
  await page.locator('.choice').first().waitFor({state:'visible'});
  assert.equal(await page.locator('#practiceView>aside .site-tabs').count(),1);
  assert.equal(await page.locator('#examOpenLibrary').isVisible(),true);
  const scrollModes=await page.evaluate(()=>{
    const style=sel=>getComputedStyle(document.querySelector(sel));
    return {
      aside:style('#practiceView>aside').overflowY,
      material:style('#card .da-material-body').overflowY,
      table:document.querySelector('#card .da-table-scroll')?style('#card .da-table-scroll').overflowX:'none',
      drawerClosed:document.querySelector('#examLibraryDrawer').hidden,
    };
  });
  assert.notEqual(scrollModes.aside,'auto','No constant sidebar scroll');
  assert.equal(scrollModes.material,'visible','Material should use page scrolling');
  assert.equal(scrollModes.table,'visible','Metric table should not scroll horizontally');
  assert.equal(scrollModes.drawerClosed,true,'Full catalog is closed by default');
  await page.locator('#examOpenLibrary').click();
  assert.equal(await page.locator('#examLibraryDrawer').isVisible(),true);
  assert.equal(await page.evaluate(()=>document.body.classList.contains('exam-drawer-open')),true);
  assert.equal(await page.locator('#questionList .nav-item').count(),27);
  await page.locator('#questionSearch').fill('2019年四个一线城市通勤高峰拥堵程度排序');
  assert.equal(await page.locator('#questionList .nav-item').count(),1);
  await page.locator('#questionList .nav-item').click();
  assert.equal(await page.locator('#examLibraryDrawer').isVisible(),false);
  assert.equal(await page.evaluate(()=>document.body.classList.contains('exam-drawer-open')),false);
  assert.match(await page.locator('#card .title').innerText(),/2019年四个一线城市通勤高峰拥堵程度排序/);
  await page.locator('#examOpenLibrary').click();
  await page.locator('#questionSearch').fill('');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#examLibraryDrawer').isVisible(),false);
  assert.equal(await page.locator('#examRelatedList .exam-related-entry').count(),2,'Exactly two related questions under the same material');
  assert.equal(await page.locator('.da-table-view-btn').count(),3,'Two metric tabs plus full data');
  assert.equal(await page.locator('.da-table-pane').count(),1,'Default shows one coherent group');
  assert.equal(await page.locator('.da-table-pane tbody tr').count(),19);
  await page.locator('.da-table-view-btn[data-da-group="all"]').click();
  assert.equal(await page.locator('.da-table-pane').count(),2);
  assert.equal(await page.locator('.da-table-pane tbody tr').count(),38,'All 19 cities are preserved in each group');
  const allHeaders=await page.locator('.da-table-pane th').allTextContents();
  assert.equal(new Set(allHeaders).size,7,'All seven original table fields remain present');
  assert.ok(allHeaders.some(x=>x.includes('地铁线路网密度')));
  await page.locator('.da-table-view-btn[data-da-group="1"]').click();
  assert.equal(await page.locator('.da-table-pane').count(),1,'Switch back to one grouped table');
  assert.equal(await page.locator('.da-table-pane th').count(),4);

  // Regression: the flex sidebar used to shrink the catalog to one row when
  // Data Analysis presented many multi-line category filters.
  for(const moduleTab of ['#tabPractice','#tabFormalPractice','#tabDataPractice']){
   await page.locator(moduleTab).click();
   await page.locator('#questionList .nav-item').first().waitFor({state:'visible'});
   const catalog=await page.locator('#questionList').evaluate(el=>{
    const item=el.querySelector('.nav-item');
    return {height:el.getBoundingClientRect().height,
      rowHeight:item.getBoundingClientRect().height,
      flexShrink:getComputedStyle(el).flexShrink,
      scrollable:el.scrollHeight>el.clientHeight,
      count:el.querySelectorAll('.nav-item').length,
      asideScroll:getComputedStyle(el.closest('aside')).overflowY};
   });
   assert.ok(catalog.height>=280,'Question catalog collapsed in '+moduleTab+': '+JSON.stringify(catalog));
   assert.ok(catalog.height>=catalog.rowHeight*5,'At least five question rows should fit in '+moduleTab);
   assert.equal(catalog.flexShrink,'0','Catalog must not shrink below allocated height');
   assert.equal(catalog.asideScroll,'auto','Sidebar itself must stay scrollable when filters grow');
   if(catalog.count>=10)assert.equal(catalog.scrollable,true,'Catalog should scroll independently');
  }
  await page.locator('#tabDataPractice').click();
  await page.locator('#questionList').evaluate(el=>{el.scrollTop=el.scrollHeight});
  assert.ok(await page.locator('#questionList').evaluate(el=>el.scrollTop>0),'Catalog can scroll to its end');

  assert.equal(await page.locator('#academicPracticeMode').getAttribute('aria-pressed'),'true');
  await page.locator('#show').click();
  assert.equal(await page.locator('.result').count(),1,'Explanation still opens');
  await page.locator('#show').click();
  assert.equal(await page.locator('.result').count(),0,'Explanation still closes');
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(()=>document.querySelector('.site-tabs')?.parentElement===document.body);
  assert.equal(await page.locator('#practiceView #authPanel').count(),1);
  assert.equal(await page.locator('#examMobileLibrary').isVisible(),true);
  const elements=await page.evaluate(()=>{
    const body=document.querySelector('#card .da-material-body');
    const zones=document.querySelectorAll('#card .da-layout>*');
    return {overflow:getComputedStyle(body).overflowY,
      materialTop:zones[0].getBoundingClientRect().top,
      questionTop:zones[1].getBoundingClientRect().top};
  });
  assert.equal(elements.overflow,'visible');
  assert.ok(elements.questionTop<elements.materialTop,'On phones question comes before full material');
  await page.locator('#examMobileLibrary').click();
  assert.equal(await page.locator('#examLibraryDrawer').isVisible(),true);
  await page.locator('#examDrawerClose').click();

  const mobileCatalog=await page.locator('#questionList').evaluate(el=>el.getBoundingClientRect().height);
  assert.ok(mobileCatalog>=150&&mobileCatalog<=165,'Mobile catalog keeps its compact independent list');
  const navFont=await page.locator('#questionList .nav-title').first()
    .evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
  assert.ok(navFont>=14,'Mobile question catalog title must remain readable');
  await page.locator('#next').click();
  await page.waitForFunction(()=>{
   const top=document.getElementById('card').getBoundingClientRect().top;
   const header=document.querySelector('header.academic-topbar').getBoundingClientRect().height;
   return top>=header+2&&top<=header+32;
  });
  const dims=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
  assert.ok(dims.page<=dims.viewport+1,'Mobile horizontal overflow '+JSON.stringify(dims));
  await page.setViewportSize({width:320,height:720});
  const narrow=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
  assert.ok(narrow.page<=narrow.viewport+1,'320px viewport must not overflow after typography enlargement '+JSON.stringify(narrow));
  const tableOverflow=await page.locator('#card .da-table-scroll').first().evaluate(el=>({
    width:el.clientWidth,scroll:el.scrollWidth
  }));
  assert.ok(tableOverflow.scroll<=tableOverflow.width+1,
    'Grouped data table must not create an inner horizontal scrollbar '+JSON.stringify(tableOverflow));
  assert.deepEqual(errors,[],'No app JavaScript errors');
  console.log('Academic UI browser checks OK: tabs, lessons, cards, rail, sticky headings, practice, mobile paging');
 }finally{await context.close();await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});