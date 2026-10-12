// Infisical as the source of the settings; backend/.env stays the fallback (BACKEND.md §5)
// SECURITY: values are held in process.env only; nothing here writes a secret to disk or to a log
const fs = require('fs');
const path = require('path');

const TEMPLATE = path.join(__dirname, '../.env.example');

// Settings a production install cannot come up without; the rest may be legitimately empty (§5)
const REQUIRED = [
    'DB_HOST', 'DB_USER', 'DB_NAME',
    'FIVEM_JSON_PATH', 'FIVEM_API_URL',
    'SESSION_SECRET',
];

// Always required: without all three the panel locks and serves only its setup screen
const DISCORD_SET = ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_REDIRECT_URI'];

// One owner mapping has to exist, either one satisfies it (§4: the owner can never be locked out)
const OWNER_EITHER = ['DISCORD_OWNER_IDS', 'DISCORD_ROLE_OWNER'];

const filled = (value) => typeof value === 'string' && value.trim() !== '';

/** Settings the fetch needs; `ready` false means Infisical is simply not in use here */
function config(env = process.env) {
    const clientId = (env.INFISICAL_CLIENT_ID || '').trim();
    const clientSecret = (env.INFISICAL_CLIENT_SECRET || '').trim();
    const projectId = (env.INFISICAL_PROJECT_ID || '').trim();
    return {
        clientId,
        clientSecret,
        projectId,
        environment: (env.INFISICAL_ENVIRONMENT || 'prod').trim(),
        secretPath: (env.INFISICAL_SECRET_PATH || '/').trim(),
        siteUrl: (env.INFISICAL_SITE_URL || '').trim() || undefined,
        ready: Boolean(clientId && clientSecret && projectId),
    };
}

/** Keys `.env.example` declares, in file order; it is the authority on the key set (§5) */
function templateKeys(file = TEMPLATE) {
    let text;
    try {
        text = fs.readFileSync(file, 'utf8');
    } catch {
        return [];
    }

    const keys = [];
    for (const line of text.split(/\r?\n/)) {
        const match = /^\s*([A-Z][A-Z0-9_]*)\s*=/.exec(line);
        if (match && !keys.includes(match[1])) keys.push(match[1]);
    }
    return keys;
}

// Infisical's own settings live in the environment that reaches it, never in its own vault
const SELF = /^INFISICAL_/;

/**
 * What each declared key is worth, and where it came from
 * @returns {{rows: object[], counts: object, missing: string[], localOnly: string[],
 *            extra: string[], ok: boolean}}
 */
function report({ template = [], infisical = {}, local = {} } = {}) {
    const rows = [];
    const required = new Set([...REQUIRED, ...DISCORD_SET]);

    const ownerSatisfied = OWNER_EITHER.some(k => filled(infisical[k]) || filled(local[k]));

    for (const key of template) {
        if (SELF.test(key)) continue;

        const fromVault = filled(infisical[key]);
        const fromFile = filled(local[key]);
        const needed = required.has(key) || (OWNER_EITHER.includes(key) && !ownerSatisfied);

        let state;
        if (fromVault) state = 'synced';
        else if (fromFile) state = 'local only';
        else if (needed) state = 'missing';
        else state = 'unset';

        rows.push({ key, state, required: needed });
    }

    // Drift the other way: a key in the vault that the template does not declare (§5)
    const declared = new Set(template);
    const extra = Object.keys(infisical).filter(k => !declared.has(k) && !SELF.test(k)).sort();

    const of = (state) => rows.filter(r => r.state === state).map(r => r.key);
    const missing = of('missing');
    const localOnly = of('local only');

    return {
        rows,
        counts: {
            synced: of('synced').length,
            localOnly: localOnly.length,
            missing: missing.length,
            unset: of('unset').length,
            extra: extra.length,
        },
        missing,
        localOnly,
        extra,
        // Every declared key with a value holds it from the vault; nothing required is absent
        ok: missing.length === 0 && localOnly.length === 0,
    };
}

// Module state, so server.js can tell a start through scripts/start.js from a direct one
let delivered = false;

/** Whether this process ever took values from the vault; false after a direct `node server.js` */
function loaded() {
    return delivered;
}

/**
 * Puts fetched values into `env`
 * The vault wins over `backend/.env`, which dotenv only applies to keys still unset (§5)
 */
function apply(secrets = {}, env = process.env) {
    let applied = 0;
    for (const [key, value] of Object.entries(secrets)) {
        if (!filled(value) || SELF.test(key)) continue;
        env[key] = value;
        applied += 1;
    }
    delivered = true;
    return applied;
}

/** Key to value from one listSecrets answer; hidden values count as absent, not as empty */
function collect(answer) {
    const out = {};
    const take = (list) => {
        for (const secret of list || []) {
            if (!secret?.secretKey || secret.secretValueHidden) continue;
            out[secret.secretKey] = secret.secretValue ?? '';
        }
    };

    take(answer?.secrets);
    for (const imported of answer?.imports || []) take(imported.secrets);
    return out;
}

/**
 * Reads every secret of the configured project path
 * @returns {Promise<{ok: boolean, secrets: object, error: string|null}>} never throws; a vault
 *          that cannot be reached must not stop a server that has a usable `.env`
 */
async function fetchSecrets(settings = config()) {
    if (!settings.ready) {
        return { ok: false, secrets: {}, error: 'Infisical is not configured' };
    }

    try {
        const { InfisicalSDK } = require('@infisical/sdk');
        const client = new InfisicalSDK(settings.siteUrl ? { siteUrl: settings.siteUrl } : undefined);

        await client.auth().universalAuth.login({
            clientId: settings.clientId,
            clientSecret: settings.clientSecret,
        });

        const answer = await client.secrets().listSecrets({
            projectId: settings.projectId,
            environment: settings.environment,
            secretPath: settings.secretPath,
            expandSecretReferences: true,
            viewSecretValue: true,
            includeImports: true,
            recursive: false,
        });

        return { ok: true, secrets: collect(answer), error: null };
    } catch (e) {
        // SECURITY: message only; an SDK error can carry the request body with the client secret
        return { ok: false, secrets: {}, error: e?.message || String(e) };
    }
}

module.exports = {
    REQUIRED, DISCORD_SET, OWNER_EITHER, TEMPLATE,
    config, templateKeys, report, apply, loaded, collect, fetchSecrets,
};
