/* 资料分析专属渲染/校验。与旧逻辑题的稳定 ID 和云端记录隔离。 */
(function(root){
  'use strict';
  const collapsed=new Set();
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const CDN='https://cdn.jsdelivr.net/npm/katex@0.19.0/dist/';
  let mathPromise=null;
  function rich(value){
    const text=String(value??''),re=/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g;
    let out='',from=0,match;
    while((match=re.exec(text))){
      out+=esc(text.slice(from,match.index));
      const display=match[2]!==undefined,tex=display?match[2]:match[1];
      out+=display?'<div class="da-equation" data-da-tex="'+esc(tex)+'">'+esc(tex)+'</div>':
        '<span class="da-inline-math" data-da-tex="'+esc(tex)+'">'+esc(tex)+'</span>';
      from=re.lastIndex;
    }
    return out+esc(text.slice(from));
  }
  function ensureMath(){
    if(root.katex)return Promise.resolve(root.katex);
    if(mathPromise)return mathPromise;
    const css=root.document.createElement('link');
    css.rel='stylesheet';css.href=CDN+'katex.min.css';
    css.integrity='sha384-3rdsX6e5mueWyoweR9NIVmtEsUkokpBT/0ALqKKIBMr9j4qhHkaIkAcGgsE6uVlp';css.crossOrigin='anonymous';
    root.document.head.appendChild(css);
    mathPromise=new Promise((resolve,reject)=>{
      const js=root.document.createElement('script');
      js.src=CDN+'katex.min.js';js.async=true;
      js.integrity='sha384-QFFtAGzvvj+bfgCGxXJlNZZR1nXEZgvG8tDLCCY1F19xl20WlfTYgguB4VcNdxYk';js.crossOrigin='anonymous';
      js.onload=()=>root.katex?resolve(root.katex):reject(new Error('KaTeX 未加载'));
      js.onerror=()=>reject(new Error('KaTeX 网络加载失败'));
      root.document.head.appendChild(js);
    }).catch(error=>{mathPromise=null;console.warn('数学公式暂以原始 LaTeX 展示：',error.message);return null;});
    return mathPromise;
  }
  function renderMath(container){
    if(!container||!container.querySelector('[data-da-tex]'))return;
    ensureMath().then(katex=>{
      if(!katex||!container.isConnected)return;
      container.querySelectorAll('[data-da-tex]').forEach(element=>{
        if(element.dataset.daDone==='1')return;
        katex.render(element.dataset.daTex,element,{
          displayMode:element.classList.contains('da-equation'),throwOnError:false,trust:false,strict:'ignore'
        });
        element.dataset.daDone='1';
      });
    });
  }
  function renderCell(cell,tag){
    const value=cell&&typeof cell==='object'?cell.text:cell;
    const colspan=cell&&typeof cell==='object'&&Number.isInteger(cell.colspan)&&cell.colspan>1?' colspan="'+cell.colspan+'"':'';
    const rowspan=cell&&typeof cell==='object'&&Number.isInteger(cell.rowspan)&&cell.rowspan>1?' rowspan="'+cell.rowspan+'"':'';
    return '<'+tag+colspan+rowspan+'>'+rich(value)+'</'+tag+'>';
  }
  function renderChart(block){
    const items=block.data||[],w=640,h=294,left=56,right=18,top=30,bottom=70;
    if(!items.length)return '';
    const vals=items.map(x=>Number(x.value)),plotW=w-left-right,plotH=h-top-bottom;
    const bounded=block.chartType==='line'&&Number.isFinite(block.yMin)&&Number.isFinite(block.yMax)&&block.yMax>block.yMin;
    const low=bounded?block.yMin:0,high=bounded?block.yMax:Math.max(1,...vals)*1.14;
    const x=i=>left+plotW*(i+.5)/items.length;
    const y=value=>top+plotH*(1-(value-low)/(high-low));
    let shapes='<line x1="'+left+'" y1="'+(h-bottom)+'" x2="'+(w-right)+'" y2="'+(h-bottom)+'" stroke="#9baeb6"/>';
    if(bounded){
      for(let i=0;i<=3;i++){
        const value=low+(high-low)*i/3,yy=y(value);
        shapes+='<line x1="'+left+'" y1="'+yy+'" x2="'+(w-right)+'" y2="'+yy+'" stroke="#e2ebed" stroke-dasharray="4 4"/>';
        shapes+='<text x="'+(left-9)+'" y="'+(yy+4)+'" text-anchor="end" font-size="12" fill="#637981">'+value.toFixed(1).replace(/\.0$/,'')+'</text>';
      }
    }
    if(block.chartType==='line'){
      shapes+='<polyline points="'+items.map((it,i)=>x(i)+','+y(Number(it.value))).join(' ')+'" fill="none" stroke="#117d78" stroke-width="3"/>';
      items.forEach((it,i)=>shapes+='<circle cx="'+x(i)+'" cy="'+y(Number(it.value))+'" r="5" fill="#117d78"/>');
    }else{
      const bw=Math.min(64,plotW/items.length*.63);
      items.forEach((it,i)=>{
        const yy=y(Number(it.value));
        shapes+='<rect x="'+(x(i)-bw/2)+'" y="'+yy+'" width="'+bw+'" height="'+(h-bottom-yy)+'" rx="4" fill="#117d78"/>';
      });
    }
    items.forEach((it,i)=>{
      shapes+='<text x="'+x(i)+'" y="'+Math.max(17,y(Number(it.value))-9)+'" text-anchor="middle" font-size="13" fill="#365260">'+esc(it.value)+'</text>';
      shapes+='<text x="'+x(i)+'" y="'+(h-bottom+23)+'" text-anchor="middle" font-size="12" fill="#526b79">'+esc(it.shortLabel||it.label)+'</text>';
    });
    return '<figure class="da-figure"><div class="da-chart-scroll"><svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(block.alt||block.caption||'资料统计图')+'">'+shapes+'</svg></div>'+
      (block.caption?'<figcaption>'+rich(block.caption)+'</figcaption>':'')+'</figure>';
  }
  function renderBlock(block){
    if(block.type==='paragraph')return '<p class="da-paragraph">'+rich(block.text)+'</p>';
    if(block.type==='table')return '<figure class="da-figure"><div class="da-table-scroll"><table><thead><tr>'+
      block.columns.map(cell=>renderCell(cell,'th')).join('')+'</tr></thead><tbody>'+
      block.rows.map(row=>'<tr>'+row.map(cell=>renderCell(cell,'td')).join('')+'</tr>').join('')+
      '</tbody></table></div>'+(block.caption?'<figcaption>'+rich(block.caption)+'</figcaption>':'')+'</figure>';
    if(block.type==='image')return '<figure class="da-figure"><img loading="lazy" decoding="async" src="'+esc(block.src)+'" alt="'+esc(block.alt)+'">'+
      (block.caption?'<figcaption>'+rich(block.caption)+'</figcaption>':'')+'</figure>';
    if(block.type==='chart')return renderChart(block);
    return '';
  }
  function materialHtml(material){
    if(!material)return '<div class="da-material-missing">材料暂缺，请检查题目的 materialId。</div>';
    const closed=collapsed.has(material.id);
    return '<section class="da-material"><header class="da-material-header"><div><span class="da-overline">共用资料</span><h3>'+esc(material.title)+'</h3>'+
      '<small>'+esc([material.year,material.exam].filter(Boolean).join(' · '))+'</small></div>'+
      '<button type="button" data-da-toggle="'+esc(material.id)+'" aria-expanded="'+(!closed)+'">'+(closed?'展开材料':'收起材料')+'</button></header>'+
      (closed?'':'<div class="da-material-body">'+(material.blocks||[]).map(renderBlock).join('')+'</div>')+'</section>';
  }
  function toggleMaterial(id){if(collapsed.has(id))collapsed.delete(id);else collapsed.add(id);}
  function explanationHtml(q){
    const a=q.analysis||{};
    const sections=[['考点识别',a.identify],['数据定位',a.locate],[a.formulaTitle||'公式与计算',a.formula],[a.quickTitle||'考场速解',a.quick],['易错点',a.trap]];
    return '<div class="da-explanation">'+sections.filter(x=>x[1]).map(([name,content])=>
      '<section class="da-explain-section"><h4>'+name+'</h4><div>'+rich(content)+'</div></section>').join('')+
      (q.longDivision?'<section class="da-explain-section da-long-division"><h4>竖式除法</h4><pre aria-label="竖式除法步骤">'+esc(q.longDivision)+'</pre></section>':'')+
      (typeof q.rule==='string'&&q.rule.trim()?'<div class="da-rule"><b>可迁移方法：</b>'+rich(q.rule.trim())+'</div>':'')+'</div>';
  }
  function validate(materials,questions,book,externalQuestionIds=[],externalTopicIds=[]){
    if(!Array.isArray(materials)||!Array.isArray(questions)||!book||!Array.isArray(book.sections))throw Error('资料分析 JSON 根结构错误');
    const seenM=new Set(),seenQ=new Set(externalQuestionIds),seenT=new Set(externalTopicIds);
    const imagePath=/^assets\/data-analysis\/(?!.*(?:^|\/)\.\.\/)[\w\-./]+\.(?:webp|png|jpe?g)$/i;
    for(const m of materials){
      if(!m||!/^data-material-[\w-]+$/.test(m.id)||seenM.has(m.id)||!m.title||!Array.isArray(m.blocks))throw Error('材料 ID、标题或 blocks 不合法');
      seenM.add(m.id);
      for(const b of m.blocks){
        if(b.type==='paragraph'){if(typeof b.text!=='string')throw Error('文字材料错误：'+m.id);}
        else if(b.type==='table'){
          if(!Array.isArray(b.columns)||!b.columns.length||!Array.isArray(b.rows)||!b.rows.every(row=>Array.isArray(row)))throw Error('统计表格错误：'+m.id);
        }else if(b.type==='image'){
          if(!imagePath.test(b.src)||!b.alt)throw Error('图片必须使用 assets/data-analysis 下的相对路径并提供 alt：'+m.id);
        }else if(b.type==='chart'){
          if(!['bar','line'].includes(b.chartType)||!Array.isArray(b.data)||b.data.length<1||b.data.length>12||
            !b.data.every(it=>it&&typeof it.label==='string'&&(!('shortLabel' in it)||typeof it.shortLabel==='string')&&Number.isFinite(it.value)&&it.value>=0))throw Error('图表数据不合法：'+m.id);
          if(b.yMin!==undefined||b.yMax!==undefined){
            const vals=b.data.map(it=>it.value);
            if(b.chartType!=='line'||!Number.isFinite(b.yMin)||!Number.isFinite(b.yMax)||
              b.yMin>=Math.min(...vals)||b.yMax<=Math.max(...vals))throw Error('折线图纵轴范围不合法：'+m.id);
          }
        }else throw Error('不支持的材料类型：'+b.type);
      }
    }
    for(const q of questions){
      if(!q||!/^data-[\w-]+$/.test(q.id)||seenQ.has(q.id)||!seenM.has(q.materialId)||!q.title||!q.stem||
        !q.category||!q.ask||!Array.isArray(q.options)||q.options.length<2||q.options.length>5||
        !q.options.every(opt=>typeof opt==='string'&&opt.trim())||
        !'ABCDE'.slice(0,q.options.length).includes(q.answer)||
        !q.analysis||!['identify','locate','formula','quick','trap'].every(k=>typeof q.analysis[k]==='string'))throw Error('资料分析题目格式或关联无效：'+(q&&q.id));
      if(q.important!==undefined&&typeof q.important!=='boolean')throw Error('重点题标记不合法：'+q.id);
      if(q.longDivision!==undefined&&(typeof q.longDivision!=='string'||q.longDivision.length>10000))throw Error('竖式内容格式错误：'+q.id);
      for(const label of ['formulaTitle','quickTitle'])if(q.analysis[label]!==undefined&&typeof q.analysis[label]!=='string')throw Error('解析标题格式错误：'+q.id);
      seenQ.add(q.id);
    }
    for(const section of book.sections){
      if(!section.id||!section.title||!section.chapter||!Array.isArray(section.topics))throw Error('知识章节不完整');
      for(const t of section.topics){
        if(!/^data-topic-[\w-]+$/.test(t.id)||seenT.has(t.id)||!t.title||!t.summary||
          !Array.isArray(t.questionIds)||t.questionIds.some(id=>!questions.some(q=>q.id===id)))throw Error('资料分析知识点不合法：'+(t&&t.id));
        seenT.add(t.id);
      }
    }
    return true;
  }
  root.DataAnalysis={rich,renderMath,materialHtml,toggleMaterial,explanationHtml,validate};
})(globalThis);
