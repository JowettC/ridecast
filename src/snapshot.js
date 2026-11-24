import metadata from './data/locations.json' with {type: 'json'};
import {nextWindow} from './weather/index.js';
import {HOUR} from './weather/scoring.js';

export const leads = [10, 24];

function validIssue(timestamp, deadline, now) {
  const time = Date.parse(timestamp);
  return Number.isFinite(time) && time <= now && time <= deadline;
}

function matchesWindow(batch, start, deadline, now) {
  return batch && Date.parse(batch.startUtc) === start &&
    Date.parse(batch.endUtc) === start + 3 * HOUR &&
    validIssue(batch.generatedUtc, deadline, now) && Array.isArray(batch.locations);
}

function validScore(score) {
  return Number.isFinite(score) && score >= 0 && score <= 1;
}

function forHorizon(lead, batch, previous, now) {
  const start = nextWindow(now, lead);
  const deadline = start - lead * HOUR;
  const current = matchesWindow(batch, start, deadline, now) ? batch : null;
  const prior = matchesWindow(previous, start, deadline, now) ? previous : null;
  if (!current && !prior) return {fresh: 0, window: null};

  const scores = new Map(current?.locations.map(row => [row.location, row.scores]) || []);
  const saved = new Map(prior?.locations.map(row => [row.id, row]) || []);
  let fresh = 0;
  const locations = metadata.locations.map(location => {
    const {model, threshold} = location.horizons[lead];
    const value = scores.get(location.name)?.[model];
    const priorItem = saved.get(location.id);
    let score = null;
    let generatedUtc = current?.generatedUtc || prior?.generatedUtc;
    let stale = false;
    if (validScore(value)) {
      score = value;
      fresh++;
    } else if (priorItem?.model === model && validScore(priorItem.score) &&
        validIssue(priorItem.generatedUtc, deadline, now)) {
      score = priorItem.score;
      generatedUtc = priorItem.generatedUtc;
      stale = true;
    }
    const call = score === null ? 'unavailable' : score >= threshold ? 'rain' : 'dry';
    return {id: location.id, model, score, call, generatedUtc, stale};
  });
  if (!locations.some(item => item.call !== 'unavailable')) return {fresh: 0, window: null};
  const generatedUtc = fresh ? current.generatedUtc : prior.generatedUtc;
  return {
    fresh,
    window: {
      startUtc: new Date(start).toISOString(), endUtc: new Date(start + 3 * HOUR).toISOString(),
      generatedUtc, stale: !fresh, locations
    }
  };
}

// A previous score can be reused only at the same lead, model and valid window.
export function makeSnapshot(batches, previous, now = Date.now()) {
  const horizons = {};
  const counts = {};
  for (const lead of leads) {
    const {fresh, window} = forHorizon(lead, batches[lead], previous?.horizons?.[lead], now);
    horizons[lead] = window;
    counts[lead] = fresh;
  }
  if (!Object.values(counts).some(Boolean)) {
    throw new Error('No new rain calls from the published Open-Meteo runs. Keeping the previous deployment.');
  }
  const complete = leads.every(lead => counts[lead] === metadata.locations.length);
  const snapshot = {
    timezone: 'Asia/Kuala_Lumpur',
    lastCheckedUtc: new Date(now).toISOString(),
    refreshState: complete ? 'current' : 'partial',
    metadata, horizons
  };
  return {snapshot, counts};
}
