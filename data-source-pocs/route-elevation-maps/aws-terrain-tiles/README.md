# AWS Terrain Tiles

Run:

```bash
python3 data-source-pocs/route-elevation-maps/aws-terrain-tiles/poc.py
```

Saved samples:

- `raw/sample-besseggen-ridge.png`
- `raw/sample-ben-nevis-summit.png`
- `normalized/sample-route-points.json`

The script fetches Terrarium PNG tiles from the public S3 URL and decodes sample-point elevation with only the Python standard library.
