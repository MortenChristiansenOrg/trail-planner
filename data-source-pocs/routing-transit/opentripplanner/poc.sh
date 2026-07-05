#!/usr/bin/env bash
set -euo pipefail

cat <<'MSG'
OpenTripPlanner requires local OSM plus GTFS/NeTEx inputs before it can answer trips.

Minimal Norway POC shape:
1. Download a Norway OSM extract.
2. Download Entur NeTEx/GTFS-compatible public transport data where terms allow.
3. Build an OTP graph with the input directory as the base directory.
4. Compare OTP trips against saved Entur Journey Planner samples.

This folder records the self-hosted follow-up, not a live hosted API sample.
MSG
