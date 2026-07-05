# OpenStreetMap Overpass

Run:

```bash
python3 data-source-pocs/route-elevation-maps/overpass/poc.py
```

Saved samples:

- `raw/sample-besseggen.json`
- `raw/sample-trolltunga.json`
- `raw/sample-ben-nevis-cmd.json`
- `normalized/sample-besseggen.json`
- `normalized/sample-trolltunga.json`
- `normalized/sample-ben-nevis-cmd.json`

The script queries hiking route relations, path-like ways, selected trail amenities, huts/campsites, and public transport nodes inside small route-area bounding boxes.
