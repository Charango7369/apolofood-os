#!/bin/bash
set -e
DB_FILE="${DB_FILE:-apolofood.db}"
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S).db"
if [ -z "$R2_BUCKET" ]; then echo "❌ R2_BUCKET no configurado"; exit 1; fi
echo "📦 Respaldando $DB_FILE → R2/$BACKUP_NAME"
aws s3 cp "$DB_FILE" "s3://${R2_BUCKET}/${BACKUP_NAME}" --endpoint-url "$R2_ENDPOINT"
echo "✅ Respaldo: $BACKUP_NAME"
