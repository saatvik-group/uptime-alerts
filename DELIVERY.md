# How a change goes from idea to live

The same file in every app repo (shared, see tools/shared-files.json). It sits beside ENGINEERING-STANDARD.md, which says how the apps are built. This file says how each change is delivered.

## The steps

| # | Step | What is done | Where it is recorded |
|---|---|---|---|
| 1 | Requirements and design | The change is written into SPEC.md first: what it does, who uses it, unusual cases, and the checks that show it is done. Data, security, speed and accessibility needs are noted. If parts or links change, ARCHITECTURE.md is updated too | docs/SPEC.md, docs/ARCHITECTURE.md |
| 2 | Set-up | A new branch from main, named for the change. A new feature sits behind a switch (src/switches.js), off on the live copy | Branch name, FEATURES setting |
| 3 | Build | The app's own modules and the shared parts are reused. No file grows past about 400 lines without being split. Errors go to the watchtower (src/report-error.js) | Code |
| 4 | Testing, while building | Unit checks; whole-app checks; access checks (one person cannot open another's records); bad input, timeouts and missing data; the full suite again (nothing old broken); every screen at desktop and phone width; accessibility (labels, keyboard, contrast); package and secrets scans; a load test before first real use | docs/TESTS.md, with dates and results of real runs only |
| 5 | Checking with users (optional) | The feature is switched on for the test copy or for named people. The "feedback" switch adds a Feedback button, and notes are kept in the app's own database for the owner | Feedback notes, SPEC.md |
| 6 | Pull request | The branch is pushed and a pull request opened with the checklist (.github/pull_request_template.md): what, why, how tested, screenshots, documents updated | GitHub |
| 7 | Automatic checks | Cloudflare builds the change and runs the must-pass checks; if one fails, nothing goes live. GitHub Actions runs the lighter checks while free minutes last | Build log |
| 8 | Review | A fresh reviewer reads the change for mistakes, security and clarity. Comments are fixed and checked again | Pull request |
| 9 | Before going live | Merged only when every check passes. The change goes to the test copy first (preview branch) and is checked there in a browser | Test copy |
| 10 | Release | Merged to main, which goes live through Cloudflare. A risky feature is released to a share of people by its switch: 5%, then 25%, then everyone. To undo: switch it off, or return to Cloudflare's previous version | docs/RELEASES.md |
| 11 | After release | Errors, speed and use are watched (watchtower status page, health page, feedback). Problems are fixed. The switch is removed once the feature has been stable for a week | docs/RELEASES.md, go-live checklist |

## Switches and release to a share

Switches are kept in one Cloudflare setting, FEATURES, written as JSON:

```json
{ "feedback": { "on": true },
  "new-voice": { "on": true, "percent": 25, "copies": ["preview"], "people": ["7"] } }
```

| Field | Meaning |
|---|---|
| on | Must be true, or the feature is off for everyone. Off always wins |
| percent | Share of signed-in people who get it, 0 to 100 (100 if left out). The same person always gets the same answer |
| copies | Only these copies of the app, such as "preview". Left out: every copy |
| people | These account numbers always get it, whatever the share |

A broken setting turns every switch off rather than stopping the app. The page asks GET /api/switches which switches are on for the person using it. Changing a switch needs no new code: the setting is changed in Cloudflare and the change is noted in RELEASES.md.

## Branches

| Branch | Use |
|---|---|
| main | The live copy. Changes arrive only through pull requests that passed their checks |
| preview | The test copy. Each change is checked here before main |
| one branch per change | Deleted once merged |

## Cost

The free GitHub plan is used. It cannot lock main on private repositories, so the rule above is followed by hand and the must-pass checks run inside Cloudflare's build. The paid GitHub Team plan (about $4 a month) adds the lock and more check time, and is worth taking when other developers join.
