#!/usr/bin/env python3
import json
import math
import struct
import urllib.request
import zlib
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "raw"
NORMALIZED = ROOT / "normalized"
TERMS_URL = "https://github.com/tilezen/joerd/blob/master/docs/attribution.md"
DOCS_URL = "https://registry.opendata.aws/terrain-tiles/"

SAMPLES = [
    {"id": "besseggen-ridge", "case": "besseggen", "name": "Besseggen ridge sample", "lat": 61.5076, "lon": 8.7556, "zoom": 12},
    {"id": "ben-nevis-summit", "case": "ben-nevis-cmd", "name": "Ben Nevis summit", "lat": 56.7969, "lon": -5.0036, "zoom": 12},
]


def lonlat_to_tile(lon, lat, z):
    lat_rad = math.radians(lat)
    n = 2**z
    x = int((lon + 180.0) / 360.0 * n)
    y = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    px = int((((lon + 180.0) / 360.0 * n) - x) * 256)
    py = int((((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n) - y) * 256)
    return x, y, px, py


def read_png_rgb(path):
    data = path.read_bytes()
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError("not a PNG")
    pos = 8
    width = height = color_type = bit_depth = None
    compressed = b""
    while pos < len(data):
        length = struct.unpack(">I", data[pos:pos + 4])[0]
        chunk_type = data[pos + 4:pos + 8]
        chunk = data[pos + 8:pos + 8 + length]
        pos += 12 + length
        if chunk_type == b"IHDR":
            width, height, bit_depth, color_type = struct.unpack(">IIBB", chunk[:10])
        elif chunk_type == b"IDAT":
            compressed += chunk
        elif chunk_type == b"IEND":
            break
    if bit_depth != 8 or color_type not in (2, 6):
        raise ValueError(f"unsupported PNG format bit_depth={bit_depth} color_type={color_type}")
    channels = 3 if color_type == 2 else 4
    stride = width * channels
    raw = zlib.decompress(compressed)
    rows = []
    prior = bytearray(stride)
    i = 0
    for _ in range(height):
        filter_type = raw[i]
        i += 1
        row = bytearray(raw[i:i + stride])
        i += stride
        for j in range(stride):
            left = row[j - channels] if j >= channels else 0
            up = prior[j]
            up_left = prior[j - channels] if j >= channels else 0
            if filter_type == 1:
                row[j] = (row[j] + left) & 0xff
            elif filter_type == 2:
                row[j] = (row[j] + up) & 0xff
            elif filter_type == 3:
                row[j] = (row[j] + ((left + up) // 2)) & 0xff
            elif filter_type == 4:
                p = left + up - up_left
                pa, pb, pc = abs(p - left), abs(p - up), abs(p - up_left)
                predictor = left if pa <= pb and pa <= pc else up if pb <= pc else up_left
                row[j] = (row[j] + predictor) & 0xff
            elif filter_type != 0:
                raise ValueError(f"unsupported PNG filter {filter_type}")
        rows.append(bytes(row))
        prior = row
    return width, height, channels, rows


def terrarium_elevation_m(rgb):
    r, g, b = rgb
    return (r * 256 + g + b / 256) - 32768


def main():
    RAW.mkdir(exist_ok=True)
    NORMALIZED.mkdir(exist_ok=True)
    retrieved_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    outputs = []
    for sample in SAMPLES:
        x, y, px, py = lonlat_to_tile(sample["lon"], sample["lat"], sample["zoom"])
        url = f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{sample['zoom']}/{x}/{y}.png"
        raw_path = RAW / f"sample-{sample['id']}.png"
        request = urllib.request.Request(url, headers={"User-Agent": "trail-planner-data-source-poc/0.1"})
        with urllib.request.urlopen(request, timeout=60) as response:
            raw_path.write_bytes(response.read())
        width, height, channels, rows = read_png_rgb(raw_path)
        offset = px * channels
        rgb = rows[py][offset:offset + 3]
        outputs.append({
            **sample,
            "tile": {"z": sample["zoom"], "x": x, "y": y, "pixel_x": px, "pixel_y": py, "url": url},
            "elevation_m": round(terrarium_elevation_m(rgb), 2),
            "raw_sample": f"raw/{raw_path.name}",
            "tile_size": [width, height],
        })

    normalized = {
        "id": "route-point-elevation-aws-terrain-tiles",
        "source": "aws_terrain_tiles_terrarium",
        "retrieved_at": retrieved_at,
        "query": {"docs": DOCS_URL, "samples": [{"lat": s["lat"], "lon": s["lon"], "zoom": s["zoom"]} for s in SAMPLES]},
        "license_or_terms_url": TERMS_URL,
        "freshness": "static_tile_dataset_updated_from_community_feedback",
        "confidence": "sample",
        "elevation_samples": outputs,
    }
    (NORMALIZED / "sample-route-points.json").write_text(json.dumps(normalized, indent=2, sort_keys=True) + "\n")
    print(json.dumps(outputs, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
