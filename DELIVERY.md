# How a change goes live

This repository is a small tool, not an app. It has no build, no test copy, no switches and no test suite. It is one
script (`check.mjs`) and one GitHub Actions file (`.github/workflows/uptime.yml`).

## The steps

| # | Step | What is done |
|---|---|---|
| 1 | Change | The change is made on its own branch, named for the change |
| 2 | Try it | Actions, "uptime", "Run workflow" on that branch, with "Add a made-up app test-app that is down" ticked. An issue "DOWN: test-app" should open, and the next run should close it |
| 3 | Pull request | The branch is pushed and a pull request opened: what changes, why, how it was tried |
| 4 | Review | A fresh reviewer reads the change. Nothing private may be added: this repository is public |
| 5 | Live | Once merged to main, the next 5-minute run uses the new version. There is nothing to build or deploy |
| 6 | Undo | Revert the merge on main. The next run goes back to the old version |

## What must never be added

This repository is public. It must never hold keys, passwords, personal details, private addresses or any data.
It reads only the public status list and app names.

## Cost

Free. Public repositories get free GitHub Actions minutes.
