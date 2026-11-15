# Render identity raw evidence

The eight original JSON files remain unchanged locally. Git transports their byte-exact gzip copies to avoid ~760,000 pretty-printed lines. `ARCHIVE_INDEX.json` binds original bytes/SHA256 and gzip SHA256; the original worker `SHA256SUMS` remains unchanged.

For each runtime path in the index, run `gzip -dk PATH-render-identity.json.gz` after cloning, then verify original `SHA256SUMS`. Existing local raw files must not be overwritten. PNG/summary/manifest/helper/report evidence stays directly readable. Compression changes transport only, not measurements.
