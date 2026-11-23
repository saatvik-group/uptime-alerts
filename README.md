# Uptime alerts

**Start here:** [How the app is put together (diagrams)](ARCHITECTURE.md) · [How a change goes live](DELIVERY.md)

Sends an email within about 5–10 minutes when one of the apps stops answering, and another when it is back.

## How it works

- Every 5 minutes a GitHub Actions run reads the public status list at
  https://watchtower.monad-group.workers.dev/status.json (app name, up or down, since when).
- An app counts as down only when two reads, 2.5 minutes apart, both say so.
- When an app is down, an issue "DOWN: <app>" is opened. GitHub emails everyone watching this repository.
- While the app stays down, nothing more is written, so no more emails.
- When the app is back, the issue gets the comment "Back up" and is closed (one more email).
- If the status list cannot be read twice in a row, or is more than 20 minutes old, the issue is "DOWN: watchtower".
- On the 1st of each month a dated line is added to `KEEPALIVE.md`, so GitHub does not turn off the schedule.

The repository is public so that GitHub Actions minutes are free. It holds no keys, no data and nothing private:
only app names and the public status address.

## To get the emails

The owner's account must watch this repository with **Watching: All activity** (the Watch button at the top of
the repository page), and GitHub email notifications must be on (Settings, Notifications, "Watching": Email).

## To try it

Actions, "uptime", "Run workflow", tick "Add a made-up app test-app that is down". An issue "DOWN: test-app"
opens. The next 5-minute run closes it with "Back up".
