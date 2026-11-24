'use strict';

let rideGuide = null;
let rideGuideFailed = false;
let guideSort = 'km';
let renderedGuideStop = null;

function ridingTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return rest + ' min';
  return hours + ' hr' + (rest ? ' ' + rest + ' min' : '');
}

function shortRidingTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return (hours ? hours + 'h' : '') + (hours && rest ? ' ' : '') + (rest ? rest + 'm' : '');
}

function guideLink(source) {
  const link = document.createElement('a');
  link.href = source.url;
  link.className = 'guide-source-link';
  link.textContent = source.label;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.insertAdjacentHTML('beforeend', icon('external'));
  return link;
}

function drawComparison() {
  if (!rideGuide) return;
  const rows = [...rideGuide.destinations].sort((a, b) =>
    (guideSort === 'name' ? 0 : a[guideSort] - b[guideSort]) || a.name.localeCompare(b.name)
  );
  $('#guide-rows').innerHTML = rows.map(ride => {
    const selected = ride.id === chosen;
    return '<tr data-route="' + escapeHTML(ride.id) + '" class="' + (selected ? 'current-route' : '') + '">' +
      '<th scope="row"><button type="button" aria-pressed="' + selected + '" data-guide-pick="' +
      escapeHTML(ride.id) + '">' + escapeHTML(ride.name) + '</button><span class="comparison-fit">' + escapeHTML(ride.bestFor) + '</span></th>' +
      '<td>' + escapeHTML(ride.km) + ' km</td><td aria-label="' + escapeHTML(ridingTime(ride.minutes)) +
      '">' + escapeHTML(shortRidingTime(ride.minutes)) + '</td></tr>';
  }).join('');
}

function fillPlanning() {
  const group = $('#guide-planning');
  group.replaceChildren(...rideGuide.planning.map(item => {
    const panel = document.createElement('article');
    panel.className = 'guide-plan-card';
    const heading = document.createElement('h3');
    heading.textContent = item.title;
    const body = document.createElement('p');
    body.textContent = item.body;
    const links = document.createElement('div');
    links.className = 'guide-plan-links';
    links.append(...item.links.map(guideLink));
    panel.append(heading, body, links);
    return panel;
  }));
  const parsed = validDate(rideGuide.checkedOn);
  $('#guide-checked').textContent = parsed ? 'Guide checked ' + fmt(parsed, {day:'numeric', month:'short', year:'numeric'}) : '';
}

function renderRideGuide(place) {
  const ride = rideGuide?.destinations.find(route => route.id === place.id);
  $('#forecast-guide').hidden = !ride;
  $('#guide-content').hidden = !ride;
  $('#compare-shortcut').hidden = view !== 'guide' || !ride;
  $('#guide-status').hidden = Boolean(ride);
  $('#guide-status span').textContent = rideGuideFailed ? 'Ride details are unavailable.' : 'Loading ride details…';
  $('#guide-retry').hidden = !rideGuideFailed;
  if (!ride) return;
  for (const [element, hash] of [['forecast-guide-link', 'guide'], ['guide-forecast', 'forecast']]) {
    const url = new URL(location.href);
    url.searchParams.set('stop', place.id);
    url.searchParams.set('lead', String(lead));
    url.hash = hash;
    document.getElementById(element).href = url.pathname + url.search + url.hash;
  }
  if (renderedGuideStop === place.id) return;
  renderedGuideStop = place.id;
  $('#forecast-guide-name').textContent = 'Ride to ' + ride.name;
  $('#forecast-guide-metrics').textContent = ride.km + ' km · ' + ridingTime(ride.minutes) + ' one way from ' + rideGuide.origin.name + ' · excludes queues and stops';
  $('#guide-origin').textContent = 'From ' + rideGuide.origin.name;
  $('#guide-region').textContent = place.state + ' · Malaysia';
  $('#guide-title').textContent = ride.name;
  $('#guide-best').textContent = ride.bestFor;
  $('#guide-cover').classList.toggle('highlands', place.id === 'genting-highlands');
  $('#guide-km').textContent = ride.km + ' km';
  $('#guide-time').textContent = ridingTime(ride.minutes);
  const roundTrip = $('#guide-round-trip');
  roundTrip.hidden = !Number.isFinite(ride.roundTripKm) || !Number.isFinite(ride.roundTripMinutes);
  if (!roundTrip.hidden) roundTrip.textContent = 'Out and back via Woodlands · ' + ride.roundTripKm + ' km · ' + ridingTime(ride.roundTripMinutes) + ' riding';
  $('#guide-estimate-note').textContent = rideGuide.estimateNote;
  $('#compare-origin').textContent = 'One way from ' + rideGuide.origin.name + '.';
  for (const key of ['route', 'terrain', 'highlight', 'tradeoff', 'tip']) {
    $('#guide-' + key).textContent = ride[key];
  }
  $('#guide-directions').href = ride.directionsUrl;
  $('#guide-directions').target = '_blank';
  $('#guide-directions').rel = 'noopener noreferrer';
  $('#guide-highlight-map').replaceChildren(...(ride.highlightMap ? [guideLink(ride.highlightMap)] : []));
  $('#guide-sources').replaceChildren(...[rideGuide.routeSource, ...ride.sources].map(guideLink));
  drawComparison();
}

async function loadRideGuide() {
  rideGuideFailed = false;
  render();
  try {
    const response = await fetch('./ride-guide.json');
    if (!response.ok) throw Error('Unable to load ride details');
    const next = await response.json();
    if (!Array.isArray(next.destinations) || !next.destinations.length) throw Error('Missing destinations');
    rideGuide = next;
    renderedGuideStop = null;
    fillPlanning();
  } catch {
    rideGuideFailed = true;
  }
  render();
}

function focusGuideHeading(id) {
  const heading = document.getElementById(id);
  heading.focus({preventScroll:true});
  heading.scrollIntoView({block:'start', behavior:'instant'});
}

window.rideGuideUI = {render: renderRideGuide, load: loadRideGuide};

document.addEventListener('DOMContentLoaded', () => {
  $('#guide-sort').addEventListener('change', event => {
    guideSort = event.target.value;
    drawComparison();
    announce('Rides sorted by ' + event.target.selectedOptions[0].textContent.toLowerCase() + '.');
  });
  $('#guide-rows').addEventListener('click', event => {
    const row = event.target.closest('tr[data-route]');
    if (!row) return;
    selectSpot(row.dataset.route, false);
    focusGuideHeading('guide-title');
  });
  $('#compare-shortcut').addEventListener('click', () => focusGuideHeading('compare-title'));
  $('#guide-retry').addEventListener('click', loadRideGuide);
});
