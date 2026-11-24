# Ridecast

[Open the rain forecast](https://jowettc.github.io/ridecast/) · [Compare motorcycle rides from Woodlands](https://jowettc.github.io/ridecast/#guide)

Ridecast predicts rain or dry conditions for three-hour windows at nine Malaysian riding destinations. The dashboard shows each destination’s selected 10-hour and 24-hour models, issue time, rain F1, missed rain and false alarms. The riding guide includes independently routed outbound and return distances and moving times, places to stop and local riding considerations.

GitHub Actions requests new forecasts hourly at 17 minutes past the hour. An open dashboard checks the published snapshot every five minutes. A complete upstream outage leaves the last deployment in place, and the dashboard marks old data and clears expired calls. Run times depend on GitHub’s scheduler.

## Run locally

Using Node.js 22.13 or later, run `node scripts/update-forecast.mjs` to generate a current `site/forecast.json`. Use `python3 -m http.server --directory site 8000` to preview the dashboard. The generator reads public forecasts without an API key and does not require an npm install.

## Data

The forecast selects models per location and lead using October 2026 validation blocks. The performance tab reports the subsequent November 10–23 replay, including the reference source and sample count. Rain is at least 0.1 mm in the three-hour window. Forecast inputs come from [Open-Meteo](https://open-meteo.com/) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Routing uses Valhalla with [OpenStreetMap](https://www.openstreetmap.org/copyright). Venue and travel sources appear in each guide.
