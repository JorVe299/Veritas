// The sync verdict: what counts as synced, what only lives in .env, and what is simply absent
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const secrets = require('./secrets');

const TEMPLATE = ['DB_HOST', 'DB_USER', 'DB_NAME', 'FIVEM_JSON_PATH', 'FIVEM_API_URL',
    'SESSION_SECRET', 'TRUST_PROXY', 'DISCORD_OWNER_IDS', 'DISCORD_ROLE_OWNER'];

// A vault answer that satisfies everything the report demands
function complete(extra = {}) {
    return {
        DB_HOST: '127.0.0.1', DB_USER: 'veritas', DB_NAME: 'qbox',
        FIVEM_JSON_PATH: '/opt/fivem/resources/veritas', FIVEM_API_URL: 'http://127.0.0.1:30120/veritas',
        SESSION_SECRET: 'a'.repeat(64), DISCORD_OWNER_IDS: '123456789012345678',
        ...extra,
    };
}

test('a full vault answer is reported as synced', () => {
    const out = secrets.report({ template: TEMPLATE, infisical: complete(), local: {} });
    assert.equal(out.ok, true);
    assert.equal(out.counts.synced, 7);
    assert.deepEqual(out.missing, []);
    assert.deepEqual(out.localOnly, []);
});

test('a value that only exists in .env is not synced', () => {
    const vault = complete();
    delete vault.DB_USER;
    const out = secrets.report({ template: TEMPLATE, infisical: vault, local: { DB_USER: 'veritas' } });

    assert.equal(out.ok, false);
    assert.deepEqual(out.localOnly, ['DB_USER']);
    assert.deepEqual(out.missing, []);
});

test('an empty string in the vault counts as not delivered', () => {
    const out = secrets.report({
        template: TEMPLATE,
        infisical: complete({ DB_NAME: '   ' }),
        local: { DB_NAME: 'qbox' },
    });
    assert.deepEqual(out.localOnly, ['DB_NAME']);
});

test('a required setting absent on both sides is missing', () => {
    const vault = complete();
    delete vault.SESSION_SECRET;
    const out = secrets.report({ template: TEMPLATE, infisical: vault, local: {} });

    assert.deepEqual(out.missing, ['SESSION_SECRET']);
    assert.equal(out.ok, false);
});

test('an optional setting absent on both sides is unset, not missing', () => {
    const out = secrets.report({ template: TEMPLATE, infisical: complete(), local: {} });
    const row = out.rows.find(r => r.key === 'TRUST_PROXY');

    assert.equal(row.state, 'unset');
    assert.equal(row.required, false);
    assert.equal(out.ok, true);
});

test('either owner mapping satisfies the owner rule', () => {
    const vault = complete();
    delete vault.DISCORD_OWNER_IDS;
    vault.DISCORD_ROLE_OWNER = '987654321098765432';

    const out = secrets.report({ template: TEMPLATE, infisical: vault, local: {} });
    assert.deepEqual(out.missing, []);
    assert.equal(out.ok, true);
});

test('with no owner mapping at all both candidates are reported missing', () => {
    const vault = complete();
    delete vault.DISCORD_OWNER_IDS;

    const out = secrets.report({ template: TEMPLATE, infisical: vault, local: {} });
    assert.deepEqual(out.missing, ['DISCORD_OWNER_IDS', 'DISCORD_ROLE_OWNER']);
});

test('the rest of the Discord trio is reported when one of it is set', () => {
    const template = [...TEMPLATE, 'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_REDIRECT_URI'];
    const out = secrets.report({
        template,
        infisical: complete({ DISCORD_CLIENT_ID: '42' }),
        local: {},
    });

    assert.deepEqual(out.missing, ['DISCORD_CLIENT_SECRET', 'DISCORD_REDIRECT_URI']);
});

// The panel locks without it, so an empty trio is a missing setting, not an unset one
test('the Discord trio is required even when none of it is configured', () => {
    const template = [...TEMPLATE, 'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_REDIRECT_URI'];
    const out = secrets.report({ template, infisical: complete(), local: {} });

    assert.deepEqual(out.missing,
        ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_REDIRECT_URI']);
    assert.equal(out.ok, false);
});

test('a vault key the template does not declare is reported as drift', () => {
    const out = secrets.report({
        template: TEMPLATE,
        infisical: complete({ OLD_SETTING: 'x' }),
        local: {},
    });

    assert.deepEqual(out.extra, ['OLD_SETTING']);
    // Drift the other way is a note, not a failure: it breaks no running install
    assert.equal(out.ok, true);
});

test("Infisical's own settings are never part of the verdict", () => {
    const out = secrets.report({
        template: [...TEMPLATE, 'INFISICAL_CLIENT_ID'],
        infisical: complete({ INFISICAL_CLIENT_SECRET: 'x' }),
        local: {},
    });

    assert.equal(out.rows.some(r => r.key.startsWith('INFISICAL_')), false);
    assert.deepEqual(out.extra, []);
});

test('the vault wins over a value already in the environment', () => {
    const env = { DB_HOST: 'from-env', PORT: '3001' };
    const applied = secrets.apply({ DB_HOST: 'from-vault', DB_USER: 'veritas' }, env);

    assert.equal(env.DB_HOST, 'from-vault');
    assert.equal(env.DB_USER, 'veritas');
    assert.equal(env.PORT, '3001');
    assert.equal(applied, 2);
});

test('an empty vault value leaves the environment alone', () => {
    const env = { DB_HOST: 'from-env' };
    const applied = secrets.apply({ DB_HOST: '', INFISICAL_CLIENT_ID: 'x' }, env);

    assert.equal(env.DB_HOST, 'from-env');
    assert.equal(env.INFISICAL_CLIENT_ID, undefined);
    assert.equal(applied, 0);
});

test('imported secrets are collected, hidden ones are not', () => {
    const out = secrets.collect({
        secrets: [
            { secretKey: 'DB_HOST', secretValue: '127.0.0.1', secretValueHidden: false },
            { secretKey: 'DB_PASSWORD', secretValue: '', secretValueHidden: true },
        ],
        imports: [{ secrets: [{ secretKey: 'SESSION_SECRET', secretValue: 'abc', secretValueHidden: false }] }],
    });

    assert.deepEqual(out, { DB_HOST: '127.0.0.1', SESSION_SECRET: 'abc' });
});

test('the key set is read from .env.example, comments and blanks ignored', () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'veritas-env-')), '.env.example');
    fs.writeFileSync(file, [
        '# Copy to .env',
        '',
        '# --- Database ---',
        'DB_HOST=127.0.0.1',
        'DB_USER=',
        '  SESSION_SECRET=',
        '# DISCORD_CLIENT_ID=commented out',
        'DB_HOST=duplicate',
    ].join('\n'));

    assert.deepEqual(secrets.templateKeys(file), ['DB_HOST', 'DB_USER', 'SESSION_SECRET']);
    fs.rmSync(path.dirname(file), { recursive: true, force: true });
});

test('the real .env.example parses into a key set', () => {
    const keys = secrets.templateKeys();
    assert.ok(keys.includes('DB_HOST'));
    assert.ok(keys.includes('SESSION_SECRET'));
    assert.ok(keys.length > 20);
});

test('config reads ready only with all three identity settings', () => {
    assert.equal(secrets.config({}).ready, false);
    assert.equal(secrets.config({ INFISICAL_CLIENT_ID: 'a', INFISICAL_CLIENT_SECRET: 'b' }).ready, false);

    const full = secrets.config({
        INFISICAL_CLIENT_ID: 'a', INFISICAL_CLIENT_SECRET: 'b', INFISICAL_PROJECT_ID: 'c',
    });
    assert.equal(full.ready, true);
    assert.equal(full.environment, 'prod');
    assert.equal(full.secretPath, '/');
    assert.equal(full.siteUrl, undefined);
});

test('an unconfigured fetch reports itself instead of throwing', async () => {
    const answer = await secrets.fetchSecrets(secrets.config({}));
    assert.equal(answer.ok, false);
    assert.deepEqual(answer.secrets, {});
    assert.match(answer.error, /not configured/);
});
