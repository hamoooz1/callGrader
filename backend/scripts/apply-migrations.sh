#!/usr/bin/env bash
set -e
: "${DATABASE_URL:?Need to set DATABASE_URL}"
psql "$DATABASE_URL" -f "$(dirname "$0")/../migrations/000_init_schema.sql"
psql "$DATABASE_URL" -f "$(dirname "$0")/../migrations/001_seed_demo.sql"
