'use strict';

const $ = (selector) => document.querySelector(selector);
const icons = {
  route:'<circle cx="5.5" cy="5.5" r="2"/><circle cx="18.5" cy="18.5" r="2"/><path d="M7.5 5.5H16a3.25 3.25 0 0 1 0 6.5H8a3.25 3.25 0 0 0 0 6.5h8.5"/>',
  direction:'<path d="m3 11 17-7-7 17-2-8-8-2z"/>',
  external:'<path d="M13 4h7v7m0-7L10 14M10 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-4"/>',
  attention:'<path d="m10.3 4.7-8 14a1.7 1.7 0 0 0 1.5 2.5h16.4a1.7 1.7 0 0 0 1.5-2.5l-8-14a1.9 1.9 0 0 0-3.4 0zM12 9v4m0 3v.1"/>',
  flag:'<path d="M5 21V3m0 1c4-3 9 3 14 0v10c-5 3-10-3-14 0"/>',
  compare:'<path d="M5 6h15m-4-4 4 4-4 4M19 18H4m4-4-4 4 4 4"/>',
  layers:'<path d="m3 9.5 9-5 9 5-9 5z"/><path d="m4 14 8 4.5 8-4.5M4 18l8 4 8-4"/>',
  chart:'<path d="M3 3v17h18M7 14l4-5 4 3 5-7"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 4.8-5 13.2 0 18 5-4.8 5-13.2 0-18z"/>',
  rain:'<path d="M6.5 15a4.5 4.5 0 0 1-.1-9 6 6 0 0 1 11.5 1.9A3.6 3.6 0 0 1 18.4 15M8 17l-1 3m5-3-1 3m5-3-1 3"/>',
  sun:'<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.45 1.45m11.3 11.3 1.45 1.45M19.1 4.9l-1.45 1.45m-11.3 11.3L4.9 19.1"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6.5v5.8l3.5 2"/>',
  refresh:'<path d="M20 3v5h-5M4 21v-5h5M4.7 8a8 8 0 0 1 13.2-3l2 3M4 16l2 3a8 8 0 0 0 13.4-3"/>',
  pin:'<path d="M20 10.2C20 16.1 12 22 12 22S4 16.1 4 10.2a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
  'chevron-down':'<path d="m6 9 6 6 6-6"/>',
  cpu:'<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9" y="9" width="6" height="6" rx=".8"/><path d="M9 3v3m6-3v3M9 18v3m6-3v3M3 9h3m-3 6h3m12-6h3m-3 6h3"/>',
  mountain:'<path d="m2 20 7-12 4 6 3-4 6 10H2z"/><path d="m6.5 12.5 2.5 1 2-1"/>',
  towers:'<path d="M2 21h20M5 21V9h5v12M14 21V9h5v12M6 9V6h3v3m6 0V6h3v3M7.5 6V2m9 4V2M10 13h4M10 15h4"/>',
  coastal:'<path d="M2 17c2.3 0 2.7-2 5-2s3 2 5 2 2.7-2 5-2 3 2 5 2M2 21c2.3 0 2.7-2 5-2s3 2 5 2 2.7-2 5-2 3 2 5 2"/><path d="M3 12h18M8 12a4 4 0 0 1 8 0m-4-8V2m6 5 1.5-1.5M6 7 4.5 5.5"/>',
  city:'<path d="M2 21h20M4 21V8h5v13M9 21V4h7v17m0-10h4v10M11.5 7h2m-2 3h2m-2 3h2"/>',
  forest:'<path d="m3 17 4-6H5l4-7 4 7h-2l4 6H3zM9 17v4m6-7 2-3h-1l2.5-4 3 5h-1.5l2.5 4.5H17m1.5.5v4"/>',
  bridge:'<path d="M2 17h20M5 20V6m14 14V6M2 12c2.4 0 2.6-3.2 3-4 3 7 11 7 14 0 .3 1.5 1.4 4.7 3 5M9 13v4m6-4v4"/>',
  lighthouse:'<path d="M2 21h20M8 20l2-11h4l2 11M8.5 9h7m-6-3 2.5-3L14.5 6zM10 6v3m4-3v3M9.1 14h5.8M2 6l4-1m12 0 4 1"/>',
  fort:'<path d="M2 21h20M4 21V8h3v3h3V8h4v3h3V8h3v13M9 21v-4a3 3 0 0 1 6 0v4"/>',
  x:'<path d="m6 6 12 12M18 6 6 18"/>',check:'<path d="m4 12 5 5L20 6"/>',
  filter:'<path d="M3 4h18l-7 8v6l-4 2v-8z"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8v.1"/>',
  dash:'<path d="M5 12h14"/>'
};
function icon(key) {
  return '<svg class="ico" aria-hidden="true" viewBox="0 0 24 24">' + (icons[key] || icons.pin) + '</svg>';
}
for (const element of document.querySelectorAll('[data-icon]')) element.innerHTML = icon(element.dataset.icon);
const known = [
  ['genting-highlands','Genting Highlands','Pahang','mountain'], ['kuala-lumpur','Kuala Lumpur','Kuala Lumpur','towers'],
  ['kluang','Kluang','Johor','forest'], ['desaru','Desaru','Johor','coastal'], ['johor-bahru','Johor Bahru','Johor','city'],
  ['kota-tinggi','Kota Tinggi','Johor','bridge'], ['mersing','Mersing','Johor','lighthouse'],
  ['port-dickson','Port Dickson','Negeri Sembilan','coastal'], ['melaka','Melaka','Melaka','fort']
].map(([id,name,state,icon]) => ({id,name,state,icon}));
const staticLocations = new Map(known.map(p=>[p.id,p]));
const tz = 'Asia/Kuala_Lumpur';
const HOUR = 3600000;
const CHECK_INTERVAL = 5 * 60 * 1000;
const fmt = (date, opts) => date.toLocaleString('en-GB',{timeZone:tz,...opts});
const clock = date => fmt(date,{hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const validDate = value => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
const safeStore = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k,v) { try { localStorage.setItem(k,v); } catch {} }
};
const params = new URLSearchParams(location.search);
let lead = Number(params.get('lead') || safeStore.get('ridecast.lead')) === 24 ? 24 : 10;
let chosen = params.get('stop') || safeStore.get('ridecast.stop') || 'genting-highlands';
if (!staticLocations.has(chosen)) chosen='genting-highlands';
let filter='all', data=null, lastAttempt=0, failed=false, loading=false, refreshTimer;
const views = {
  forecast:['Ride forecast','Rain outlooks for nine riding stops across Malaysia.'],
  guide:['Ride guide','Compare routes from Woodlands Checkpoint to nine riding stops across Malaysia.'],
  performance:['Model performance','Rain caught, rain missed, and false alarms at each riding stop.']
};
function currentView() {
  const name = location.hash.slice(1);
  return Object.hasOwn(views, name) ? name : 'forecast';
}
let view = currentView();
const getLocations = () => {
  const src = data?.metadata?.locations;
  return Array.isArray(src) && src.length ? src.map(p=>({...staticLocations.get(p.id),...p})).sort((a,b)=>known.findIndex(k=>k.id===a.id)-known.findIndex(k=>k.id===b.id)) : known;
};
const horizon = () => data?.horizons?.[lead] || null;
const choice = (p)=>p.horizons?.[lead];
function statusOf(p) {
  const row = horizon()?.locations?.find(r=>r.id===p.id);
  if (!row || windowEnded() || !['dry','rain'].includes(row.call)) return 'unavailable';
  return row.call;
}
function windowEnded() { const end=validDate(horizon()?.endUtc); return end && end<=new Date(); }
function isStale() {
  const last=validDate(data?.lastCheckedUtc);
  return Boolean(failed || ['stale','unavailable'].includes(data?.refreshState) || horizon()?.stale || (last && Date.now()-last.getTime()>HOUR*1.5));
}
function updateLocationUrl() {
  const url=new URL(location.href);
  url.searchParams.set('stop',chosen); url.searchParams.set('lead',String(lead));
  history.replaceState(null,'',url);
}
function labelFor(c) { return c==='rain'?'Rain':c==='dry'?'Dry':(data || failed)?'No call':'Loading'; }
function weatherIcon(c) { return c==='rain'?'rain':c==='dry'?'sun':data || failed?'dash':'clock'; }
function tag(c, old=false) {
  const previous=old && (c==='rain'||c==='dry');
  return '<span class="call-tag '+c+'"'+(previous?' title="Previous forecast"':'')+'>'+icon(previous?'clock':weatherIcon(c))+'<span>'+(previous?'Last '+c:labelFor(c))+'</span></span>';
}
function locationMarkup(p) {
  return '<span class="place-icon">'+icon(p.icon)+'</span><span class="place-text"><span class="place-name">'+escapeHTML(p.name)+'</span><span class="place-region">'+escapeHTML(p.state || 'Malaysia')+'</span></span>';
}
function renderStops(list) {
  const rows=list.filter(p=>filter==='all' || statusOf(p)===filter);
  const focused=document.activeElement?.dataset?.pick;
  $('#stop-grid').innerHTML=rows.map(p=>'<button type="button" class="stop-card" data-pick="'+escapeHTML(p.id)+'" aria-pressed="'+(chosen===p.id)+'">'+locationMarkup(p)+tag(statusOf(p),isStale() || horizon()?.locations?.find(r=>r.id===p.id)?.stale)+'</button>').join('');
  if (focused) [...$('#stop-grid').children].find(el=>el.dataset.pick===focused)?.focus({preventScroll:true});
  $('#stop-count').textContent=rows.length;
  $('#empty').hidden=Boolean(rows.length);
  $('#empty-copy').textContent='No stops have a '+(filter==='rain'?'rain':'dry')+' call for this window.';
  document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));
}
function periodLabel(period) {
  const start=validDate(period?.start),end=validDate(period?.end);
  if (!start || !end) return '';
  const sameMonth=fmt(start,{month:'short',year:'numeric'})===fmt(end,{month:'short',year:'numeric'});
  return fmt(start,sameMonth?{day:'numeric'}:{day:'numeric',month:'short'})+'–'+fmt(end,{day:'numeric',month:'short',year:'numeric'});
}
const valueF1 = n => Number.isFinite(n) ? n.toFixed(3) : '—';
const percentage = n => Number.isFinite(n)?Math.round(100*n)+'%':'—';
function renderPerformance(list) {
  const period=periodLabel(data?.metadata?.verificationPeriod);
  $('#performance-dates').textContent=period?'Historical test · '+period+' · Three-hour windows':'Historical results are awaiting the forecast data.';
  $('#perf-grid').innerHTML=list.map(p=>{
    const model=choice(p), m=model?.verification;
    const header='<div class="perf-place"><span class="place-icon">'+icon(p.icon)+'</span><div><h3>'+escapeHTML(p.name)+'</h3><p class="perf-model">'+escapeHTML(model?.modelLabel || 'No published model')+'</p></div></div>';
    if(!m) return '<article class="perf-card">'+header+'<p class="perf-none">Results unavailable.</p></article>';
    return '<article class="perf-card">'+header+'<div class="perf-stats"><div><small>Rain F1</small><strong>'+valueF1(m.f1)+'</strong></div><div><small>Precision</small><strong>'+percentage(m.precision)+'</strong></div><div><small>Recall</small><strong>'+percentage(m.recall)+'</strong></div></div><div class="perf-counts">'+escapeHTML(m.hits)+' rain caught · '+escapeHTML(m.misses)+' missed · '+escapeHTML(m.falseAlarms)+' false alarms<br>'+escapeHTML(m.n)+' verified windows · '+escapeHTML(p.reference || 'Local reference')+'</div></article>';
  }).join('');
  const s=periodLabel(data?.metadata?.selectionPeriod);
  $('#perf-note').textContent='F1 balances rain precision and recall. Higher is better, with 1.00 the highest possible score.'+(s?' Models were selected per stop and lead using '+s+' validation results.':'')+' Each rain call covers at least 0.1 mm during one three-hour window.';
}
function render() {
  const list=getLocations(), p=list.find(x=>x.id===chosen) || list[0];
  const h=horizon(), c=statusOf(p), selectedRow=h?.locations?.find(r=>r.id===p.id), stale=isStale() || selectedRow?.stale;
  for (const name of Object.keys(views)) {
    const nav = $('#nav-'+name);
    if (name === view) nav.setAttribute('aria-current','page');
    else nav.removeAttribute('aria-current');
    $('#'+name+'-view').hidden = name !== view;
  }
  $('#page-title').textContent=views[view][0];
  $('#page-copy').textContent=views[view][1];
  $('.update').hidden = view === 'guide';
  document.title=$('#page-title').textContent+' · Ridecast';
  $('#selected-name').textContent=p.name;
  $('#selected-region').textContent=(p.state || 'Malaysia')+(p.state?' · Malaysia':'');
  const message=c==='rain'?'Rain expected':c==='dry'?'Dry expected':windowEnded()?'Window ended':!data&&!failed?'Checking forecast…':'Forecast unavailable';
  $('#hero-call').className='hero-call '+c;
  $('#hero-call').innerHTML=icon(weatherIcon(c))+'<strong>'+escapeHTML(stale && c!=='unavailable'?'Last call · '+message:message)+'</strong>';
  $('#window-model').textContent=choice(p)?.modelLabel || (!data && !failed?'Checking…':'Unavailable');
  const issuedAt=validDate(selectedRow?.generatedUtc || h?.generatedUtc), issuedEl=$('#issued');
  issuedEl.hidden=!issuedAt || c==='unavailable';
  if(issuedAt){issuedEl.dateTime=issuedAt.toISOString();issuedEl.textContent='Issued '+fmt(issuedAt,{day:'numeric',month:'short'})+' · '+clock(issuedAt)+' MYT';}
  const start=validDate(h?.startUtc),end=validDate(h?.endUtc);
  $('#window-date').textContent=start?fmt(start,{weekday:'long',day:'numeric',month:'short'}):'Awaiting forecast window';
  $('#window-range').innerHTML=start&&end?escapeHTML(clock(start)+' – '+clock(end))+'<span class="time-unit">MYT</span>':'—';
  $('.window-rail').style.visibility=start&&end?'visible':'hidden';
  const crossDate=start&&end&&fmt(start,{day:'numeric'})!==fmt(end,{day:'numeric'});
  $('#window-note').textContent=crossDate?'The three-hour window ends the following day.':'One rain call covers the full three hours.';
  const checked=validDate(data?.lastCheckedUtc);
  $('#update-time').textContent=checked?'Checked '+fmt(checked,{day:'numeric',month:'short'})+' · '+clock(checked)+' MYT':loading?'Checking forecasts…':'Update time unavailable';
  $('#update-frequency').textContent='Hourly updates';
  const refresh=$('#refresh');refresh.disabled=loading;refresh.setAttribute('aria-busy',String(loading));
  const notices=[];
  if(failed) notices.push(data?'The refresh failed. Showing the last saved forecast.':'Forecast service unavailable. Please try refreshing.');
  else if(windowEnded()) notices.push('This forecast window has ended. A new forecast is pending.');
  else if(isStale()) notices.push(h?'The latest hourly update is unavailable. Check the date and time of the last window below.':'The next forecast is unavailable. The dashboard will check again.');
  else if(data?.refreshState==='partial') notices.push('Some stops are awaiting fresh model inputs. Check the issue time for your stop.');
  else if(selectedRow?.stale) notices.push('This stop is showing its last issued call while fresh model inputs are pending.');
  else if(data?.refreshState==='updating') notices.push('Checking for new model runs. Showing the most recently issued forecasts.');
  if(!notices.length && data && (!h || (h.locations || []).every(r=>r.call==='unavailable'))) notices.push('Forecast inputs are unavailable for this outlook. The dashboard will check again.');
  const notice=$('#notice');notice.hidden=view==='guide' || notices.length===0;notice.textContent=notices.join(' ');
  document.querySelectorAll('[data-horizon]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.horizon)===lead)));
  renderStops(list);renderPerformance(list);
  window.rideGuideUI?.render(p);
  $('#picker-list').innerHTML=list.map(x=>'<button type="button" class="picker-entry" aria-pressed="'+(chosen===x.id)+'" data-dialog-pick="'+escapeHTML(x.id)+'">'+locationMarkup(x)+(chosen===x.id?'<span class="picker-check">'+icon('check')+'</span>':'')+'</button>').join('');
}
function announce(message) { $('#announcement').textContent=message; }
function selectSpot(id,fromCard) {
  if(!getLocations().some(p=>p.id===id)) return;
  chosen=id;safeStore.set('ridecast.stop',chosen);updateLocationUrl();render();
  const p=getLocations().find(x=>x.id===chosen);
  announce(view==='guide'?p.name+' ride guide selected.':p.name+' selected. '+$('#hero-call').innerText+'.');
  if(fromCard) {
    const spot=$('.spotlight'), box=spot.getBoundingClientRect();
    if(box.top < -50) spot.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  }
}
function setLead(newLead) {
  lead=newLead;safeStore.set('ridecast.lead',String(lead));updateLocationUrl();render();
  announce(lead+'-hour outlook selected.');
}
document.addEventListener('click',e=>{
  const el=e.target.closest('button');if(!el)return;
  if(el.dataset.horizon) setLead(Number(el.dataset.horizon));
  if(el.dataset.filter || el.id==='clear-filter'){filter=el.dataset.filter || 'all';render();announce($('#stop-count').textContent+' stops shown.');}
  if(el.dataset.pick)selectSpot(el.dataset.pick,true);
  if(el.dataset.dialogPick){$('#stop-dialog').close();selectSpot(el.dataset.dialogPick,false);}
});
for (const opener of [$('#change-stop'), $('#guide-change')]) {
  opener.addEventListener('click',()=>{$('#stop-dialog').showModal();$('#picker-list [aria-pressed="true"]')?.focus();});
}
$('#close-dialog').addEventListener('click',()=>$('#stop-dialog').close());
$('#stop-dialog').addEventListener('click',e=>{if(e.target===$('#stop-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('.skip').addEventListener('click', event => {
  event.preventDefault();
  $('#main').focus();
});
function syncNavigation() {
  const url = new URL(location.href);
  const stop = url.searchParams.get('stop');
  const nextStop = staticLocations.has(stop) ? stop : chosen;
  const nextLead = Number(url.searchParams.get('lead') || lead) === 24 ? 24 : 10;
  const nextView = currentView();
  if (nextStop === chosen && nextLead === lead && nextView === view) return;
  chosen = nextStop; lead = nextLead; view = nextView;
  render();window.scrollTo({top:0,behavior:'instant'});
  $('#main').focus({preventScroll:true});
}
window.addEventListener('hashchange', syncNavigation);
window.addEventListener('popstate', syncNavigation);
function scheduleNextCheck() {
  clearTimeout(refreshTimer);
  if (document.hidden || loading) return;
  const now = Date.now();
  const interval = failed ? 120000 : CHECK_INTERVAL;
  let delay = Math.max(0, lastAttempt + interval - now);
  for (const forecast of Object.values(data?.horizons || {})) {
    const end = validDate(forecast?.endUtc);
    if (end && end.getTime() > now) delay = Math.min(delay, end.getTime() - now);
  }
  refreshTimer = setTimeout(load, delay);
}
async function load(force=false) {
  if(loading)return;
  clearTimeout(refreshTimer);loading=true;lastAttempt=Date.now();render();
  const gate=new AbortController();const timeout=setTimeout(()=>gate.abort(),75000);
  try {
    const res=await fetch('./forecast.json',{headers:{Accept:'application/json'},cache:'no-store',signal:gate.signal});
    if(!res.ok)throw Error('Forecast service unavailable');
    const next=await res.json();
    if(!Array.isArray(next.metadata?.locations)||!next.metadata.locations.length||!next.horizons)throw Error('Incomplete forecast');
    const nextChecked = validDate(next.lastCheckedUtc);
    const currentChecked = validDate(data?.lastCheckedUtc);
    if (!currentChecked || (nextChecked && nextChecked >= currentChecked)) {
      data=next;
      safeStore.set('ridecast.snapshot.v1',JSON.stringify(next));
    }
    failed=false;
    if(force)announce('Forecast check complete.');
  }catch{
    failed=true;
  }finally{clearTimeout(timeout);loading=false;render();scheduleNextCheck();}
}
$('#refresh').addEventListener('click',()=>load(true));
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){clearTimeout(refreshTimer);return;}
  if(!data || failed || Date.now()-lastAttempt>=CHECK_INTERVAL)load();
  else {render();scheduleNextCheck();}
});
window.addEventListener('online',()=>load());
try { const saved=JSON.parse(safeStore.get('ridecast.snapshot.v1') || 'null');if(Array.isArray(saved?.metadata?.locations)&&saved.horizons)data=saved; } catch {}
updateLocationUrl();
if (window.rideGuideUI) {
  window.rideGuideUI.load();
} else {
  $('#guide-status span').textContent = 'Ride details could not be loaded.';
  $('#guide-retry').hidden = false;
  $('#guide-retry').addEventListener('click', () => location.reload());
}
load();
