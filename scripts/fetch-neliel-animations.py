#!/usr/bin/env python3
"""Vendor pinned redistributable VRMA assets for offline Android builds."""
import hashlib
import json
import struct
import urllib.request
from pathlib import Path

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'scripts/neliel-animations.json').read_text())
out = root / 'static/animations/neliel'
out.mkdir(parents=True, exist_ok=True)

def validate_glb(data):
    if len(data) < 20:
        raise ValueError('truncated GLB')
    magic, version, length = struct.unpack_from('<4sII', data)
    if magic != b'glTF' or version != 2 or length != len(data):
        raise ValueError('invalid GLB header')
    json_length, json_type = struct.unpack_from('<II', data, 12)
    if json_type != 0x4e4f534a or 20 + json_length > len(data):
        raise ValueError('invalid JSON chunk')
    obj = json.loads(data[20:20+json_length])
    bones = obj.get('extensions', {}).get('VRMC_vrm_animation', {}).get('humanoid', {}).get('humanBones', {})
    if 'hips' not in bones or not obj.get('animations'):
        raise ValueError('missing VRMA humanoid or animation')
    if not any(a.get('channels') for a in obj['animations']):
        raise ValueError('empty animation')
    # No external dependencies: every buffer and image must be embedded.
    if any('uri' in b for b in obj.get('buffers', []) + obj.get('images', [])):
        raise ValueError('unexpected external URI')

for asset in manifest:
    dest = out / (asset['id'] + '.vrma')
    url = 'https://raw.githubusercontent.com/{repo}/{rev}/{path}'.format(**asset)
    if dest.exists():
        data = dest.read_bytes()
    else:
        with urllib.request.urlopen(url, timeout=60) as response:
            data = response.read(asset['bytes'] + 1)
    if len(data) != asset['bytes']:
        raise ValueError('incorrect length: ' + asset['id'])
    git_hash = hashlib.sha1(('blob %d\0' % len(data)).encode() + data).hexdigest()
    if git_hash != asset['sha']:
        raise ValueError('incorrect Git blob hash: ' + asset['id'])
    validate_glb(data)
    dest.write_bytes(data)
    print('Verified', asset['id'], len(data), 'bytes')
print('All', len(manifest), 'VRMA clips verified.')
