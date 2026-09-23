# Getting SLOP onto the phone

The target is an installed Android app: an icon on the home screen that opens
fullscreen with no browser chrome and runs with the radio off. That needs
HTTPS, because a service worker only registers in a secure context — `file://`
and a plain LAN address both give you a web page instead.

GitHub Pages is free and is what `eldritch-garden` already uses, so SLOP takes
the same route.

## What is different here

Eldritch Garden ships as one self-contained `index.html`. SLOP ships as 54
files — ES modules, a stylesheet and three icons — served straight from the
repo root. Pages serves over HTTPS, so the browser loads the module graph
natively and **no build step is involved in deploying**. `tools/build.js` still
exists for producing a single portable `dist/slop.html`, but that is a
distribution convenience, not part of shipping to the phone.

The consequence is that `sw.js` has a list of 54 files that must match what is
on disk. Run this before every deploy:

```bash
npm run check:shell
```

It fails loudly if a module was added, renamed or removed without updating
`SHELL`. The same check runs inside `npm test` as `tools/check-shell.js`, so it
no longer waits for a deploy — or a phone losing signal — to be noticed. That check matters because the failure is otherwise silent — the
install handler swallows per-entry errors on purpose, so a missing file yields
a worker that installs happily and then cannot open the game offline.

## It is already set up

**Live at <https://chrisjlui27.github.io/slop/>** — repo `chrisjlui27/slop`,
public, Pages serving `main` at `/`. Nothing below needs doing again; it is
kept as the record of how, and for the next project.

<details>
<summary>How it was set up (one time)</summary>

```bash
winget install --id GitHub.cli     # then open a new terminal for PATH
gh auth login                      # GitHub.com → HTTPS → browser
gh repo create slop --public --source=. --remote=origin --push
gh api --method POST /repos/:owner/slop/pages -f "source[branch]=main" -f "source[path]=/"
```

`gh auth login` is yours to run. Nobody else should be handling your
credentials, and there is no step here where a token gets pasted into a chat.

Pages on a free account requires the repo to be public.

</details>

## Installing it

On the phone, open that URL in Chrome, then menu → **Add to Home screen**.

You should get an icon rather than a bookmark, and it should open fullscreen
with no address bar. If it opens in a tab with browser chrome, the service
worker did not register — see below.

## Shipping a change

```bash
npm run check:shell
git add -A && git commit -m "..." && git push
```

Pages redeploys in a minute. **Bump `CACHE` in `sw.js` for any change to any
shell file.** Navigations are network-first, so an online phone picks up a new
`index.html` immediately — but the modules are cache-first, and the constant is
the only thing that clears them. Ship without bumping it and a phone runs a new
document against old modules, which is a broken build rather than a stale one.

## The service worker

**Confirmed working on the live origin, as of the `slop-v6` generation.**
Verified at `https://chrisjlui27.github.io/slop/`: one registration, state
`activated`, scope `/slop/`, and every `SHELL` entry of that generation present
in the cache with `src/game.js` served out of it. Offline play is real, not
assumed.

That was a check of the worker, not of a particular build, and it does not
carry forward on its own: each deploy bumps `CACHE`, and what proves the new
generation installed is opening the live URL once online and then loading it
again with the network off. A container whose egress policy blocks
`*.github.io` cannot do that for you — Actions can confirm the deployment
succeeded, which is a different claim.

It never once registered during development — `An unknown error occurred when
fetching the script`, with the script itself returning 200 and the correct
`text/javascript` type. That was an environment restriction in the dev browser,
the same wall `eldritch-garden` hit, and not a defect in the file. Do not chase
it locally; check it on the deployed origin.

To re-check after a deploy:

1. Open the Pages URL on a desktop browser, or `chrome://inspect/#devices`
   with the phone attached.
2. DevTools → Application → Service Workers. It should read **activated and
   running**.
3. DevTools → Network → tick *Offline*, reload. The game should still come up.

If it fails, the game still works — you lose offline play and the install
prompt, not the campaign.

## Testing locally first

Service workers treat `http://localhost` as secure, so a local server is enough
to test everything except the phone itself.

Python is not installed, so `npm run dev` will not run. Use the PowerShell
server instead — it needs nothing beyond PowerShell:

```bash
npm run dev:win
```

Then open <http://localhost:8000/>.
