---
name: ship
description: Run SLOP's pre-deploy checklist and push to GitHub Pages. Use when asked to deploy, ship, publish, release, or push SLOP to the phone.
---

# Shipping SLOP

The target is an installed Android PWA on GitHub Pages. `DEPLOY.md` has the
one-time setup; this is the every-time path.

## Before pushing

**1. The offline file list must match disk.**

```bash
npm run check:shell
```

Non-zero exit means `sw.js`'s `SHELL` has drifted — a module added, renamed or
removed without updating it. Fix `SHELL`, do not skip the check. The failure it
prevents is silent: the app works online and cannot open offline.

**2. Bump `CACHE` in `sw.js` if any shell file changed.**

`slop-v1` → `slop-v2`, and so on. Modules are cache-first with no background
refresh, so this constant is the only thing that retires the old generation. A
push without it leaves phones running a new `index.html` against old modules,
which is a broken build rather than a stale one.

Skip the bump only when the change touched nothing in `SHELL` — a doc, a
comment in a tool script.

**3. Run the campaign test, then play it.**

```bash
npm test
```

It plays every act to victory in jsdom. Then open the game — Python is not
installed, so use the PowerShell server:

```bash
npm run dev:win
```

Confirm at minimum: it boots, a round starts and resolves, and CONTINUE appears
on the title screen after a round has been completed.

## Pushing

```bash
git add -A && git commit -m "..." && git push
```

Pages redeploys in about a minute at `https://<username>.github.io/slop/`.

## After

The service worker was confirmed activated on the live origin, with every
SHELL entry cached. It has never once registered in the dev browser, which is
an environment restriction, not a defect — do not chase it locally. The live
origin is where it is checked. Do not report offline support as working on a
green `check:shell`; that checks the list, not the worker.

Verify on the deployed URL: DevTools → Application → Service Workers should
read *activated and running*, and the app should still load with Network set to
Offline.

## Never

Do not run `gh auth login` or handle the user's GitHub credentials. If auth is
missing, point at `DEPLOY.md` and let them do it.
