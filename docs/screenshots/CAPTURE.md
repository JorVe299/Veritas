# Taking the README screenshots

The README shows nine screenshots from this folder. They are the first thing anyone
sees about Veritas, so they have to show the build that is actually shipping.

## Rules

**No real player data.** The README states that the screenshots show made-up demo
characters. Every shot is taken against a test database, never against the live
server's. Names, phone numbers, Discord names and avatars in a shot must all belong
to demo records.

**One build per set.** Mixed shots from two builds look like a broken product.
When the panel's chrome changes — the top bar, the section tabs, the card styling —
every shot is retaken, not only the one whose page changed.

**Same frame every time.** 1440 × 900 CSS pixels at a device pixel ratio of 2, the
browser in dark mode, no browser chrome in the image, no scrollbar, nothing hovered
and nothing focused. The panel's own dark theme carries the shot.

**JPEG, quality 85**, under 350 KB each, under the file name the README already
references. Replacing a file is enough; the README needs no edit.

## The shots

| File | Route | What must be on screen |
|---|---|---|
| `home.jpg` | `/` | The start page with the link status up and several citizens on the server as cards. |
| `citizen-identity.jpg` | a citizen → Identity | Employer and rank, all four licences, name and phone number. |
| `citizen-money.jpg` | a citizen → Money | The cash and bank transaction form beside the citizen's bank accounts, at least one company account among them. |
| `citizen-assets.jpg` | a citizen → Assets | The inventory with its weight bar beside the vehicle list, with one vehicle in each state: in garage, out, impounded. |
| `server-bans.jpg` | Server → Bans | Both record sources in one list, in-force bans first, at least one txAdmin row and one database row with a Veritas reference. |
| `server-organisations.jpg` | Server → Organisations | Jobs and gangs with balances, member counts and grades. |
| `permissions.jpg` | Permissions | The permission grid with every role column and several areas expanded. |
| `veritas-id-characters.jpg` | `/id` | A player's characters with job, cash and bank. |
| `veritas-id-character.jpg` | `/id` → one character | Papers, work, money, licences and condition on one page. |

## Status

The set in this folder was taken on 2026-09-28 and is **out of date**. The panel has
changed in ways that are visible in every one of the nine, because they all include
the top bar:

- The bridge status reads `Link up · N on server`, and `Link status unknown` where the
  bridge cannot be reached. The shots still say `LIVE LINK · 7 ON SERVER`.
- The signed-in role moved into the account menu (`SessionMenu`); the shots show it as
  a separate pill next to the name.
- The inventory was rebuilt as an editor-style workspace with five slot columns.
- Bans gained a history, a Veritas reference per ban, and a drawer on the character
  header.
- Explanatory copy was cut back across the panel, so several of the sentences in the
  shots no longer exist.
