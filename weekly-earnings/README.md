# Weekly Earnings — iPhone web app

An offline earnings calculator with no account, server, API, analytics or external runtime dependencies. Static HTML/CSS/JavaScript; deploy this directory as-is.

## Install on an iPhone

After GitHub Pages is enabled, open https://erjon11.github.io/website/weekly-earnings/ in Safari. Tap Share → Add to Home Screen → Add. Open the app from the new icon while online once and wait for **Offline ready**. It then loads and saves entries offline. HTTPS is required outside localhost. No Apple developer membership or signing renewals are needed.

Set Dual, Single and Site investigation rates. Add quantities for today or earlier dates. Review Monday–Sunday weeks and calendar-month totals. Entries retain the rate used when added; changing a rate does not rewrite history. Delete and re-add an entry to correct it.

## Enable GitHub Pages

In erjon11/website, open Settings → Pages. Under Build and deployment choose **Deploy from a branch**, select **master**, choose **/(root)**, and Save. Wait for GitHub to finish publishing. The existing homepage remains at /website/; this app is at /website/weekly-earnings/. If this repository already has Pages enabled from master/root, new commits publish automatically. An organisation or account policy may require additional approval.

## Records and backups

Data stays in this browser's local storage under `weekly-earnings-v1`; GitHub hosts only application files, never your entries. Export a backup regularly from Settings. On iPhone choose Save to Files in the share sheet. Restore a backup to move devices; restoration requires confirmation and replaces the current records. Switching from browser to Home Screen can use a separate storage context on some iOS versions: export from the old context and restore in the installed app if needed.

Clearing website data, private browsing, device loss, or removing the app can lose records. This version does not sync across devices. Failed saves retain the existing state; unreadable records are preserved and writes are disabled, with a raw recovery download offered.

The restore function accepts the native SwiftUI app's `earnings.json` too. The native app has no export button: connect the iPhone to Xcode → Window → Devices and Simulators → select the device and app → Download Container. Find Library/Application Support/WeeklyEarnings/earnings.json inside the container, transfer it to Files, then restore it here. Native timestamps use the importing device's local timezone for calendar dates.

## Development and validation

No build or dependency installation is needed to run the app:

```sh
cd /workspace/website
python3 -m http.server 8090 --bind 127.0.0.1
```

For calculation and backup tests (Node 20+):

```sh
cd weekly-earnings
node --test tests/core.test.mjs
```

For the mobile-browser smoke test, keep the local server running. Playwright must be installed; it is only a development dependency and not shipped to the browser:

```sh
npm install --no-package-lock
npx playwright install chromium
npm run test:browser
```

The smoke test exercises setup, registration of the offline worker, quantities, rate snapshots, backdating, month boundaries, deletion confirmation, export/restore, invalid imports, offline reload and reopening, storage failure and corrupt-record preservation. It uses an isolated browser profile and a fixed date. Set BASE_URL for a different server and BROWSER_PATH for an existing Chromium executable.

Automated browser validation was performed in Chromium at an iPhone-sized viewport. Real Safari/Home Screen installation still needs testing on an iPhone.

## Updates

Increment the cache version in sw.js whenever shell files change. Include every runtime file in FILES so the install is atomic. Updates wait until old tabs close to prevent mixing app versions. Close all app windows/tabs and reopen online to activate an update. App updates do not clear local records. This worker only handles requests within its own directory, preserving the existing website.
