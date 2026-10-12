// Invented demo world for the README screenshots. No real player data, ever.

const j = (o) => JSON.stringify(o);

const JOBS = {
    unemployed: { label: 'Unemployed', grades: { 0: { name: 'Freelancer' } } },
    ambulance: {
        label: 'Pillbox Medical',
        grades: { 0: { name: 'Paramedic' }, 1: { name: 'Doctor' }, 2: { name: 'Surgeon' }, 3: { name: 'Chief of Medicine' } },
    },
    police: {
        label: 'Los Santos Police',
        grades: { 0: { name: 'Cadet' }, 1: { name: 'Officer' }, 2: { name: 'Sergeant' }, 3: { name: 'Lieutenant' }, 4: { name: 'Chief' } },
    },
    mechanic: {
        label: "Benny's Motorworks",
        grades: { 0: { name: 'Apprentice' }, 1: { name: 'Mechanic' }, 2: { name: 'Foreman' } },
    },
    realestate: { label: 'Dynasty 8', grades: { 0: { name: 'Agent' }, 1: { name: 'Broker' } } },
    taxi: { label: 'Downtown Cab Co.', grades: { 0: { name: 'Driver' }, 1: { name: 'Dispatcher' } } },
    cardealer: { label: 'Premium Deluxe Motorsport', grades: { 0: { name: 'Salesperson' }, 1: { name: 'Manager' } } },
};

const GANGS = {
    ballas: { label: 'Ballas', grades: { 0: { name: 'Hangaround' }, 1: { name: 'Soldier' }, 2: { name: 'Lieutenant' } } },
    vagos: { label: 'Vagos', grades: { 0: { name: 'Runner' }, 1: { name: 'Enforcer' } } },
};

const ITEMS = {
    water: { label: 'Water', weight: 500 },
    bread: { label: 'Bread', weight: 300 },
    sandwich: { label: 'Sandwich', weight: 400 },
    phone: { label: 'Phone', weight: 700 },
    id_card: { label: 'ID Card', weight: 0 },
    driver_license: { label: "Driver's Licence", weight: 0 },
    bandage: { label: 'Bandage', weight: 100 },
    medikit: { label: 'Medikit', weight: 1200 },
    radio: { label: 'Radio', weight: 900 },
    lockpick: { label: 'Lockpick', weight: 200 },
    repairkit: { label: 'Repair Kit', weight: 2500 },
    money: { label: 'Money', weight: 0 },
    WEAPON_FLASHLIGHT: { label: 'Flashlight', weight: 1000 },
    WEAPON_STUNGUN: { label: 'Stun Gun', weight: 1500 },
};

const VEHICLES = {
    sultan: { name: 'Sultan', brand: 'Karin', category: 'sports' },
    blista: { name: 'Blista', brand: 'Dinka', category: 'compacts' },
    bati801: { name: 'Bati 801', brand: 'Pegassi', category: 'motorcycles' },
    ambulance: { name: 'Ambulance', brand: 'Brute', category: 'emergency' },
    police3: { name: 'Interceptor', brand: 'Vapid', category: 'emergency' },
    sadler: { name: 'Sadler', brand: 'Vapid', category: 'offroad' },
    futo: { name: 'Futo', brand: 'Karin', category: 'sports' },
};

// --- Citizens -------------------------------------------------------------
// Invented people. Any resemblance to a real player is unintended.

function citizen(o) {
    return {
        citizenid: o.citizenid,
        userId: o.userId,
        license: `license:${o.citizenid.toLowerCase()}00demo`,
        name: `${o.first} ${o.last}`,
        phone_number: o.phone,
        charinfo: j({
            firstname: o.first,
            lastname: o.last,
            birthdate: o.birthdate,
            gender: o.gender ?? 0,
            nationality: o.nationality || 'San Andreas',
            phone: o.phone,
            account: `US0${o.citizenid.replace(/\D/g, '').padStart(8, '0')}`,
        }),
        job: j({
            name: o.job,
            label: JOBS[o.job].label,
            onduty: o.onduty ?? false,
            isboss: o.isboss ?? false,
            grade: { level: o.grade, name: JOBS[o.job].grades[o.grade].name },
        }),
        gang: j(o.gang
            ? { name: o.gang, label: GANGS[o.gang].label, grade: { level: o.gangGrade || 0, name: GANGS[o.gang].grades[o.gangGrade || 0].name } }
            : { name: 'none', label: 'No Gang', grade: { level: 0, name: 'none' } }),
        money: j({ cash: o.cash, bank: o.bank, crypto: o.crypto || 0 }),
        metadata: j({
            hunger: o.hunger ?? 72,
            thirst: o.thirst ?? 65,
            stress: o.stress ?? 12,
            armor: o.armor ?? 0,
            isdead: false,
            inlaststand: false,
            ishandcuffed: false,
            injail: o.injail || 0,
            licences: o.licences,
            licenses: o.licences,
            phone: { background: 1 },
            bloodtype: o.bloodtype || 'O+',
            fingerprint: o.fingerprint,
            callsign: o.callsign || 'NO CALLSIGN',
        }),
        inventory: j(o.inventory || []),
        position: j({ x: -247.5, y: -884.3, z: 30.6, w: 160.0 }),
        last_logged_out: o.lastSeen,
    };
}

function slot(n, name, count, extra) {
    return { slot: n, name, amount: count, count, weight: (ITEMS[name]?.weight || 0) * count, info: extra || {}, metadata: extra || {} };
}

const AISHA_INVENTORY = [
    slot(1, 'phone', 1),
    slot(2, 'id_card', 1, { citizenid: 'BNT10148' }),
    slot(3, 'driver_license', 1, { type: 'Class C' }),
    slot(4, 'medikit', 3),
    slot(5, 'bandage', 6),
    slot(6, 'water', 4),
    slot(7, 'sandwich', 2),
    slot(8, 'radio', 1),
    slot(11, 'money', 1839),
    slot(14, 'WEAPON_FLASHLIGHT', 1),
    slot(17, 'repairkit', 1),
];

const CITIZENS = [
    citizen({
        citizenid: 'BNT10148', userId: 41, first: 'Aisha', last: 'Bennett', phone: '307-1379',
        birthdate: '1994-03-11', job: 'ambulance', grade: 1, onduty: true, cash: 1839, bank: 25062,
        licences: { driver: true, business: false, weapon: false, pilot: false },
        fingerprint: 'VB31KD82LM', callsign: 'MED-12', lastSeen: '2026-10-11 22:41:08',
        inventory: AISHA_INVENTORY, hunger: 68, thirst: 54, stress: 8,
    }),
    citizen({
        citizenid: 'KRG48812', userId: 12, first: 'Marcus', last: 'Kragh', phone: '418-2260',
        birthdate: '1988-07-02', job: 'police', grade: 3, onduty: true, isboss: false, cash: 640, bank: 48210,
        licences: { driver: true, business: false, weapon: true, pilot: false },
        fingerprint: 'QW88XZ10PP', callsign: 'LT-04', lastSeen: '2026-10-11 23:02:55',
        inventory: [slot(1, 'phone', 1), slot(2, 'radio', 1), slot(3, 'WEAPON_STUNGUN', 1), slot(4, 'water', 2)],
        hunger: 81, thirst: 77, stress: 24, armor: 100,
    }),
    citizen({
        citizenid: 'OKN20391', userId: 18, first: 'Daniela', last: 'Okonkwo', phone: '221-8840',
        birthdate: '1997-11-23', job: 'mechanic', grade: 2, onduty: true, isboss: true, cash: 2410, bank: 15890,
        licences: { driver: true, business: true, weapon: false, pilot: false },
        fingerprint: 'MN42TR77AC', lastSeen: '2026-10-11 21:15:30',
        inventory: [slot(1, 'phone', 1), slot(2, 'repairkit', 4), slot(3, 'lockpick', 2)],
        hunger: 55, thirst: 40, stress: 31,
    }),
    citizen({
        citizenid: 'VLS77120', userId: 23, first: 'Tomás', last: 'Villalobos', phone: '559-6104',
        birthdate: '1992-01-30', job: 'taxi', grade: 1, onduty: true, cash: 310, bank: 3870,
        licences: { driver: true, business: false, weapon: false, pilot: false },
        fingerprint: 'LP09GH23KK', gang: 'vagos', gangGrade: 1, lastSeen: '2026-10-11 20:58:12',
        inventory: [slot(1, 'phone', 1), slot(2, 'water', 1), slot(3, 'bread', 3)],
        hunger: 44, thirst: 38, stress: 47,
    }),
    citizen({
        citizenid: 'HRT55903', userId: 31, first: 'Nora', last: 'Hartley', phone: '884-7712',
        birthdate: '1999-05-18', job: 'realestate', grade: 1, cash: 980, bank: 112400,
        licences: { driver: true, business: true, weapon: false, pilot: true },
        fingerprint: 'ZX77QQ41MD', lastSeen: '2026-10-09 18:22:04',
        inventory: [slot(1, 'phone', 1), slot(2, 'id_card', 1)],
    }),
    citizen({
        citizenid: 'DLG31887', userId: 55, first: 'Idris', last: 'Delgado', phone: '662-3310',
        birthdate: '1990-09-07', job: 'cardealer', grade: 1, cash: 4520, bank: 76330,
        licences: { driver: true, business: true, weapon: false, pilot: false },
        fingerprint: 'AA19BB55CD', lastSeen: '2026-10-10 14:03:41',
        inventory: [slot(1, 'phone', 1)],
    }),
    citizen({
        citizenid: 'FNN90044', userId: 62, first: 'Grace', last: 'Finnegan', phone: '770-5521',
        birthdate: '2001-02-14', job: 'unemployed', grade: 0, cash: 85, bank: 220,
        licences: { driver: false, business: false, weapon: false, pilot: false },
        fingerprint: 'TT62UU90EF', lastSeen: '2026-10-08 09:47:19',
        inventory: [],
    }),
    citizen({
        citizenid: 'SRN12204', userId: 70, first: 'Petra', last: 'Sorensen', phone: '902-4418',
        birthdate: '1986-12-01', job: 'police', grade: 1, cash: 1120, bank: 30980,
        licences: { driver: true, business: false, weapon: true, pilot: false },
        fingerprint: 'GG70HH12IJ', callsign: 'OFC-21', lastSeen: '2026-10-11 02:11:50',
        inventory: [slot(1, 'phone', 1), slot(2, 'radio', 1)],
    }),
    citizen({
        citizenid: 'ABD66310', userId: 84, first: 'Yusuf', last: 'Abdi', phone: '345-9927',
        birthdate: '1995-08-25', job: 'ambulance', grade: 0, cash: 460, bank: 8140,
        licences: { driver: true, business: false, weapon: false, pilot: false },
        fingerprint: 'KK84LL66MN', gang: 'ballas', gangGrade: 0, lastSeen: '2026-10-07 23:35:02',
        inventory: [slot(1, 'phone', 1), slot(2, 'bandage', 2)],
    }),
];

// Four of them are on the server right now; the bridge reports source ids
const ONLINE = { BNT10148: 13, KRG48812: 4, OKN20391: 21, VLS77120: 9 };

// --- Vehicles -------------------------------------------------------------

const PLAYER_VEHICLES = [
    { id: 301, citizenid: 'BNT10148', vehicle: 'sultan', plate: '42BNT482', garage: 'pillboxgarage', state: 1, fuel: 78, engine: 1000, body: 1000, mods: '{}' },
    { id: 302, citizenid: 'BNT10148', vehicle: 'blista', plate: '17AISHA0', garage: 'none', state: 0, fuel: 41, engine: 820, body: 760, mods: '{}' },
    { id: 303, citizenid: 'BNT10148', vehicle: 'bati801', plate: '88MED114', garage: 'impound', state: 2, fuel: 12, engine: 410, body: 330, mods: '{}' },
    { id: 311, citizenid: 'KRG48812', vehicle: 'police3', plate: 'LSPD0041', garage: 'missionrow', state: 1, fuel: 95, engine: 1000, body: 980, mods: '{}' },
    { id: 321, citizenid: 'OKN20391', vehicle: 'sadler', plate: 'BENNY022', garage: 'bennys', state: 1, fuel: 60, engine: 900, body: 870, mods: '{}' },
    { id: 331, citizenid: 'VLS77120', vehicle: 'futo', plate: 'CAB77120', garage: 'none', state: 0, fuel: 33, engine: 640, body: 520, mods: '{}' },
];

// --- Bank accounts --------------------------------------------------------

const ACCOUNTS = [
    { id: 'BNT10148', amount: 25062, isFrozen: 0, auth: '[]', label: 'Aisha Bennett', type: 'personal' },
    { id: 'ambulance', amount: 184300, isFrozen: 0, auth: '["BNT10148","ABD66310"]', label: 'Pillbox Medical', type: 'job' },
    { id: 'mechanic', amount: 92750, isFrozen: 0, auth: '["OKN20391"]', label: "Benny's Motorworks", type: 'job' },
    { id: 'police', amount: 410900, isFrozen: 0, auth: '["KRG48812","SRN12204"]', label: 'Los Santos Police', type: 'job' },
    { id: 'KRG48812', amount: 48210, isFrozen: 0, auth: '[]', label: 'Marcus Kragh', type: 'personal' },
    { id: 'OKN20391', amount: 15890, isFrozen: 0, auth: '[]', label: 'Daniela Okonkwo', type: 'personal' },
    { id: 'HRT55903', amount: 112400, isFrozen: 1, auth: '[]', label: 'Nora Hartley', type: 'personal' },
    { id: 'DLG31887', amount: 76330, isFrozen: 0, auth: '[]', label: 'Idris Delgado', type: 'personal' },
    { id: 'cardealer', amount: 268400, isFrozen: 0, auth: '["DLG31887"]', label: 'Premium Deluxe Motorsport', type: 'job' },
];

// --- Group memberships ----------------------------------------------------

const PLAYER_GROUPS = [
    { citizenid: 'BNT10148', group: 'ambulance', type: 'job', grade: 1 },
    { citizenid: 'BNT10148', group: 'taxi', type: 'job', grade: 0 },
    { citizenid: 'KRG48812', group: 'police', type: 'job', grade: 3 },
    { citizenid: 'OKN20391', group: 'mechanic', type: 'job', grade: 2 },
    { citizenid: 'VLS77120', group: 'taxi', type: 'job', grade: 1 },
    { citizenid: 'VLS77120', group: 'vagos', type: 'gang', grade: 1 },
    { citizenid: 'ABD66310', group: 'ambulance', type: 'job', grade: 0 },
    { citizenid: 'ABD66310', group: 'ballas', type: 'gang', grade: 0 },
    { citizenid: 'SRN12204', group: 'police', type: 'job', grade: 1 },
    { citizenid: 'DLG31887', group: 'cardealer', type: 'job', grade: 1 },
    { citizenid: 'HRT55903', group: 'realestate', type: 'job', grade: 1 },
];

// --- Bans -----------------------------------------------------------------

// Aisha and Yusuf are the two characters of the portal account; the rest have their own
const DISCORD_OF = {
    BNT10148: 'discord:400000000000000001',
    ABD66310: 'discord:400000000000000009',
    KRG48812: 'discord:400000000000000002',
    OKN20391: 'discord:400000000000000003',
    VLS77120: 'discord:400000000000000004',
    HRT55903: 'discord:400000000000000001',
    DLG31887: 'discord:400000000000000006',
    FNN90044: 'discord:400000000000000007',
    SRN12204: 'discord:400000000000000008',
};

const now = Math.floor(Date.now() / 1000);
const DB_BANS = [
    {
        id: 5, name: 'Grace Finnegan', license: 'license:fnn9004400demo', discord: DISCORD_OF.FNN90044,
        ip: '198.51.100.24', reason: 'Combat logging during an active scene', expire: now + 60 * 60 * 24 * 5,
        bannedby: 'Alex Mercer', reference: 'VRT-2F7K9A', created_at: '2026-10-09 19:20:11',
    },
    {
        id: 4, name: 'Yusuf Abdi', license: 'license:abd6631000demo', discord: DISCORD_OF.ABD66310,
        ip: '198.51.100.77', reason: 'Random deathmatch at the pier, second offence', expire: now + 60 * 60 * 24 * 30,
        bannedby: 'Petra Sorensen', reference: 'VRT-9QX412', created_at: '2026-10-05 01:44:52',
    },
    {
        id: 3, name: 'Idris Delgado', license: 'license:dlg3188700demo', discord: DISCORD_OF.DLG31887,
        ip: '198.51.100.12', reason: 'Advertising another server in OOC chat', expire: now - 60 * 60 * 24 * 3,
        bannedby: 'Alex Mercer', reference: 'VRT-7T3B8E', created_at: '2026-09-20 16:08:30',
    },
];

// txAdmin's own record, read from its playersDB.json
const TXADMIN_ACTIONS = [
    {
        id: 'BAN-9F2A', type: 'ban', ids: ['license:4e3c9a11demo0001', 'discord:400000000000000011'],
        reason: 'Cheat software detected by the anticheat', author: 'txAdmin',
        timestamp: now - 60 * 60 * 36, expiration: false, revocation: {},
        playerName: 'Victor Lazar',
    },
    {
        id: 'BAN-4C71', type: 'ban', ids: ['license:9b22ff40demo0002'],
        reason: 'Evading a previous ban with a second account', author: 'Alex Mercer',
        timestamp: now - 60 * 60 * 24 * 9, expiration: now + 60 * 60 * 24 * 21, revocation: {},
        playerName: 'Rhea Nakamura',
    },
];

// The signed-in staff member, and the Discord account Veritas ID is shown for
const STAFF = {
    id: '400000000000000001',
    username: 'alex.mercer',
    globalName: 'Alex Mercer',
    avatarUrl: null,
    discriminator: '0',
};

// Veritas ID is shown for the account that owns Aisha and Yusuf
const PORTAL_DISCORD = '400000000000000001';
const PORTAL_USERNAME = 'alex.mercer';
const PORTAL_CHARACTERS = ['BNT10148', 'HRT55903'];

module.exports = {
    JOBS, GANGS, ITEMS, VEHICLES, CITIZENS, ONLINE, PLAYER_VEHICLES, ACCOUNTS,
    PLAYER_GROUPS, DB_BANS, TXADMIN_ACTIONS, STAFF, PORTAL_DISCORD, PORTAL_USERNAME, DISCORD_OF,
    PORTAL_CHARACTERS,
    byId: (cid) => CITIZENS.find(c => c.citizenid === cid) || null,
};
