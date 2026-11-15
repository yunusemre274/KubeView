"""Archive the completed synthetic family's exact JSON bytes, once."""
from pathlib import Path
import gzip
import hashlib
import json

directory = Path(__file__).resolve().parent
root = directory.parents[3]
index_path = directory / 'RAW_INDEX.json'
if index_path.exists():
    raise SystemExit('Existing archive index; no overwrite')
execution = json.loads((directory / 'execution.json').read_text())
if execution['status'] != 'PASS_RUNS_COMPLETED_RAW_VALIDITY_REVIEW_PENDING' or len(execution['jobs']) != 10:
    raise SystemExit('Require all ten completed jobs')
files = []
for job in execution['jobs']:
    source = root / 'benchmarks/results' / job['id']
    selected = sorted(source.glob('*.json'))
    expected = {'summary.json', 'process-samples.json', 'manifest.json'} | {
        f'M-{scenario}-{job["pair"]}-raw.json'
        for scenario in ['panel-closed', 'panel-open', 'panel-closed-events', 'panel-open-events']
    }
    if {p.name for p in selected} != expected:
        raise SystemExit('Missing/extra raw evidence files: ' + job['id'])
    files.extend((job['id'], p) for p in selected)
if len(files) != 70:
    raise SystemExit('Require forty raw windows and thirty manifest/process/summary files')
output = directory / 'raw'
output.mkdir(exist_ok=True)
records = []
for run_id, source in files:
    raw = source.read_bytes()
    json.loads(raw)
    encoded = gzip.compress(raw, compresslevel=6, mtime=0)
    target = output / (run_id + '--' + source.name + '.gz')
    with target.open('xb') as stream:
        stream.write(encoded)
    if gzip.decompress(target.read_bytes()) != raw:
        raise SystemExit('Archive round-trip differs')
    records.append({'runId': run_id, 'source': str(source.relative_to(root)),
        'archive': str(target.relative_to(directory)), 'bytes': len(raw),
        'gzipBytes': len(encoded), 'sha256': hashlib.sha256(raw).hexdigest(),
        'gzipSHA256': hashlib.sha256(encoded).hexdigest()})
index = {'status': 'ALL_70_JSON_PARSED_ROUNDTRIP_VERIFIED',
    'realKubernetesOrProviderPayload': False, 'files': records,
    'totalOriginalBytes': sum(p['bytes'] for p in records),
    'totalGzipBytes': sum(p['gzipBytes'] for p in records)}
with index_path.open('x') as stream:
    json.dump(index, stream, indent=2)
    stream.write('\n')
print(json.dumps({key: value for key, value in index.items() if key != 'files'}))
