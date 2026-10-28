const API_BASE = 'https://fipe.parallelum.com.br/api/v2';
const API_TOKEN = window.FIPE_CONFIG?.token || "";
const VEHICLE = 'trucks';

const els = {
  brand: document.getElementById('brandSelect'),
  model: document.getElementById('modelSelect'),
  year: document.getElementById('yearSelect'),
  btnConsultar: document.getElementById('btnConsultar'),
  btnCopy: document.getElementById('btnCopy'),
  btnFav: document.getElementById('btnFav'),
  btnLimpar: document.getElementById('btnLimpar'),
  btnImprimir: document.getElementById('btnImprimir'),
  resultado: document.getElementById('resultado'),
  printMeta: document.getElementById('print-meta'),
  printTime: document.getElementById('print-time'),
  printCard: document.getElementById('print-card'),
  favBody: document.getElementById('favBody'),
  favEmpty: document.getElementById('favEmpty'),
  btnAtualizarTodos: document.getElementById('btnAtualizarTodos'),
  btnExportCSV: document.getElementById('btnExportCSV'),
  btnExportXLSX: document.getElementById('btnExportXLSX'),
  btnImprimirFav: document.getElementById('btnImprimirFav'),
  printFavMeta: document.getElementById('print-fav-meta'),
  printFavTime: document.getElementById('print-fav-time'),
  printFavCard: document.getElementById('print-fav-card'),
  tabs: Array.from(document.querySelectorAll('.tab')),
  views: Array.from(document.querySelectorAll('.view')),
  toastRoot: document.getElementById('toast'),
  themeToggle: document.getElementById('themeToggle')
};

let data = [];
let latestReference = null;
let currentDetails = null;

function toast(msg, type='info', position='tr', ms=2500){
  const t = document.createElement('div');
  t.className = 'toast ' + (type==='success'?'success':type==='warn'?'warn':'info') + (position==='center'?' center':'');
  const icon = document.createElement('div');
  icon.className = 'ticon';
  icon.innerHTML = type==='success'
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    : type==='warn'
    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 9v4" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="#fff"/><path d="M12 3l9 16H3l9-16z" stroke="#fff" stroke-width="2"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#fff" stroke-width="2"/><path d="M12 8v5" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="#fff"/></svg>';
  const span = document.createElement('span');
  span.textContent = msg;
  const close = document.createElement('button');
  close.className = 'tclose';
  close.textContent = '×';
  close.addEventListener('click', remove);
  t.appendChild(icon); t.appendChild(span); t.appendChild(close);
  els.toastRoot.appendChild(t);
  const timer = setTimeout(remove, ms);
  function remove(){
    clearTimeout(timer);
    t.style.transition = 'opacity .18s, transform .18s';
    if(position==='center') t.style.transform = 'translate(-50%, -10px)';
    else t.style.transform = 'translateX(10px)';
    t.style.opacity = '0';
    setTimeout(()=>{ t.remove(); }, 200);
  }
}

async function fetchJSON(url, opts={}){
  const res = await fetch(url, opts);
  if(!res.ok) throw new Error('Erro na requisição');
  return await res.json();
}

async function getLatestReference(){
  const refs = await fetchJSON(`${API_BASE}/references`,{headers:{accept:'application/json','content-type':'application/json','X-Subscription-Token':API_TOKEN}});
  return refs && refs.length ? refs[0] : null;
}

function uniqueBy(arr, keyFn){
  const map = new Map();
  for(const item of arr){
    const k = keyFn(item);
    if(!map.has(k)) map.set(k,item);
  }
  return Array.from(map.values());
}

function populateBrands(){
  const rows = uniqueBy(data, r => r['Brand Code']);
  const options = rows.map(r => ({code: String(r['Brand Code']), name: String(r['Brand Value'])}));
  options.sort((a,b)=>a.name.localeCompare(b.name));
  els.brand.innerHTML = `<option value="">Selecione</option>` + options.map(o=>`<option value="${o.code}">${o.name}</option>`).join('');
  els.brand.disabled = false;
}

function populateModels(brandId){
  const rows = uniqueBy(data.filter(r => String(r['Brand Code'])===String(brandId)), r => r['Model Code']);
  const options = rows.map(r => ({code: String(r['Model Code']), name: String(r['Model Value'])}));
  options.sort((a,b)=>a.name.localeCompare(b.name));
  els.model.innerHTML = `<option value="">Selecione</option>` + options.map(o=>`<option value="${o.code}">${o.name}</option>`).join('');
  els.model.disabled = false;
  els.year.innerHTML = `<option value="">Selecione</option>`;
  els.year.disabled = true;
  els.btnConsultar.disabled = true;
  els.btnCopy.disabled = true;
  els.btnFav.disabled = true;
}

function populateYears(brandId, modelId){
  const rows = uniqueBy(data.filter(r => String(r['Brand Code'])===String(brandId) && String(r['Model Code'])===String(modelId)), r => r['Year Code']);
  const options = rows.map(r => ({code: String(r['Year Code']), name: String(r['Year Value'])}));
  options.sort((a,b)=>Number(b.name)-Number(a.name));
  els.year.innerHTML = `<option value="">Selecione</option>` + options.map(o=>`<option value="${o.code}">${o.name}</option>`).join('');
  els.year.disabled = false;
  els.btnConsultar.disabled = true;
  els.btnCopy.disabled = true;
  els.btnFav.disabled = true;
}

function renderResult(details){
  currentDetails = details;
  const price = `<div class="price-box"><span>${details.price || ''}</span><span class="pill">${details.referenceMonth || ''}</span></div>`;
  const grid = `
    <div class="result-grid">
      <div class="kv"><div class="k">Marca</div><div class="v">${details.brand || ''}</div></div>
      <div class="kv"><div class="k">Modelo</div><div class="v">${details.model || ''}</div></div>
      <div class="kv"><div class="k">Ano</div><div class="v">${details.modelYear || ''}</div></div>
      <div class="kv"><div class="k">Combustível</div><div class="v">${details.fuel || ''} ${details.fuelAcronym?`(${details.fuelAcronym})`:''}</div></div>
      <div class="kv"><div class="k">Código FIPE</div><div class="v">${details.codeFipe || ''}</div></div>
      <div class="kv"><div class="k">Tipo</div><div class="v">${details.vehicleType===3?'Caminhão':''}</div></div>
      <div class="kv"><div class="k">Referência</div><div class="v">${details.referenceMonth || ''}</div></div>
    </div>
  `;
  els.resultado.innerHTML = price + grid;
  els.resultado.classList.remove('hidden');
  els.btnCopy.disabled = false;
  els.btnFav.disabled = false;
}

async function consultar(){
  const brandId = els.brand.value;
  const modelId = els.model.value;
  const yearId = els.year.value;
  if(!brandId || !modelId || !yearId) return;
  try{
    const refParam = latestReference ? `?reference=${latestReference.code}` : '';
    const url = `${API_BASE}/${VEHICLE}/brands/${brandId}/models/${modelId}/years/${encodeURIComponent(yearId)}${refParam}`;
    const details = await fetchJSON(url,{headers:{accept:'application/json','content-type':'application/json','X-Subscription-Token':API_TOKEN}});
    details.vehicleType = 3;
    renderResult(details);
    toast('Consulta realizada','success');
  }catch(e){
    toast('Falha na consulta','warn');
  }
}

function copyValor(){
  if(!currentDetails || !currentDetails.price) return toast('Sem valor para copiar','warn');
  const valor = String(currentDetails.price).replace(/\s+/g,' ').trim();
  navigator.clipboard.writeText(valor).then(()=>toast('Valor copiado: '+valor,'success')).catch(()=>{
    const ta=document.createElement('textarea');
    ta.value=valor;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast('Valor copiado: '+valor,'success');
  });
}

function limpar(){
  els.brand.value='';
  els.model.innerHTML='<option value="">Selecione</option>';
  els.year.innerHTML='<option value="">Selecione</option>';
  els.model.disabled=true;
  els.year.disabled=true;
  els.btnConsultar.disabled=true;
  els.btnCopy.disabled=true;
  els.btnFav.disabled=true;
  els.resultado.classList.add('hidden');
  els.resultado.innerHTML='';
  currentDetails=null;
  toast('Limpo','info');
}

function nowBR(){
  return new Date().toLocaleString('pt-BR');
}

function printConsulta(){
  if(!currentDetails) return toast('Faça uma consulta','warn');
  const brandName = els.brand.options[els.brand.selectedIndex]?.text||'';
  const modelName = els.model.options[els.model.selectedIndex]?.text||'';
  const yearName = els.year.options[els.year.selectedIndex]?.text||'';
  els.printMeta.textContent = `Marca: ${brandName} • Modelo: ${modelName} • Ano: ${yearName}`;
  els.printTime.textContent = nowBR();
  const c = document.createElement('div');
  c.innerHTML = els.resultado.innerHTML;
  els.printCard.innerHTML = '';
  els.printCard.appendChild(c);
  window.print();
}

function printFavoritos(){
  els.printFavMeta.textContent = `Itens: ${getFavs().length}`;
  els.printFavTime.textContent = nowBR();
  const rows = getFavs();
  const tbl = document.createElement('table');
  tbl.style.width='100%';
  tbl.style.borderCollapse='collapse';
  tbl.innerHTML = `
    <thead>
      <tr>
        <th>Marca</th><th>Modelo</th><th>Ano</th><th>Código FIPE</th><th>Combustível</th><th>Preço</th><th>Referência</th><th>Atualizado</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map(r=>`<tr>
        <td>${r.brandName||''}</td>
        <td>${r.modelName||''}</td>
        <td>${r.yearName||''}</td>
        <td>${r.codeFipe||''}</td>
        <td>${r.fuel||''}</td>
        <td>${r.price||''}</td>
        <td>${r.referenceMonth||''}</td>
        <td>${r.updatedAt||''}</td>
      </tr>`).join('')}
    </tbody>`;
  els.printFavCard.innerHTML='';
  els.printFavCard.appendChild(tbl);
  window.print();
}

function getFavs(){
  try{ return JSON.parse(localStorage.getItem('fipe_favs_trucks')||'[]'); }catch{ return []; }
}
function setFavs(arr){
  localStorage.setItem('fipe_favs_trucks', JSON.stringify(arr));
}
function addFav(){
  if(!currentDetails) return;
  const brandId = els.brand.value;
  const modelId = els.model.value;
  const yearId = els.year.value;
  const brandName = els.brand.options[els.brand.selectedIndex]?.text||'';
  const modelName = els.model.options[els.model.selectedIndex]?.text||'';
  const yearName = els.year.options[els.year.selectedIndex]?.text||'';
  const exists = getFavs().some(x=>x.brandId===brandId && x.modelId===modelId && x.yearId===yearId);
  if(exists) return toast('Já nos favoritos','info');
  const entry = {
    vehicle: VEHICLE,
    brandId, brandName,
    modelId, modelName,
    yearId, yearName,
    codeFipe: currentDetails.codeFipe||'',
    fuel: currentDetails.fuel||'',
    price: currentDetails.price||'',
    referenceMonth: currentDetails.referenceMonth||'',
    updatedAt: nowBR()
  };
  const arr = getFavs(); arr.push(entry); setFavs(arr);
  renderFavs();
  toast('Adicionado aos favoritos','success');
}
function removeFav(idx){
  const arr = getFavs();
  arr.splice(idx,1);
  setFavs(arr);
  renderFavs();
  toast('Removido','info');
}
async function refreshOne(i){
  const arr = getFavs();
  const it = arr[i];
  if(!it) return;
  try{
    const refParam = latestReference ? `?reference=${latestReference.code}` : '';
    const url = `${API_BASE}/${VEHICLE}/brands/${it.brandId}/models/${it.modelId}/years/${encodeURIComponent(it.yearId)}${refParam}`;
    const details = await fetchJSON(url,{headers:{accept:'application/json','content-type':'application/json','X-Subscription-Token':API_TOKEN}});
    it.codeFipe = details.codeFipe||it.codeFipe||'';
    it.fuel = details.fuel||it.fuel||'';
    it.price = details.price||it.price||'';
    it.referenceMonth = details.referenceMonth||it.referenceMonth||'';
    it.updatedAt = nowBR();
    arr[i]=it; setFavs(arr);
  }catch(e){}
}
async function refreshAll(){
  const len = getFavs().length;
  if(!len) return toast('Nada para atualizar','info');
  toast('Atualizando favoritos','info');
  for(let i=0;i<len;i++){
    await refreshOne(i);
    renderFavs();
  }
  toast('Favoritos atualizados','success');
}
function renderFavs(){
  const rows = getFavs();
  els.favBody.innerHTML = rows.map((r,i)=>`
    <tr>
      <td>${r.brandName||''}</td>
      <td>${r.modelName||''}</td>
      <td>${r.yearName||''}</td>
      <td>${r.codeFipe||''}</td>
      <td>${r.fuel||''}</td>
      <td>${r.price||''}</td>
      <td>${r.referenceMonth||''}</td>
      <td>${r.updatedAt||''}</td>
      <td class="row" style="gap:6px">
        <button class="btn secondary" data-act="refresh" data-i="${i}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 1 1 2.3 5.7" stroke="currentColor" stroke-width="2"/><path d="M4 18v-4h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          Atualizar
        </button>
        <button class="btn ghost" data-act="remove" data-i="${i}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" stroke-width="2"/></svg>
          Remover
        </button>
      </td>
    </tr>
  `).join('');
  els.favEmpty.style.display = rows.length ? 'none' : 'block';
}

function toCSV(){
  const rows = getFavs();
  const head = ['Marca','Modelo','Ano','Código FIPE','Combustível','Preço','Referência','Atualizado'];
  const lines = [head].concat(rows.map(r=>[
    r.brandName||'',r.modelName||'',r.yearName||'',r.codeFipe||'',r.fuel||'',r.price||'',r.referenceMonth||'',r.updatedAt||''
  ]));
  const csv = lines.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `favoritos_fipe_caminhoes_${Date.now()}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
}

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
async function toXLSX(){
  const rows = getFavs();
  const cols = ['Marca','Modelo','Ano','Código FIPE','Combustível','Preço','Referência','Atualizado'];
  const sheetRows = [
    `<row r="1">${cols.map((c,i)=>`<c r="${String.fromCharCode(65+i)}1" t="inlineStr"><is><t>${esc(c)}</t></is></c>`).join('')}</row>`
  ].concat(rows.map((r,idx)=>{
    const i = idx+2;
    const vals = [r.brandName||'',r.modelName||'',r.yearName||'',r.codeFipe||'',r.fuel||'',r.price||'',r.referenceMonth||'',r.updatedAt||''];
    return `<row r="${i}">${vals.map((v,j)=>`<c r="${String.fromCharCode(65+j)}${i}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`).join('')}</row>`;
  })).join('');
  const sheetXML = `<?xml version="1.0" standalone="yes"?>
  <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
    <sheetData>${sheetRows}</sheetData>
  </worksheet>`;
  const wbXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
    <sheets>
      <sheet name="Favoritos" sheetId="1" r:id="rId1"/>
    </sheets>
  </workbook>`;
  const relsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  </Relationships>`;
  const wbRelsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  </Relationships>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
    <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  </Types>`;
  const zip = new JSZip();
  zip.file('[Content_Types].xml', contentTypes);
  zip.folder('_rels').file('.rels', relsXML);
  const xl = zip.folder('xl');
  xl.file('workbook.xml', wbXML);
  xl.folder('_rels').file('workbook.xml.rels', wbRelsXML);
  xl.folder('worksheets').file('sheet1.xml', sheetXML);
  const blob = await zip.generateAsync({type:'blob'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `favoritos_fipe_caminhoes_${Date.now()}.xlsx`;
  document.body.appendChild(a); a.click(); a.remove();
}

function enableConsultar(){
  els.btnConsultar.disabled = !(els.brand.value && els.model.value && els.year.value);
}

function onFavTableClick(e){
  const btn = e.target.closest('button[data-act]');
  if(!btn) return;
  const i = Number(btn.dataset.i);
  const act = btn.dataset.act;
  if(act==='remove'){ removeFav(i); }
  if(act==='refresh'){ refreshOne(i).then(()=>{ renderFavs(); toast('Atualizado','success'); }); }
}

function switchView(view){
  els.views.forEach(v=>v.classList.remove('active'));
  const target = document.querySelector('.view-'+view);
  if(target) target.classList.add('active');
  els.tabs.forEach(t=>{
    const active = t.dataset.view===view;
    t.classList.toggle('active', active);
    t.setAttribute('aria-selected', active?'true':'false');
    t.setAttribute('tabindex', active?'0':'-1');
  });
  if(view==='consulta') window.scrollTo({top:0,behavior:'smooth'});
}

function initNav(){
  document.querySelectorAll('[data-view]').forEach(el=>{
    el.addEventListener('click',(e)=>{
      const v = el.getAttribute('data-view');
      if(v){ e.preventDefault(); switchView(v); }
    });
    el.addEventListener('keydown',(e)=>{
      if(e.key==='Enter' || e.key===' '){
        const v = el.getAttribute('data-view');
        if(v){ e.preventDefault(); switchView(v); }
      }
    });
  });
  document.querySelectorAll('[data-scroll]').forEach(el=>{
    el.addEventListener('click',()=>{
      const sel = el.getAttribute('data-scroll');
      const tgt = document.querySelector(sel);
      if(tgt){ tgt.scrollIntoView({behavior:'smooth',block:'start'}); }
    });
  });
}

function detectSystemTheme(){
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function applyTheme(theme){
  const root = document.documentElement;
  if(theme==='auto'){
    const sys = detectSystemTheme();
    root.setAttribute('data-theme', sys);
  }else{
    root.setAttribute('data-theme', theme);
  }
}
function setTheme(theme){
  localStorage.setItem('theme', theme);
  applyTheme(theme);
  toast(theme==='dark'?'Tema escuro ativo':theme==='light'?'Tema claro ativo':'Tema automático','info');
}
function initTheme(){
  const saved = localStorage.getItem('theme') || 'light';
  applyTheme(saved);
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  if(saved==='auto' && mq.addEventListener){
    mq.addEventListener('change',()=>applyTheme('auto'));
  }
  if(els.themeToggle){
    els.themeToggle.addEventListener('click',()=>{
      const curr = document.documentElement.getAttribute('data-theme') || saved || 'light';
      const next = curr==='light' ? 'dark' : 'light';
      setTheme(next);
    });
  }
}

async function init(){
  initNav();
  initTheme();
  try{
    latestReference = await getLatestReference();
  }catch(e){}
  try{
    const res = await fetch('FipeCaminhao.json',{cache:'reload'});
    data = await res.json();
  }catch(e){
    toast('Falha ao carregar base local','warn');
    data = [];
  }
  if(Array.isArray(data) && data.length){
    populateBrands();
  }else if(data && typeof data==='object'){
    const first = Object.values(data)[0]||[];
    data = first;
    populateBrands();
  }
  renderFavs();
  toast('Base local carregada','success');
  els.brand.addEventListener('change',()=>{ if(els.brand.value){ populateModels(els.brand.value); } enableConsultar(); });
  els.model.addEventListener('change',()=>{ if(els.model.value){ populateYears(els.brand.value, els.model.value); } enableConsultar(); });
  els.year.addEventListener('change',()=>{ enableConsultar(); });
  els.btnConsultar.addEventListener('click',consultar);
  els.btnCopy.addEventListener('click',copyValor);
  els.btnFav.addEventListener('click',addFav);
  els.btnLimpar.addEventListener('click',limpar);
  els.btnImprimir.addEventListener('click',printConsulta);
  els.btnAtualizarTodos.addEventListener('click',refreshAll);
  els.btnExportCSV.addEventListener('click',toCSV);
  els.btnExportXLSX.addEventListener('click',toXLSX);
  els.btnImprimirFav.addEventListener('click',printFavoritos);
  els.favBody.addEventListener('click',onFavTableClick);
}
init();
