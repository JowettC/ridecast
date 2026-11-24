import {randomUUID} from 'node:crypto';
import {readFile, rename, rm, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {leads, makeSnapshot} from '../src/snapshot.js';
import {createWeatherContext, generateForecast} from '../src/weather/index.js';

const target = fileURLToPath(new URL('../site/forecast.json', import.meta.url));

async function readPrevious(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    if (!(error instanceof SyntaxError)) throw error;
    console.warn('Skipping the previous forecast file because it contains invalid JSON.');
    return null;
  }
}

async function update() {
  const {values} = parseArgs({options: {previous: {type: 'string'}}});
  const previous = await readPrevious(values.previous || target);
  const context = createWeatherContext();
  const now = new Date();
  const results = await Promise.allSettled(leads.map(lead => generateForecast(lead, now, {context})));
  const batches = {};
  for (const [index, result] of results.entries()) {
    const lead = leads[index];
    if (result.status === 'rejected') {
      console.warn(lead + 'h weather collection failed:', result.reason?.message || result.reason);
      continue;
    }
    batches[lead] = result.value;
    for (const issue of result.value.issues) console.warn(lead + 'h upstream:', issue);
  }
  const {snapshot, counts} = makeSnapshot(batches, previous);
  const temporary = target + '.' + randomUUID() + '.tmp';
  try {
    await writeFile(temporary, JSON.stringify(snapshot) + '\n', {flag: 'wx'});
    await rename(temporary, target);
  } finally {
    await rm(temporary, {force: true});
  }
  for (const lead of leads) {
    const window = snapshot.horizons[lead];
    console.log(lead + 'h:', counts[lead] + '/' + snapshot.metadata.locations.length + ' fresh calls;',
      window ? window.startUtc + ' to ' + window.endUtc : 'upcoming window unavailable');
  }
}

update().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
