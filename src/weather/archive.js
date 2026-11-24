import {places,sites,HOUR,sum} from './scoring.js';

const CORE=['precipitation','temperature_2m','relative_humidity_2m','cloud_cover'];
const SPECS = {
  gfs:{model:'gfs_global',domain:'ncep_gfs013',fields:[...CORE,'wind_speed_10m']},
  ifs:{model:'ecmwf_ifs',domain:'ecmwf_ifs',fields:[...CORE,'wind_speed_10m']},
  ukmo:{model:'ukmo_global_deterministic_10km',domain:'ukmo_global_deterministic_10km',fields:CORE},
  icon:{model:'dwd_icon_global',domain:'dwd_icon',fields:[...CORE,'wind_speed_10m','cape','wind_direction_10m']},
  ens:{model:'ncep_hgefs025_ensemble_mean',domain:'ncep_hgefs025_ensemble_mean',fields:['precipitation','precipitation_spread']}
};
const UNITS={precipitation:'mm',temperature_2m:'°C',relative_humidity_2m:'%',cloud_cover:'%',
  wind_speed_10m:'km/h',cape:'J/kg',wind_direction_10m:'°',precipitation_spread:'mm'};
export const iso=t=>new Date(t).toISOString();
const stamp=t=>iso(t).slice(0,16);

function spec(source,run) {
  if (source==='icon' && run>=Date.UTC(2026,11,1)) return {...SPECS.icon,model:'dwd_icon_global_native',domain:'dwd_icon_global_native'};
  return SPECS[source];
}

// Use one context per refresh. Both horizons share any common upstream requests.
export function createWeatherContext({fetchImpl=fetch}={}) {
  const memo=new Map(),waiting=[];
  let active=0;
  async function limit(fn) {
    if (active>=3) await new Promise(resolve=>waiting.push(resolve));
    else active++;
    try{return await fn();}
    finally { if (waiting.length) waiting.shift()(); else active--; }
  }
  function load(url,fn) {
    if (!memo.has(url)) memo.set(url,limit(fn));
    return memo.get(url);
  }
  async function get(url,kind,source){
    return load(url,async()=>{
      const res=await fetchImpl(url,{signal:AbortSignal.timeout(12000)});
      if (kind==='manifest' && res.status===404) return null;
      if (kind==='data' && res.status===400) {
        const detail=await res.text();
        if (/not available|cannot find/i.test(detail)) return null;
      }
      if (!res.ok) throw Error(source+' '+kind+' returned HTTP '+res.status);
      return {json:await res.json(),modified:res.headers.get('Last-Modified')};
    });
  }
  async function released(source,run,cutoff) {
    const cfg=spec(source,run);
    const folder=iso(run).slice(0,10).replaceAll('-','/')+'/'+iso(run).slice(11,13)+'00Z';
    const manifest='https://openmeteo.s3.amazonaws.com/data_run/'+cfg.domain+'/'+folder+'/meta.json';
    const response=await get(manifest,'manifest',source);
    if (!response) return null;
    const m=response.json,created=Date.parse(m.created_at),modified=Date.parse(response.modified);
    if (Date.parse(m.reference_time)!==run || !Number.isFinite(created) || !Number.isFinite(modified) || Math.min(created,modified)<run)
      throw Error('Invalid publication evidence for '+source);
    const published=Math.max(created,modified);
    if (published>cutoff) return null;
    if (source==='icon') {
      const required=['precipitation','temperature_2m','relative_humidity_2m','cloud_cover','wind_u_component_10m','wind_v_component_10m','cape'];
      const times=new Set((m.valid_times||[]).map(s=>Date.parse(s)));
      if (m.temporal_resolution_seconds!==3600 || !required.every(field=>m.variables?.includes(field))
        || !Array.from({length:25},(_,i)=>run+(34+i)*HOUR).every(t=>times.has(t))) return null;
    }
    if (source==='ens' && (m.temporal_resolution_seconds!==21600 || !cfg.fields.every(field=>m.variables?.includes(field)))) return null;
    return {source,run,published};
  }
  async function fixedRun(source,run) {
    const cfg=spec(source,run);
    const hours=source==='ukmo'?48:source==='ens'?66:source==='icon'?64:80;
    const query=new URLSearchParams({latitude:sites.map(site=>places[site][0]).join(','),
      longitude:sites.map(site=>places[site][1]).join(','),hourly:cfg.fields.join(','),
      timezone:'GMT',models:cfg.model,run:stamp(run),forecast_hours:String(hours)});
    const response=await get('https://single-runs-api.open-meteo.com/v1/forecast?'+query,'data',source);
    if (!response) return null;
    const data=response.json;
    if (!Array.isArray(data) || data.length!==sites.length) throw Error('Unexpected number of forecast grid points for '+source);
    for (let i=0;i<sites.length;i++) {
      const point=data[i],h=point.hourly,[lat,lon]=places[sites[i]];
      if ((point.location_id??0)!==i || point.utc_offset_seconds!==0 || Math.abs(point.latitude-lat)>.4 || Math.abs(point.longitude-lon)>.4
        || !h?.time?.length || h.time.some((s,j)=>s!==stamp(run+j*HOUR))
        || cfg.fields.some(field=>point.hourly_units[field]!==UNITS[field] || h[field]?.length!==h.time.length))
        throw Error('Invalid forecast fields, units or timestamps for '+source);
    }
    return data;
  }
  return {released,fixedRun};
}

export function sequence(cutoff) {
  const last=Math.floor(cutoff/(6*HOUR))*6*HOUR;
  return Array.from({length:7},(_,i)=>last-i*6*HOUR).filter(t=>cutoff-t>=2*HOUR);
}

const round=(x,precision=6)=>Number(x.toFixed(precision));
const valid=values=>values.length===3 && values.every(Number.isFinite);
function three(h,k,from,limit) {
  const vals=h[k]?.slice(from,Math.min(from+3,limit))??[];
  return valid(vals)?vals:[];
}

function retrieveWindow(hourly,lead,limit,raw) {
  if (lead<3 || lead+3>=limit || (!raw && lead+6>=limit)) return null;
  const rain=three(hourly,'precipitation',lead+1,limit);
  if (!rain.length) return null;
  function amount(key,from,div=1) {
    const seq=three(hourly,key,from,limit);
    if (!seq.length) return NaN;
    return raw?sum(seq)/div:round(round(sum(seq))/div);
  }
  return {precip_mm:amount('precipitation',lead+1),peak_mm:Math.max(...rain),prev_mm:amount('precipitation',lead-2),
    next_mm:amount('precipitation',lead+4),temp_c:amount('temperature_2m',lead+1,3),
    rh_pct:amount('relative_humidity_2m',lead+1,3),cloud_pct:amount('cloud_cover',lead+1,3)};
}

export async function recentSource(ctx,source,start,horizon,cutoff){
  const recent=sites.map(()=>null), vintages=sites.map(()=>[]);
  // The 10h vintage nominee only uses its first qualifying cycle. The 24h nominee uses up to three.
  const count=source==='ukmo'?0:horizon===10?1:3;
  for (const run of sequence(cutoff)) {
    const lead=(start-run)/HOUR;
    // The live Python models retrieve the first 48 hours of every operational cycle.
    const archivedHours=48, recentLimit=48;
    const wantsRecent=lead+6<recentLimit && recent.some(r=>!r);
    const wantsVintage=count>0 && lead+3<archivedHours && vintages.some(seq=>seq.length<count);
    if (!wantsRecent && !wantsVintage) continue;
    const manifest=await ctx.released(source,run,cutoff);
    if (!manifest) continue;
    const points=await ctx.fixedRun(source,run);
    if (!points) continue;
    for (let i=0;i<sites.length;i++) {
      const hourly=points[i].hourly;
      if (wantsRecent && !recent[i]) {
        const values=retrieveWindow(hourly,lead,Math.min(recentLimit,hourly.time.length),false);
        if (values) recent[i]={...manifest,values};
      }
      if (wantsVintage && vintages[i].length<count) {
        const values=retrieveWindow(hourly,lead,Math.min(archivedHours,hourly.time.length),true);
        if (values) vintages[i].push({...manifest,values});
      }
    }
    if (recent.every(Boolean) && vintages.every(seq=>seq.length>=count)) break;
  }
  return {recent,vintages};
}

function dailyAmounts(h,lead) {
  const out={};
  for (const [field,key,div] of [['precipitation','precip_mm',1],['temperature_2m','temp_c',3],
    ['relative_humidity_2m','rh_pct',3],['cloud_cover','cloud_pct',3],['wind_speed_10m','wind_kmh',3]]) {
    const a=three(h,field,lead+1,h.time.length);
    out[key]=a.length?round(sum(a)/div):NaN;
  }
  return out;
}

export async function classicInputs(ctx,start,asOf) {
  const local=new Date(start+8*HOUR);
  const daysBack=local.getUTCHours()<6?3:2;
  const origin=Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate()-daysBack,12);
  const issue=origin+10*HOUR;
  if (issue>asOf) return null;
  async function payload(source,run) {
    const m=await ctx.released(source,run,issue);
    if (!m) return null;
    const points=await ctx.fixedRun(source,run);
    return points?{...m,points}:null;
  }
  async function primaryBase(source) {
    const m=await ctx.released(source,origin,issue);
    const points=await ctx.fixedRun(source,origin);
    // The fitted baseline allows an earlier initialization only when its primary
    // archive is absent. A present but late/unverified primary must stay unavailable.
    if (points && !m) return {unverified:true};
    return points?{...m,points}:null;
  }
  const [gfs,ifs,icon,ens]=await Promise.all([primaryBase('gfs'),primaryBase('ifs'),payload('icon',origin),payload('ens',origin)]);
  if (gfs?.unverified || ifs?.unverified) return null;
  const base={gfs,ifs};
  if (!gfs && !ifs) return null;
  for (const source of ['gfs','ifs']) if (!base[source]) {
    for (const back of [6,12]) {
      base[source]=await payload(source,origin-back*HOUR);
      if (base[source]) break;
    }
  }
  if (!base.gfs || !base.ifs) return null;
  const rows=sites.map((location,i)=>{
    let row={location,window_start:String(local.getUTCHours()).padStart(2,'0')+':00'};
    for (const source of ['gfs','ifs']) {
      const doc=base[source];
      const values=dailyAmounts(doc.points[i].hourly,(start-doc.run)/HOUR);
      if (!Object.values(values).every(Number.isFinite)) return null;
      for (const [k,v] of Object.entries(values)) row[source+'_forecast_'+k]=v;
    }
    const lead=(start-origin)/HOUR;
    if (icon) {
      const hh=icon.points[i].hourly, values=dailyAmounts(hh,lead);
      for (const [k,v] of Object.entries(values)) row['dwd_forecast_'+k]=v;
      const cap=three(hh,'cape',lead+1,hh.time.length),rain=three(hh,'precipitation',lead+1,hh.time.length);
      row.dwd_icon_cape_max_jkg=cap.length?round(Math.max(...cap),4):NaN;
      row.dwd_icon_peak_hour_rain_mm=rain.length?round(Math.max(...rain),4):NaN;
      const wind=three(hh,'wind_speed_10m',lead+1,hh.time.length), dir=three(hh,'wind_direction_10m',lead+1,hh.time.length);
      if (wind.length && dir.length) {
        for(const [name,trig] of [['u',Math.sin],['v',Math.cos]]) {
          const components=wind.map((v,j)=>round(-v*trig(dir[j]*Math.PI/180),4));
          row['dwd_icon_wind_'+name+'_kmh']=round(sum(components)/3,4);
        }
      }
    }
    if (ens) {
      const hh=ens.points[i].hourly,p=three(hh,'precipitation',lead+1,hh.time.length),spread=three(hh,'precipitation_spread',lead+1,hh.time.length);
      row.hgefs_precip_mm=p.length?round(sum(p)):NaN;
      row.hgefs_mean_hourly_spread_mm=spread.length?round(sum(spread)/3):NaN;
    }
    return row;
  });
  return {rows,cycles:[base.gfs,base.ifs,icon,ens].filter(Boolean).map(({source,run,published})=>({source,run,published}))};
}
