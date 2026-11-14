// Reads the watchtower's public status list and keeps one GitHub issue per app that is down.
// GitHub emails the repository's watchers when an issue opens, so a down app becomes an email within minutes.
//   - an app is down only when two reads, 2.5 minutes apart, both say so (this avoids alerts for a short blip);
//   - while it stays down nothing more is written, so no further emails;
//   - when it answers again the issue gets the comment "Back up" and is closed.
// If the status list itself cannot be read twice in a row, or has not been refreshed for 20 minutes, the issue is
// "DOWN: watchtower". Nothing private is used: only the public status address and app names.
const STATUS = 'https://watchtower.monad-group.workers.dev/status.json';
const GAP_MS = 150000;           // wait between the two reads
const STALE_MS = 20 * 60000;     // the watchtower checks every 5 minutes; older than this means it has stopped
const { GITHUB_TOKEN, GITHUB_REPOSITORY, TEST } = process.env;
const url = TEST === 'true' ? `${STATUS}?test=down` : STATUS;

async function read() {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { 'cache-control': 'no-cache' } });
    if (!r.ok) return { ok: false, why: `the status list answered ${r.status}` };
    const s = await r.json();
    if (!s.checked || Date.now() - Date.parse(s.checked) > STALE_MS) return { ok: false, why: 'the watchtower has not checked the apps for over 20 minutes' };
    return { ok: true, down: new Set(s.apps.filter((a) => a.up === false).map((a) => a.name)), up: new Set(s.apps.filter((a) => a.up === true).map((a) => a.name)), since: Object.fromEntries(s.apps.map((a) => [a.name, a.since])) };
  } catch (e) { return { ok: false, why: 'the status list could not be read' }; }
}

async function gh(method, path, body) {
  const r = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}${path}`, {
    method, body: body && JSON.stringify(body),
    headers: { authorization: `Bearer ${GITHUB_TOKEN}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' },
  });
  if (!r.ok) throw new Error(`GitHub answered ${r.status} to ${method} ${path}`);
  return r.status === 204 ? null : r.json();
}

const first = await read();
const needSecond = !first.ok || first.down.size > 0;
const second = needSecond ? (await new Promise((res) => setTimeout(res, GAP_MS)), await read()) : first;

// what is down now: apps down in both reads, plus the watchtower when neither read worked
const downNow = new Map();
if (first.ok && second.ok) for (const n of first.down) if (second.down.has(n)) downNow.set(n, `${n} is not answering (since ${second.since[n] || 'unknown'}).`);
if (!first.ok && !second.ok) downNow.set('watchtower', `The watchtower status list is not working: ${second.why}. Apps cannot be checked until it is back.`);
// what is up now: needs a good latest read
const latest = second.ok ? second : first.ok ? first : null;

const open = await gh('GET', '/issues?state=open&labels=down&per_page=100');
const openByApp = new Map(open.filter((i) => i.title.startsWith('DOWN: ')).map((i) => [i.title.slice(6), i]));

for (const [name, text] of downNow) {
  if (openByApp.has(name)) continue; // already open: say nothing more
  await gh('POST', '/issues', { title: `DOWN: ${name}`, labels: ['down'], body: `${text}\n\nStatus page: https://watchtower.monad-group.workers.dev/status\n\nThis issue closes itself when ${name} is back.` });
  console.log(`Opened: DOWN: ${name}`);
}
if (latest) {
  for (const [name, issue] of openByApp) {
    if (downNow.has(name)) continue;
    // back when the app shows as up, or is no longer listed (a test app, or an app taken off the list);
    // the watchtower is back as soon as a read works
    const back = name === 'watchtower' ? true : latest.up.has(name) || (!latest.down.has(name) && !(name in latest.since));
    if (!back) continue;
    await gh('POST', `/issues/${issue.number}/comments`, { body: 'Back up' });
    await gh('PATCH', `/issues/${issue.number}`, { state: 'closed' });
    console.log(`Closed: DOWN: ${name}`);
  }
}
console.log(`Down now: ${[...downNow.keys()].join(', ') || 'none'}`);
