// Unconfigured panel: the API is shut, not open
// No DISCORD_* here on purpose - auth.js reads the environment at load, so this file's
// process is the one where ENABLED is false

process.env.DISCORD_CLIENT_ID = '';
process.env.DISCORD_CLIENT_SECRET = '';
process.env.DISCORD_REDIRECT_URI = '';
process.env.SESSION_SECRET = 'test-session-secret';

const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const cookieParser = require('cookie-parser');
const auth = require('./auth');

function appWith({ resource = false } = {}) {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    if (resource) app.use((req, _res, next) => { req.resource = { name: 'veritas' }; next(); });
    app.use(auth.requireAuth);
    app.use((req, res) => res.json({ reached: req.path }));
    return app;
}

async function request(app, path) {
    const server = app.listen(0);
    try {
        const res = await fetch(`http://127.0.0.1:${server.address().port}${path}`);
        return { status: res.status, body: await res.json().catch(() => null) };
    } finally {
        server.close();
    }
}

test('no Discord app configured leaves the panel disabled', () => {
    assert.equal(auth.ENABLED, false);
});

test('data routes answer 503 instead of running open', async () => {
    const res = await request(appWith(), '/api/players');
    assert.equal(res.status, 503);
    assert.equal(res.body.setupRequired, true);
    assert.equal(res.body.authenticated, false);
});

// The '/API/...' bypass that once skipped the login must not skip the lock either
test('the lock is case-insensitive', async () => {
    const res = await request(appWith(), '/API/Players');
    assert.equal(res.status, 503);
});

test('the setup screen can still ask who it is talking to', async () => {
    const res = await request(appWith(), '/api/auth/me');
    assert.equal(res.status, 200);
    assert.equal(res.body.reached, '/api/auth/me');
});

// A resource proves its own secret, so the game server keeps working while staff cannot sign in
test('a resource with a valid secret still passes', async () => {
    const res = await request(appWith({ resource: true }), '/api/players');
    assert.equal(res.status, 200);
});

test('static files stay public', async () => {
    const res = await request(appWith(), '/index.html');
    assert.equal(res.status, 200);
});

test('setupNeeds names the missing keys and no values', () => {
    const needs = auth.setupNeeds();
    assert.deepEqual(needs.missing,
        ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_REDIRECT_URI']);
    assert.equal(needs.sessionSecret, true);
    assert.equal(needs.envFile, 'backend/.env');
    assert.ok(!JSON.stringify(needs).includes('test-session-secret'));
});
