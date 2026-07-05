# OSM POI Amenities

POC for public OpenStreetMap amenity/tourism/transit POIs near trail anchors using Overpass.

Run:

```bash
python3 poc.py
```

Outputs:

- `raw/sample-besseggen.json`
- `raw/sample-trolltunga.json`
- `raw/sample-ben-nevis-cmd.json`
- `normalized/sample-*.json`

Verdict: `viable_with_limits`. Useful for open amenity evidence, but production should filter by route corridor and use OSM extracts or owned infrastructure instead of relying on public Overpass.
