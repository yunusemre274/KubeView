#!/bin/sh
# Portable entry point: Python's standard library is the only runner dependency.
set -eu
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec "${PYTHON:-python3}" "$SCRIPT_DIR/manual_lab.py" "$@"
