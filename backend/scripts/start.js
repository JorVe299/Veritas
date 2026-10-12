#!/usr/bin/env node
// Entry point: pulls the settings from Infisical, then hands over to server.js
// Vault values are set before dotenv runs, and dotenv never overwrites what is already set (§5)
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const secrets = require('../utils/secrets');

const ENV_FILE = path.join(__dirname, '../.env');

function localValues() {
    try {
        return dotenv.parse(fs.readFileSync(ENV_FILE));
    } catch {
        return {};
    }
}

async function main() {
    const settings = secrets.config({ ...localValues(), ...process.env });

    if (settings.ready) {
        const answer = await secrets.fetchSecrets(settings);
        if (answer.ok) {
            const applied = secrets.apply(answer.secrets);
            const result = secrets.report({
                template: secrets.templateKeys(),
                infisical: answer.secrets,
                local: localValues(),
            });
            console.log(`[Secrets] ${applied} from Infisical (${settings.environment}${settings.secretPath})`);
            if (result.localOnly.length > 0) {
                console.log(`[Secrets] still from backend/.env: ${result.localOnly.join(', ')}`);
            }
            if (result.missing.length > 0) {
                console.warn(`[Secrets] missing everywhere: ${result.missing.join(', ')}`);
            }
        } else {
            // Not fatal: a complete .env keeps the install running when the vault is unreachable
            console.warn(`[Secrets] Infisical could not be read (${answer.error}) - using backend/.env`);
        }
    }

    require('../server.js');
}

main().catch(e => {
    console.error(`[Secrets] start failed: ${e.message}`);
    process.exit(1);
});
