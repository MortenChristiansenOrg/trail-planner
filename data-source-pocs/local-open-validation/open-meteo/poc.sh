#!/usr/bin/env bash
set -euo pipefail

case_name="besseggen-gjendesheim"
lat="61.494"
lon="8.811"
date="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

mkdir -p raw normalized

curl -sS "https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&hourly=temperature_2m,precipitation,wind_speed_10m&timezone=Europe%2FOslo&forecast_days=3" \
  -o "raw/${case_name}.json"

jq --arg retrieved_at "$date" --arg lat "$lat" --arg lon "$lon" '{
  source: "open-meteo",
  source_url: "https://open-meteo.com/en/docs",
  retrieved_at: $retrieved_at,
  query: {
    latitude: ($lat | tonumber),
    longitude: ($lon | tonumber),
    forecast_days: 3,
    timezone: "Europe/Oslo"
  },
  location: {
    latitude: .latitude,
    longitude: .longitude,
    elevation_m: .elevation,
    timezone: .timezone
  },
  daily: .daily,
  confidence: "forecast_sample"
}' "raw/${case_name}.json" > "normalized/${case_name}.json"

