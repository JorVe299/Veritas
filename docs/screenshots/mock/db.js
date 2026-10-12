// Stand-in for utils/dbHandler: answers the backend's real queries from the invented world.
const W = require('./world');

const COLUMNS = {
    players: ['citizenid', 'userId', 'license', 'name', 'phone_number', 'charinfo', 'job', 'gang',
        'money', 'metadata', 'inventory', 'position', 'last_logged_out'],
    users: ['userId', 'username', 'license', 'license2', 'fivem', 'discord', 'steam'],
    player_vehicles: ['id', 'citizenid', 'vehicle', 'hash', 'mods', 'plate', 'garage', 'fuel',
        'engine', 'body', 'state', 'depotprice', 'drivingdistance'],
    bank_accounts_new: ['id', 'amount', 'isFrozen', 'auth', 'label', 'type'],
    player_groups: ['citizenid', 'group', 'type', 'grade'],
    bans: ['id', 'name', 'license', 'discord', 'ip', 'reason', 'expire', 'bannedby', 'reference', 'created_at'],
    veritas_ban_log: ['id', 'reference', 'citizenid', 'name', 'reason', 'bannedby', 'created_at', 'liftedAt'],
};

const flat = (s) => String(s).replace(/\s+/g, ' ').trim();

// players rows carry every column; a SELECT gets the subset it asked for
function pick(row, fields) {
    if (!fields || fields.includes('*')) return { ...row };
    const out = {};
    for (const f of fields) {
        const name = f.trim().split(/\s+AS\s+/i).pop().trim();
        const source = f.trim().split(/\s+AS\s+/i)[0].trim().replace(/^\w+\./, '');
        out[name] = row[source] ?? row[name] ?? null;
    }
    return out;
}

const unseen = new Set();

async function execute(sql, params = []) {
    const q = flat(sql);

    // --- Schema introspection ---------------------------------------------
    if (/information_schema\.COLUMNS/i.test(q)) {
        const table = params[0];
        return [(COLUMNS[table] || []).map(name => ({ name }))];
    }
    if (/information_schema\.TABLES/i.test(q)) {
        return [Object.keys(COLUMNS).map(name => ({ name, approxRows: 100 }))];
    }

    // The signed-in account's own identifiers (Veritas ID ban record)
    if (/FROM users WHERE discord IN/i.test(q)) {
        const cid = W.PORTAL_CHARACTERS[0];
        return [[{
            license: W.byId(cid).license, license2: null, fivem: null,
            discord: W.DISCORD_OF[cid], steam: null,
        }]];
    }

    // --- Identifier -> character (ban list holders) -------------------------
    if (/FROM users u JOIN players p/i.test(q)) {
        const wanted = new Set(params.map(p => String(p).toLowerCase()));
        const rows = W.CITIZENS.filter(c => {
            const discord = W.DISCORD_OF[c.citizenid] || '';
            return [c.license, discord, discord.replace(/^discord:/, ''), c.license.replace(/^license:/, '')]
                .some(v => wanted.has(String(v).toLowerCase()));
        }).map(c => ({
            citizenid: c.citizenid,
            charinfo: c.charinfo,
            playerLicense: c.license,
            username: `player_${c.userId}`,
            u_license: c.license,
            u_license2: null,
            u_fivem: null,
            u_discord: W.DISCORD_OF[c.citizenid] || null,
            u_steam: null,
        }));
        return [rows];
    }

    // --- Identity: discord -> characters -----------------------------------
    if (/FROM players p JOIN users u/i.test(q) && /SELECT 1/i.test(q)) {
        const cid = params[params.length - 1];
        return [W.PORTAL_CHARACTERS.includes(cid) ? [{ 1: 1 }] : []];
    }
    if (/FROM players p JOIN users u/i.test(q) && /u\.discord/i.test(q) && /SELECT u\.discord/i.test(q)) {
        return [[{ discord: W.PORTAL_DISCORD }]];
    }
    if (/FROM players p JOIN users u/i.test(q) || /JOIN users u ON u\.userId = p\.userId/i.test(q)) {
        const rows = W.PORTAL_CHARACTERS.map(cid => {
            const c = W.byId(cid);
            return {
                citizenid: c.citizenid, charinfo: c.charinfo, job: c.job, money: c.money,
                last_logged_out: c.last_logged_out, username: W.PORTAL_USERNAME,
                playerLicense: c.license, license: c.license, name: c.name,
                discord: `discord:${W.PORTAL_DISCORD}`,
            };
        });
        return [rows];
    }

    // --- players -----------------------------------------------------------
    if (/FROM players/i.test(q) && /GROUP BY/i.test(q)) {
        const counts = {};
        for (const c of W.CITIZENS) {
            const name = JSON.parse(c.job).name;
            counts[name] = (counts[name] || 0) + 1;
        }
        return [Object.entries(counts).map(([name, n]) => ({ name, n }))];
    }
    if (/^SELECT .* FROM players/i.test(q)) {
        const fields = q.slice(7, q.toUpperCase().indexOf(' FROM ')).split(',');
        let rows = W.CITIZENS;

        if (/WHERE citizenid = \?/i.test(q) || /WHERE citizenid IN/i.test(q)) {
            rows = rows.filter(c => params.includes(c.citizenid));
        } else if (/WHERE job = \?/i.test(q)) {
            rows = rows.filter(c => JSON.parse(c.job).name === params[0]);
        } else if (/WHERE/i.test(q) && params.length > 0) {
            // Search: the backend binds one lower-cased term per column
            const needles = [...new Set(params.map(p => String(p).toLowerCase().replace(/%/g, '')))]
                .filter(Boolean);
            rows = rows.filter(c => needles.some(n =>
                `${c.name} ${c.citizenid}`.toLowerCase().replace(/\s+/g, '').includes(n.replace(/\s+/g, ''))));
        }

        const limit = /LIMIT (\d+)/i.exec(q);
        const offset = /OFFSET (\d+)/i.exec(q);
        if (offset) rows = rows.slice(Number(offset[1]));
        if (limit) rows = rows.slice(0, Number(limit[1]));
        return [rows.map(r => pick(r, fields))];
    }

    // --- vehicles ----------------------------------------------------------
    if (/FROM player_vehicles/i.test(q)) {
        const fields = q.slice(7, q.toUpperCase().indexOf(' FROM ')).split(',');
        let rows = W.PLAYER_VEHICLES;
        if (/WHERE citizenid = \?/i.test(q)) rows = rows.filter(v => v.citizenid === params[0]);
        if (/WHERE id = \?/i.test(q)) rows = rows.filter(v => v.id === Number(params[0]));
        if (/WHERE plate = \?/i.test(q)) rows = rows.filter(v => v.plate === params[0]);
        return [rows.map(r => pick(r, fields))];
    }

    // --- bank accounts -----------------------------------------------------
    if (/FROM bank_accounts_new/i.test(q)) {
        let rows = W.ACCOUNTS;
        // One citizen's accounts: their own, plus every company account they are authorised on
        if (/auth LIKE/i.test(q)) {
            const cid = String(params[0]);
            rows = rows.filter(a => a.id === cid || String(a.auth).includes(cid));
        } else if (/WHERE id = \?/i.test(q)) rows = rows.filter(a => a.id === params[0]);
        else if (params.length > 0 && /WHERE/i.test(q)) {
            const owned = params.map(p => String(p).toLowerCase().replace(/%/g, ''));
            rows = rows.filter(a => owned.some(o => o && (a.id.toLowerCase().includes(o)
                || String(a.label).toLowerCase().includes(o) || String(a.auth).toLowerCase().includes(o))));
        }
        const limit = /LIMIT (\d+)/i.exec(q);
        return [limit ? rows.slice(0, Number(limit[1])) : rows];
    }

    // --- group memberships -------------------------------------------------
    if (/FROM player_groups/i.test(q)) {
        // One organisation's roster, one citizen's memberships, or the count per group
        if (/GROUP BY/i.test(q)) {
            const counts = new Map();
            for (const g of W.PLAYER_GROUPS) {
                const key = `${g.type}:${g.group}`;
                counts.set(key, (counts.get(key) || 0) + 1);
            }
            return [[...counts].map(([key, n]) => ({ name: key.split(':')[1], type: key.split(':')[0], n }))];
        }

        let rows = W.PLAYER_GROUPS;
        if (/WHERE `?group`? = \?/i.test(q)) rows = rows.filter(g => g.group === params[0]);
        else if (params.length > 0) rows = rows.filter(g => g.citizenid === params[0]);
        return [rows.map(g => ({ name: g.group, group: g.group, type: g.type, grade: g.grade, citizenid: g.citizenid }))];
    }

    // --- bans --------------------------------------------------------------
    if (/FROM veritas_ban_log/i.test(q) || /FROM bans/i.test(q)) {
        const log = /veritas_ban_log/i.test(q);
        let rows = log ? [] : W.DB_BANS;
        if (!log && params.length > 0 && /WHERE/i.test(q)) {
            const needles = params.map(p => String(p).toLowerCase().replace(/%/g, '')).filter(Boolean);
            rows = rows.filter(b => needles.some(n =>
                [b.license, b.discord, b.ip, b.name].some(v => String(v).toLowerCase().includes(n))));
        }
        const limit = /LIMIT (\d+)/i.exec(q);
        return [limit ? rows.slice(0, Number(limit[1])) : rows];
    }

    if (!unseen.has(q)) {
        unseen.add(q);
        console.warn(`[mock-db] no answer for: ${q.slice(0, 160)}`);
    }
    return [[]];
}

const schemaCache = new Map();

async function getTableColumns(table) {
    if (!schemaCache.has(table)) schemaCache.set(table, COLUMNS[table] || []);
    return schemaCache.get(table);
}

module.exports = {
    db: { execute, query: execute },
    parseJSON: (v) => {
        if (typeof v === 'string') { try { return JSON.parse(v); } catch { return {}; } }
        return v || {};
    },
    updatePlayerColumn: async () => true,
    getTableColumns,
    tableExists: async (t) => (COLUMNS[t] || []).length > 0,
    clearSchemaCache: () => schemaCache.clear(),
    columnsOf: getTableColumns,
    COLUMNS,
};
