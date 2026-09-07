# Getting SLOP onto the phone

The target is an installed Android app: an icon on the home screen that opens
fullscreen with no browser chrome and runs with the radio off. That needs
HTTPS, because a service worker only registers in a secure context — `file://`
and a plain LAN address both give you a web page instead.

GitHub Pages is free and is what `eldritch-garden` already uses, so SLOP takes
the same route.

## What is different here

Eldritch Garden ships as one self-contained `index.html`. SLOP ships as 30
files — ES modules, a stylesheet and three icons — served straight from the
repo root. Pages serves over HTTPS, so the browser loads the module graph
natively and **no build step is involved in deploying**. `tools/build.js` still
exists for producing a single portable `dist/slop.html`, but that is a
distribution convenience, not part of shipping to the phone.

The consequence is that `sw.js` has a list of 30 files that must match what is
on disk. Run this before every deploy:

```bash
npm run check:shell
```

It fails loudly if a module was added, renamed or removed without updating
`SHELL`. That check matters because the failure is otherwise silent — the
install handler swallows per-entry errors on purpose, so a missing file yields
a worker that installs happily and then cannot open the game offline.

## One-time setup

**1. Install the GitHub CLI.** It is not currently on this machine:

```bash
winget install --id GitHub.cli
```

Then open a new terminal so `gh` is on `PATH`.

**2. Log it in.**

```bash
gh auth login
```

Choose *GitHub.com* → *HTTPS* → *Login with a web browser*. It prints a one-time
code, opens a browser, and you approve it there.

Do this yourself. Nobody else should be handling your credentials, and there is
no step in this file where a token needs to be pasted into a chat.

**3. Publish.** From this folder:

```bash
gh repo create slop --public --source=. --remote=origin --push
```

**4. Turn on Pages.**

```bash
gh api --method POST /repos/:owner/slop/pages -f "source[branch]=main" -f "source[path]=/"
```

Or click it: repo → Settings → Pages → Source: *Deploy from a branch* → `main` /
`(root)`.

The site appears at `https://<username>.github.io/slop/` within a minute or two.

**Note:** Pages on a free account requires the repo to be public.

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

## Checking the service worker

**It has not been observed installing.** It parses, and all 30 `SHELL` entries
resolve over HTTP, both verified. But registration fails in the browser this
project has been developed in — `An unknown error occurred when fetching the
script`, with the script itself returning 200 and the correct
`text/javascript` content type. That is an environment restriction, not a
defect in the file, and it is the same wall `eldritch-garden` hit.

So the first run on a real device is the first real test:

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

There is no Python or Node on this machine, so `npm run dev` will not run.
Use the PowerShell server instead — it needs nothing installed:

```bash
npm run dev:win
```

Then open <http://localhost:8000/>.
