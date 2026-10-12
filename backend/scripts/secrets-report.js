#!/usr/bin/env node
// Says whether every setting in .env.example is synced from Infisical; run by deploy/update.sh
// SECURITY: prints key names and where they came from, never a value
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const secrets = require('../utils/secrets');

const ENV_FILE = path.join(__dirname, '../.env');

// Exit codes the deploy script reads
const OK = 0;
const MISSING = 1;
const NOT_SYNCED = 2;
const UNAVAILABLE = 3;

function localValues() {
    try {
        return dotenv.parse(fs.readFileSync(ENV_FILE));
    } catch {
        return {};
    }
}

function list(keys, limit = 8) {
    const shown = keys.slice(0, limit).join(', ');
    return keys.length > limit ? `${shown}, +${keys.length - limit} more` : shown;
}

async function main() {
    // The vault's own settings may come from the environment or from the file beside it
    const fromFile = localValues();
    const settings = secrets.config({ ...fromFile, ...process.env });
    const template = secrets.templateKeys();

    console.log('Secrets');

    if (!settings.ready) {
        console.log('  Infisical is not configured - the backend reads backend/.env');
        console.log('  Set INFISICAL_CLIENT_ID, INFISICAL_CLIENT_SECRET and INFISICAL_PROJECT_ID to sync');
        return UNAVAILABLE;
    }

    console.log(`  project ${settings.projectId}  environment ${settings.environment}  path ${settings.secretPath}`);

    const answer = await secrets.fetchSecrets(settings);
    if (!answer.ok) {
        console.log(`  NOT SYNCED - Infisical could not be read: ${answer.error}`);
        console.log('  The backend falls back to backend/.env; nothing was changed');
        return UNAVAILABLE;
    }

    const result = secrets.report({ template, infisical: answer.secrets, local: fromFile });
    const c = result.counts;

    console.log(`  synced      ${String(c.synced).padStart(3)}`);
    console.log(`  local only  ${String(c.localOnly).padStart(3)}${c.localOnly ? `   ${list(result.localOnly)}` : ''}`);
    console.log(`  missing     ${String(c.missing).padStart(3)}${c.missing ? `   ${list(result.missing)}` : ''}`);
    console.log(`  unset       ${String(c.unset).padStart(3)}   optional, empty everywhere`);
    if (c.extra) console.log(`  not in .env.example  ${c.extra}   ${list(result.extra)}`);

    console.log('');
    if (c.missing) {
        console.log(`  MISSING - ${c.missing} required setting(s) are in neither Infisical nor backend/.env`);
        console.log('  The panel will not come up correctly until they are set');
        return MISSING;
    }
    if (c.localOnly) {
        console.log(`  PARTLY SYNCED - ${c.localOnly} setting(s) come from backend/.env, not from Infisical`);
        console.log('  Add them to the project above, or they stay on this machine only');
        return NOT_SYNCED;
    }

    console.log(`  ALL SYNCED - every one of the ${c.synced} configured setting(s) came from Infisical`);
    return OK;
}

// Exit code only: process.exit() while the SDK still holds a socket aborts the process on Windows
function finish(code) {
    process.exitCode = code;
    // The SDK's keep-alive connection can outlive the answer; unref'd, so a clean loop still ends
    setTimeout(() => process.exit(code), 500).unref();
}

main()
    .then(finish)
    .catch(e => {
        console.error(`  Secret check failed: ${e.message}`);
        finish(UNAVAILABLE);
    });
