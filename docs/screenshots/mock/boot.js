// Boots the real backend against the invented world: no database, no FiveM, no Discord.
// Only the outermost layers are replaced; every route, shaper and permission check is the real one.
const path = require('path');

const BACKEND = path.join(__dirname, '../../../backend');
const W = require('./world');

function stub(moduleId, exports) {
    const file = require.resolve(path.join(BACKEND, moduleId));
    require.cache[file] = { id: file, filename: file, loaded: true, exports };
}

// SECURITY: the real backend/.env is never read - no live credentials enter this process
stub('node_modules/dotenv', { config: () => ({ parsed: {} }) });

// The panel is served on its own port so nothing collides with a real install
process.env.PORT = process.env.PORT || '3101';
process.env.DB_NAME = 'veritas_demo';
process.env.TXADMIN_SHOW_BAN_AUTHOR = 'true';
process.env.PANEL_ORIGIN = '';

// --- Database -------------------------------------------------------------
const db = require('./db');
stub('utils/dbHandler', {
    ...db,
    pickExistingColumns: async (table, data) => {
        const columns = await db.getTableColumns(table);
        const out = {};
        for (const [k, v] of Object.entries(data)) if (columns.includes(k)) out[k] = v;
        return out;
    },
    listTables: async () => Object.keys(db.COLUMNS).map(name => ({ name, approxRows: 100 })),
});

// --- The game server ------------------------------------------------------
stub('utils/bridge', {
    FIVEM_API_URL: 'http://127.0.0.1:30120/veritas',
    BRIDGE_TIMEOUT: 2000,
    HAS_TOKEN: true,
    isPlayerOnline: async (cid) => Boolean(W.ONLINE[cid]),
    fetchOnlinePlayers: async () => ({ online: { ...W.ONLINE }, reachable: true, error: null }),
    fetchStatus: async () => ({ reachable: true, framework: 'qbox', resource: 'veritas' }),
    callBridge: async () => ({ success: true, applied: 'live' }),
});

// --- Catalogs the resource exports ---------------------------------------
stub('utils/dataLoader', {
    loadGameData: () => {},
    getJobs: () => W.JOBS,
    getGangs: () => W.GANGS,
    getItems: () => W.ITEMS,
    getVehicles: () => W.VEHICLES,
});

// --- txAdmin's own ban record --------------------------------------------
const txadminReal = require(path.join(BACKEND, 'utils/txadmin'));
stub('utils/txadmin', {
    ...txadminReal,
    status: async () => ({ available: true, file: 'txData/playersDB.json', actions: W.TXADMIN_ACTIONS.length }),
    describe: async () => ({ available: true, file: 'txData/playersDB.json' }),
    allActions: async ({ types } = {}) => ({
        available: true,
        actions: W.TXADMIN_ACTIONS
            .filter(a => !types || types.includes(a.type))
            .map(a => txadminReal.shapeAction(a)),
    }),
    actionsFor: async (identifiers, { types } = {}) => {
        const own = new Set((identifiers || []).map(String));
        return {
            available: true,
            actions: W.TXADMIN_ACTIONS
                .filter(a => (!types || types.includes(a.type)) && a.ids.some(id => own.has(id)))
                .map(a => txadminReal.shapeAction(a)),
        };
    },
});

// --- Sign-in --------------------------------------------------------------
// A fixed signed-in owner: the panel renders exactly as it does for a real session,
// without a Discord round trip. Capabilities still come from the real permission store.
const perms = require(path.join(BACKEND, 'utils/permissions'));

const SESSION = {
    sub: W.STAFF.id,
    username: W.STAFF.username,
    globalName: W.STAFF.globalName,
    avatar: null,
    via: 'user',
    role: perms.OWNER_ROLE,
    portal: true,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
};

function publicUser(session = SESSION) {
    if (!session) return null;
    return {
        id: session.sub,
        username: session.username,
        globalName: session.globalName,
        avatarUrl: null,
        via: session.via,
        role: session.role,
        roleLabel: perms.labelOf(session.role),
        portal: true,
        capabilities: perms.capabilitiesOf(session.role),
        expiresAt: new Date(session.exp * 1000).toISOString(),
    };
}

stub('utils/auth', {
    ENABLED: true,
    SESSION_HOURS: 8,
    SYNC_SECONDS: 60,
    STATE_COOKIE: 'veritas_oauth_state',
    GUILD_ID: null,
    requireAuth: (req, res, next) => { req.user = publicUser(); next(); },
    currentSession: async () => ({ session: SESSION, ended: null }),
    readSession: () => SESSION,
    publicUser,
    issueSession: () => {},
    clearSession: () => {},
    cookieSecure: () => false,
    cookieOptions: () => ({ httpOnly: true, sameSite: 'lax', secure: false, path: '/' }),
    configProblems: () => [],
    mappingSummary: () => [{ label: 'Owner', users: 1, guildRoles: 0 }],
    buildAuthorizeUrl: () => ({ url: '/', state: 'demo' }),
    exchangeCode: async () => ({ accessToken: 'demo' }),
    fetchDiscordUser: async () => W.STAFF,
    fetchGuildRoles: async () => ({ member: true, roles: [] }),
    authorize: () => ({ allowed: true, via: 'user', role: perms.OWNER_ROLE }),
    syncSession: async () => ({ kind: 'unchanged' }),
    sealTokens: () => null,
    unsealTokens: () => null,
    isApiPath: (p) => p.startsWith('/api/'),
    isAuthPath: (p) => p.startsWith('/api/auth/'),
});

// The resource secret path is not part of any screenshot
stub('utils/resourceAuth', { HEADER: 'x-veritas-secret', identify: (req, res, next) => next() });

require(path.join(BACKEND, 'server.js'));
