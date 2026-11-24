import { classicInputs, createWeatherContext, recentSource, iso } from './archive.js';
import { classicRisk, HOUR, logOddsMean, sites, shortRisk, vintageRisk, vintageRows, withNearby } from './scoring.js';

export { createWeatherContext };
export function nextWindow(time,lead) {
  // Local Malaysia-midnight is UTC 16:00. Reserve enough time to actually issue the forecast.
  const local=Number(new Date(time))+(8+lead)*HOUR;
  return (Math.floor(local/(3*HOUR))+1)*3*HOUR-8*HOUR;
}

export async function generateForecast(horizon, now=new Date(), options={}) {
  if (![10,24].includes(horizon)) throw Error('Unsupported forecast lead');
  const requested=Number(new Date(now));
  if (!Number.isFinite(requested)) throw Error('Invalid issue time');
  const clock=options.clock||Date.now;
  const asOf=Math.max(requested,clock());
  const start=nextWindow(asOf,horizon), deadline=start-horizon*HOUR;
  const cutoff=Math.floor(Math.min(asOf,deadline)/60000)*60000;
  const ctx=options.context||createWeatherContext(options);
  const issues=[],empty=()=>({recent:sites.map(()=>null),vintages:sites.map(()=>[])});
  async function safe(tag,fn,fallback){
    try{return await fn();}
    catch(err){issues.push(tag+': '+String(err.message||err).slice(0,160));return fallback;}
  }
  const [gfs,ifs,ukmo,day]=await Promise.all([
    ...['gfs','ifs','ukmo'].map(m=>safe(m,()=>recentSource(ctx,m,start,horizon,cutoff),empty())),
    horizon===24?safe('day-ahead',()=>classicInputs(ctx,start,Math.min(asOf,deadline)),null):null
  ]);
  const datasets={gfs,ifs,ukmo};
  const local=new Date(start+8*HOUR);
  const common={startUtc:iso(start),issue_utc:iso(deadline),window_start:String(local.getUTCHours()).padStart(2,'0')+':00'};
  const grouped=withNearby(sites.map((location,i)=>{
    const row={...common,location};
    for (const [m,batch] of Object.entries(datasets)) {
      const entry=batch.recent[i];
      if (!entry) continue;
      for (const [key,v] of Object.entries(entry.values)) row[m+'_'+key]=v;
      row[m+'_run_utc']=iso(entry.run);
    }
    return row;
  }));
  const vint=vintageRows({gfs:gfs.vintages,ifs:ifs.vintages},common);
  // All these fitted models use the other destinations as same-vintage inputs. Refuse a partial batch.
  const vetted=m=>datasets[m].recent.every(Boolean);
  const base=vetted('gfs')&&vetted('ifs'),uk=base&&vetted('ukmo');
  const hasVintage=[gfs,ifs].every(dataset=>dataset.vintages.every(seq=>seq.length>0));
  const locations=grouped.map((row,i)=>{
    const scores={
      deployed:horizon===10?(base?shortRisk(row,'deployed10'):null):(day?.rows[i]?classicRisk(day.rows[i]):null),
      ukmo:uk?shortRisk(row,'ukmo'+horizon):null,
      vintages:hasVintage?vintageRisk(vint[i],horizon):null
    };
    if (horizon===10) scores.airport=base?shortRisk(row,'airport10'):null;
    scores.combined=logOddsMean([scores.vintages,scores.ukmo,...(horizon===10?[scores.airport]:[])]);
    return {location:row.location,scores};
  });
  const unique=new Map();
  for (const ds of Object.values(datasets)) for(const value of [...ds.recent,...ds.vintages.flat()]) {
    if (value) unique.set(value.source+'|'+value.run,{source:value.source,runUtc:iso(value.run),publishedUtc:iso(value.published)});
  }
  if (day) for(const value of day.cycles) unique.set(value.source+'|'+value.run,{source:value.source,runUtc:iso(value.run),publishedUtc:iso(value.published)});
  const generated=clock();
  if (generated>deadline) {
    if (!options.retried) return generateForecast(horizon,new Date(generated),{...options,context:ctx,retried:true});
    throw Error('Weather collection exceeded this forecast deadline');
  }
  return {horizon,startUtc:iso(start),endUtc:iso(start+3*HOUR),generatedUtc:iso(generated),cutoffUtc:iso(cutoff),locations,
    sources:[...unique.values()],issues};
}
