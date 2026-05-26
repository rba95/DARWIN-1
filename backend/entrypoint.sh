#!/bin/bash
set -e

TEMPLATE="/app/app/templates/dat_template.docx"
DEFAULT="/app/default_template/dat_template.docx"

if [ ! -f "$TEMPLATE" ]; then
    echo "[DARWIN] Seeding default template..."
    mkdir -p /app/app/templates
    cp "$DEFAULT" "$TEMPLATE"
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
