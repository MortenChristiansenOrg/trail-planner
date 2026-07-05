#!/usr/bin/env bash
set -euo pipefail

cat <<'MSG'
Valhalla is self-hosted for this evaluation. No public hosted endpoint is assumed.

Minimal production-like POC shape:
1. Download a small OSM extract, for example Denmark or a Norway region.
2. Build Valhalla tiles with valhalla_build_config and valhalla_build_tiles.
3. Run valhalla_service locally.
4. POST route requests to http://localhost:8002/route.

See analysis.md for the blocked/self-host verdict.
MSG
