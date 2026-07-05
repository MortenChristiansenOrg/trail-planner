#!/usr/bin/env bash
set -euo pipefail

: "${REJSEPLANEN_BASE_URL:?Set REJSEPLANEN_BASE_URL from Labs account documentation}"

echo "Rejseplanen Labs endpoint configured: ${REJSEPLANEN_BASE_URL}"
echo "Add the account-specific query once Labs access is approved."
