# Wikimedia Commons Media

POC for licensed visual-evidence metadata from Wikimedia Commons categories using the MediaWiki Action API.

Run:

```bash
python3 poc.py
```

Outputs:

- `raw/sample-besseggen.json`
- `raw/sample-trolltunga.json`
- `raw/sample-ben-nevis.json`
- `normalized/sample-*.json`

Verdict: `viable_with_limits`. Good source of candidate media metadata and attribution fields, but each file needs relevance and license review before display.
