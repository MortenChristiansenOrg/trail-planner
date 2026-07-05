#!/usr/bin/env bash
set -euo pipefail

: "${NAVITIA_API_KEY:?Set NAVITIA_API_KEY}"
: "${NAVITIA_COVERAGE:?Set NAVITIA_COVERAGE, for example a region coverage id}"

curl -sS -u "${NAVITIA_API_KEY}:" "https://api.navitia.io/v1/coverage/${NAVITIA_COVERAGE}/journeys"
