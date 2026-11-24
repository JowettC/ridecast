import models from './weights.js';

export const places = {
  'Kuala Lumpur': [3.139, 101.687], 'Genting Highlands': [3.424, 101.793],
  'Kluang': [2.031, 103.317], 'Desaru': [1.549, 104.260],
  'Johor Bahru': [1.493, 103.741], 'Kota Tinggi': [1.738, 103.900],
  'Mersing': [2.431, 103.840], 'Port Dickson': [2.523, 101.796], 'Melaka': [2.190, 102.249]
};
export const sites = Object.keys(places);
export const HOUR = 3600000;
export const n = value => value == null || value === '' ? NaN : Number(value);
const finite = Number.isFinite;
const radians = v => v*Math.PI/180;
// Match Python's compensated float accumulation, including at trained tree split points.
export function sum(values) {
  let total=0,correction=0;
  for (const value of values) {
    const next=total+value;
    correction+=Math.abs(total)>=Math.abs(value)?(total-next)+value:(value-next)+total;
    total=next;
  }
  return total+correction;
}
const mean = vs => vs.length ? sum(vs)/vs.length : NaN;
const distances = {};
const weights = {};
for (const p of sites) {
  distances[p] = {}; weights[p] = {};
  const [lat,lon] = places[p];
  for (const q of sites) {
    const [y,x] = places[q];
    const d = Math.sin(radians(y-lat)/2)**2 + Math.cos(radians(y))*Math.cos(radians(lat))*Math.sin(radians(x-lon)/2)**2;
    weights[p][q] = Math.exp(-12742*Math.asin(Math.sqrt(Math.min(1,d)))/60);
    distances[p][q] = Math.hypot(111*(lat-y),111*Math.cos(radians((lat+y)/2))*(lon-x));
  }
}

function siteSlotFeatures(place, slot) {
  return [
    ...sites.map(p=>Number(p===place)),
    ...Array.from({length:8},(_,i)=>Number(i===slot)),
    ...sites.flatMap(p=>Array.from({length:8},(_,i)=>Number(p===place && i===slot)))
  ];
}

function dot(xs,model) {
  if (model.coef.length !== xs.length) throw Error('Forecast feature count differs from fitted model');
  return model.intercept + sum(xs.map((x,i)=>x*model.coef[i]));
}

function treeScore(xs,model) {
  let value = model.base;
  for (const tree of model.trees) {
    let node = tree[0];
    while (!node[0]) node=tree[xs[node[2]] <= node[3] ? node[4] : node[5]];
    value+=node[1];
  }
  return value;
}

function logistic(v){ return 1/(1+Math.exp(-Math.max(-50,Math.min(50,v)))); }

export function logOddsMean(ps) {
  if (ps.some(p=>!finite(p))) return null;
  const logit = val=> {const p=Math.max(1e-10,Math.min(1-1e-10,val));return Math.log(p/(1-p));};
  return logistic(mean(ps.map(logit)));
}

export function withNearby(rows) {
  return rows.map(r=>{
    const out={...r};
    for (const m of ['gfs','ifs','ukmo']) {
      let total=0,weight=0;
      for (const q of rows) if (q.location!==r.location && finite(n(q[m+'_precip_mm']))) {
        const w=weights[r.location][q.location];
        total+=w*n(q[m+'_precip_mm']);weight+=w;
      }
      out[m+'_nearby']=weight?total/weight:NaN;
    }
    return out;
  });
}

export function shortRisk(row, modelKey) {
  const fitted=models[modelKey];
  const xs=[], amounts=[];
  for (const m of ['gfs','ifs']) {
    const get=k=>n(row[m+'_'+k]);
    const p=get('precip_mm');
    if (!finite(p)) { xs.push(...Array(12).fill(NaN),1);continue; }
    const rh=get('rh_pct');
    amounts.push(p);
    xs.push(Math.log1p(p),Math.min(.25,p),Math.min(2,p),Math.log1p(get('peak_mm')),
      Math.log1p(get('prev_mm')),Math.log1p(get('next_mm')),Math.log1p(get('nearby')),
      get('temp_c'),rh,get('cloud_pct'),Math.max(0,rh-80),
      (Date.parse(row.issue_utc)-Date.parse(row[m+'_run_utc']))/HOUR,0);
  }
  if (!amounts.length) return null;
  xs.push(Math.log1p(Math.min(...amounts)),Math.log1p(Math.max(...amounts)),Math.log1p(mean(amounts)),mean(amounts.map(x=>Number(x>=.1))));
  xs.push(...siteSlotFeatures(row.location,Number(row.window_start.slice(0,2))/3));
  if (modelKey.startsWith('ukmo')) {
    const get=k=>n(row['ukmo_'+k]);
    const p=get('precip_mm');
    if (finite(p)) {
      amounts.push(p);
      xs.push(Math.log1p(p),Math.min(.25,p),Math.min(2,p),Math.log1p(get('peak_mm')),
        Math.log1p(get('prev_mm')),Math.log1p(get('next_mm')),Math.log1p(get('nearby')),get('rh_pct'),get('temp_c'),
        get('cloud_pct'),Math.log1p(mean(amounts)),Math.log1p(Math.min(...amounts)),mean(amounts.map(x=>Number(x>=.1))),0);
    } else xs.push(...Array(13).fill(NaN),1);
  }
  const filled=xs.map((v,i)=>finite(v)?v:fitted.fill[i]);
  const lin=dot(filled,fitted);
  return logistic(fitted.method==='blend'?(lin+treeScore(filled,fitted))/2:lin);
}

export function vintageRows(buckets, common) {
  const rain=['precip_mm','prev_mm','next_mm','peak_mm'];
  const state=['rh_pct','temp_c','cloud_pct'];
  const valid=Date.parse(common.startUtc);
  return sites.map((location,i)=>{
    const out={...common,location};
    for (const m of ['gfs','ifs']) {
      const all=buckets[m], seq=all[i];
      out[m+'_cycles']=seq.length;
      for (let j=0;j<3;j++) {
        const entry=seq[j];
        for (const k of [...rain,...state]) {
          const v=n(entry?.values[k]);
          out[m+j+'_'+k]=rain.includes(k)?Math.log1p(v):v;
        }
        out[m+j+'_lead']=entry?(valid-entry.run)/HOUR:NaN;
      }
      for (const k of [...rain,'rh_pct','temp_c']) {
        const vs=Array.from({length:3},(_,j)=>out[m+j+'_'+k]);
        if (rain.includes(k)) out[m+'_mean_'+k]=mean(vs.filter(finite));
        out[m+'_change_'+k]=vs[0]-mean(vs.slice(1).filter(finite));
      }
      for (const radius of [90,220]) {
        const ns=all.flatMap((other,j)=>j!==i && distances[location][sites[j]]<=radius && other[0]?[other[0].values.precip_mm]:[]);
        out[m+'0_neighbors'+radius]=mean(ns.map(Math.log1p));
        out[m+'0_neighbors_wet'+radius]=mean(ns.map(v=>Number(v>=.1)));
      }
    }
    return out;
  });
}

export function vintageRisk(row,h) {
  if (!(Number(row.gfs_cycles)||Number(row.ifs_cycles))) return null;
  const model=models['vintages'+h];
  const slot=Number(row.window_start.slice(0,2))/3;
  const satellite=Number(['Desaru','Genting Highlands'].includes(row.location)),daytime=Number([4,5,6].includes(slot));
  const xs=model.columns.map(k=>n(row[k]));
  xs.push(...siteSlotFeatures(row.location,slot), satellite,satellite*daytime);
  for (const m of ['gfs','ifs']) {
    const rain=n(row[m+'0_precip_mm']);
    xs.push(Math.min(rain,.1),Math.min(rain,.7),rain*daytime,rain*satellite,Math.max(0,n(row[m+'0_rh_pct'])-80));
  }
  const filled=xs.map((v,i)=>finite(v)?v:model.fill[i]);
  const lin=dot(filled.map((v,i)=>(v-model.mu[i])/model.scale[i]),model);
  return logistic((lin+treeScore(filled,model))/2);
}

export function classicRisk(row) {
  const model=models.deployed24,xs=[], amounts=[];
  for (const key of ['gfs_forecast_precip_mm','ifs_forecast_precip_mm','dwd_forecast_precip_mm','hgefs_precip_mm']) {
    const p=n(row[key]);
    xs.push(Math.log1p(p),Math.min(p,.3),Number(!finite(p)));
    if (finite(p)) amounts.push(p);
  }
  if (!amounts.length) return null;
  const sorted=[...amounts].sort((a,b)=>a-b),mid=(sorted.length-1)/2;
  const median=(sorted[Math.floor(mid)]+sorted[Math.ceil(mid)])/2;
  xs.push(mean(amounts.map(x=>Number(x>=.1))),Math.log1p(median),Math.log1p(Math.max(...amounts)),Math.log1p(Math.min(...amounts)),mean(amounts.map(x=>Number(x>=1))));
  for (const m of ['gfs','ifs','dwd']) for (const v of ['temp_c','rh_pct','cloud_pct','wind_kmh']) {
    if (m!=='dwd' || v!=='wind_kmh') xs.push(n(row[m+'_forecast_'+v]));
  }
  xs.push(Math.log1p(n(row.dwd_icon_cape_max_jkg)),n(row.dwd_icon_wind_u_kmh),n(row.dwd_icon_wind_v_kmh),
    Math.log1p(n(row.dwd_icon_peak_hour_rain_mm)),Math.log1p(n(row.hgefs_mean_hourly_spread_mm)));
  xs.push(...siteSlotFeatures(row.location,Number(row.window_start.slice(0,2))/3));
  const filled=xs.map((v,i)=>finite(v)?v:model.med[i]);
  return logistic((dot(filled,model)+treeScore(filled,model))/2);
}
