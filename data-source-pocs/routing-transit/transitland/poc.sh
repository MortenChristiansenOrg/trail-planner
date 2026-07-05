#!/usr/bin/env bash
set -euo pipefail

: "${TRANSITLAND_API_KEY:?Set TRANSITLAND_API_KEY}"

curl -sS "https://www.transit.land/api/v2/rest/feeds?apikey=${TRANSITLAND_API_KEY}&country=NO&limit=5"
