#!/usr/bin/env bash
# Server update: pull, reinstall, check secrets, build, restart (/opt/veritas/deploy/update.sh)
# Gitignored files (backend/.env, backend/data/*.json, veritas/config.lua) stay untouched
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"

echo "==> Pulling $BRANCH"
git fetch --prune origin
# Hard reset, not merge: the server is a copy; local edits would block the next pull
git reset --hard "origin/$BRANCH"

echo "==> Backend dependencies"
npm --prefix backend ci --omit=dev

# Exit codes of scripts/secrets-report.js; the deploy reports them, it never stops on them,
# because an install with a complete backend/.env runs whatever the vault says (BACKEND.md §5)
echo "==> Secrets"
SECRETS_CODE=0
npm --prefix backend run --silent secrets || SECRETS_CODE=$?

case "$SECRETS_CODE" in
    0) SECRETS_VERDICT="All secrets synced from Infisical." ;;
    1) SECRETS_VERDICT="MISSING SECRETS - required settings are in neither Infisical nor backend/.env." ;;
    2) SECRETS_VERDICT="PARTLY SYNCED - some settings come from backend/.env, not from Infisical." ;;
    *) SECRETS_VERDICT="NOT SYNCED - Infisical is not configured or could not be read; backend/.env is in use." ;;
esac

echo "==> Building the panel"
npm --prefix frontend ci
npm --prefix frontend run build

# Restart needs root (or sudo rights for the service); otherwise say so
if systemctl is-enabled --quiet veritas 2>/dev/null; then
    echo "==> Restarting veritas.service"
    systemctl restart veritas
else
    echo "==> veritas.service not found - restart the backend yourself"
fi

# Repeated here: the secret verdict scrolls away behind the frontend build
echo
echo "-------------------------------------------------------------"
echo "  Secrets: $SECRETS_VERDICT"
echo "           Details above, or run: npm --prefix backend run secrets"
echo "-------------------------------------------------------------"
echo
echo "Done. The FiveM resource is not reloaded by this script:"
echo "  type 'ensure veritas' in the server console if the bridge changed."

exit 0
