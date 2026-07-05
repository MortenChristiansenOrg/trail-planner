#!/usr/bin/env bash
set -euo pipefail

case_name="bergen-to-odda"
date="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

mkdir -p raw normalized

curl -sS \
  -H "Content-Type: application/json" \
  -H "ET-Client-Name: trail-planner-poc" \
  --data-binary @- \
  "https://api.entur.io/journey-planner/v3/graphql" \
  > "raw/${case_name}.json" <<'JSON'
{
  "query": "{ trip(from: {coordinates: {latitude: 60.3913, longitude: 5.3221}}, to: {coordinates: {latitude: 60.0691, longitude: 6.5456}}, numTripPatterns: 3) { tripPatterns { duration legs { mode distance line { publicCode name transportMode } fromPlace { name latitude longitude } toPlace { name latitude longitude } aimedStartTime aimedEndTime } } } }"
}
JSON

jq --arg retrieved_at "$date" '{
  source: "entur_journey_planner",
  source_url: "https://developer.entur.org/pages-journeyplanner-journeyplanner/",
  retrieved_at: $retrieved_at,
  query: {
    from: "Bergen coordinates",
    to: "Odda coordinates",
    numTripPatterns: 3
  },
  trip_patterns: [.data.trip.tripPatterns[]? | {
    duration_seconds: .duration,
    legs: [.legs[]? | {
      mode,
      distance_m: .distance,
      line: .line,
      from: .fromPlace,
      to: .toPlace,
      aimed_start_time: .aimedStartTime,
      aimed_end_time: .aimedEndTime
    }]
  }],
  confidence: "live_query_sample"
}' "raw/${case_name}.json" > "normalized/${case_name}.json"

