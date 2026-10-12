# Taking the README screenshots

The README shows nine screenshots from this folder. They are the first thing anyone
sees about Veritas, so they have to show the build that is actually shipping.

They are taken from the real panel running against an invented world: `mock/` boots
the real backend with its database, bridge, catalogs and sign-in replaced, so every
route, shaper and permission check is the production one and only the data is made
up. No database, no FiveM server and no Discord app are needed, and `backend/.env`
is never read.

## Taking them

```bash
cd docs/screenshots/mock
npm install          # playwright-core; it drives the Edge or Chrome already installed
npm run serve        # the panel against the mock world, on http://127.0.0.1:3101
npm run capture      # in a second shell: writes all nine files
```

`npm run capture -- home` takes a single shot. Set `BROWSER` to a Chromium binary if
neither Edge nor Chrome sits in its usual place.

## Rules

**No real player data.** The README states that the screenshots show made-up demo
characters. The mock world in `mock/world.js` is where they come from; a shot is
never taken against a live server's database.

**One build per set.** Mixed shots from two builds look like a broken product.
When the panel's chrome changes — the top bar, the section tabs, the card styling —
every shot is retaken, not only the one whose page changed. Build the panel first
(`cd frontend && npm run build`), or the shots show the previous one.

**Same frame every time.** 1440 × 900 CSS pixels at a device pixel ratio of 2, dark
theme, no browser chrome, nothing hovered and nothing focused. `capture.js` sets all
of that, and parks the pointer in a corner before each shot.

**JPEG, quality 86**, under 350 KB each, under the file name the README already
references. Replacing a file is enough; the README needs no edit.

## The shots

| File | Route | What must be on screen |
|---|---|---|
| `home.jpg` | `/` | The start page with the link status up and several citizens on the server as cards. |
| `citizen-identity.jpg` | a citizen → Identity | Employer and rank, all four licences, name and phone number. |
| `citizen-money.jpg` | a citizen → Money | The cash and bank transaction form beside the citizen's accounts, with a company account among them. |
| `citizen-assets.jpg` | a citizen → Assets | The inventory with its weight bar beside the vehicle list, with one vehicle in each state: in garage, out, impounded. |
| `server-bans.jpg` | Server → Bans | Both record sources in one list, in-force bans first, a txAdmin row and a database row with a Veritas reference. |
| `server-organisations.jpg` | Server → Organisations | Jobs and gangs with balances, member counts and grades. |
| `permissions.jpg` | Permissions | The rights grid with every role column and several areas. |
| `veritas-id-characters.jpg` | `/id` | A player's characters with job, cash and bank. |
| `veritas-id-character.jpg` | `/id` → one character | Papers, work, money, licences and condition on one page. |

## Status

Taken on 2026-10-12 against `410e24d`, with the frontend built from that commit.

The set before it was from 2026-09-28 and had gone stale in ways that showed in all
nine, because the top bar is in every frame: the bridge status read `LIVE LINK · 7 ON
SERVER` where the panel now says `Link up · N on server`, and the signed-in role sat
beside the name instead of in the account menu.
