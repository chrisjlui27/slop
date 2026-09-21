# Vendored fonts

Both faces used to be fetched from `fonts.googleapis.com` at boot. That works
online and fails in exactly the situation this game is built for: an installed
PWA opened on a phone with the radio off, which then renders the entire arcade
UI in the fallback monospace. The Google stylesheet was never in `sw.js`'s
`SHELL` — it could not be, it is cross-origin and versioned — so nothing
cached it and nothing reported it missing.

They are files in the repo now, listed in `SHELL` like any other shell asset.

| File | Family | Licence |
|---|---|---|
| `press-start-2p-latin.woff2` | Press Start 2P — CodeMan38 | SIL Open Font License 1.1 |
| `space-grotesk-latin.woff2` | Space Grotesk — Florian Karsten | SIL Open Font License 1.1 |

Both are the `latin` subsets Google Fonts serves (27 KB together). `OFL.txt`
is the licence both are released under; it requires that the notice travel
with the files, which is what this directory is.

To refresh one, request the CSS with a browser user agent, take the `latin`
`@font-face`'s woff2 URL, and replace the file in place — the `@font-face`
rules in `styles/main.css` point at these paths and do not change.
