#!/usr/bin/env node
/**
 * map-me — build the comprehension map out of ship-me's own artifacts.
 *
 * It invents nothing. Every node and every edge is already written down in
 * the four markdown files the pipeline produces:
 *
 *   grill-me   R-numbers                          -> requirement nodes
 *   solve-me   Sub-problem N, Option X, Recommended -> sub-problem + option nodes
 *   build-me   Commit N, Serves/Builds/Touches    -> commit + file nodes
 *              Unplanned:                         -> unplanned-decision nodes
 *   verify-me  Requirements coverage table        -> status on requirements
 *
 * Files are global: they are NOT namespaced by slug. That is deliberate —
 * it is the only way a file touched by three separate runs shows up as one
 * node, which is the whole point of looking across runs.
 *
 * Usage:
 *   node map-me.mjs [--docs docs] [--out docs/map] [--slug <slug>] [--quiet]
 *
 * Zero dependencies. Node 18+.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';

const USAGE = `map-me — build the comprehension map from ship-me artifacts

  node map-me.mjs [options]

  --docs <dir>   where the pipeline artifacts live      (default: docs)
  --out <dir>    where to write the map                 (default: <docs>/map)
  --slug <slug>  only map this one run
  --quiet        no stdout summary
  --help         this text

Writes an Obsidian-compatible vault of one note per node, a standalone
index.html graph, HOLES.md, and map.json.`;

const argv = process.argv.slice(2);
const has = (n) => argv.includes('--' + n);
function opt(name, dflt) {
  const i = argv.indexOf('--' + name);
  if (i < 0) return dflt;
  const v = argv[i + 1];
  return v && !v.startsWith('--') ? v : dflt;
}

if (has('help')) { console.log(USAGE); process.exit(0); }

const DOCS_ARG = opt('docs', 'docs');
const DOCS = resolve(DOCS_ARG);
const OUT = resolve(opt('out', join(DOCS_ARG, 'map')));
const ONLY = opt('slug', null);
const QUIET = has('quiet');

if (!existsSync(DOCS)) {
  console.error('map-me: no such directory: ' + DOCS_ARG);
  console.error('Run it from the project root, or pass --docs <dir>.');
  process.exit(1);
}

/* ------------------------------------------------------------------ *
 * reading
 * ------------------------------------------------------------------ */

function walk(dir, acc = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (resolve(p) === OUT) continue;
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'map' || e.name.startsWith('.')) continue;
      walk(p, acc);
    } else if (e.name.endsWith('.md')) {
      acc.push(p);
    }
  }
  return acc;
}

/** Classify by content, not by path — so it works on docs/ and on examples/. */
function classify(text) {
  if (/^##\s+Commit\s+\d/m.test(text)) return 'build';
  if (/^##\s+(?:Sub-?problem|Piece)\s+\d/mi.test(text)) return 'solution';
  if (/^##\s+Requirements coverage/mi.test(text)) return 'verification';
  if (/^##\s+Requirements \(copy-paste ready\)/mi.test(text)) return 'grilling';
  if (/^\s*[-*]\s*R\d+\s*[—–-]\s+/m.test(text)) return 'grilling';
  return null;
}

/** docs/<phase>/<slug>.md wins; otherwise the containing folder names the run. */
function slugOf(path) {
  const m = path.match(/\/(?:grilling|solutions|build|verification)\/([^/]+)\.md$/);
  if (m) return m[1];
  return basename(dirname(path));
}

/* ------------------------------------------------------------------ *
 * markdown helpers
 * ------------------------------------------------------------------ */

function blocks(text, depth) {
  const marker = '#'.repeat(depth) + ' ';
  const out = [];
  let cur = null;
  for (const line of text.split('\n')) {
    if (line.startsWith(marker)) {
      if (cur) out.push(cur);
      cur = { title: line.slice(marker.length).trim(), lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    }
  }
  if (cur) out.push(cur);
  return out.map((b) => ({ title: b.title, body: b.lines.join('\n') }));
}

const unbold = (s) => s.replace(/\*\*/g, '');
const isFieldLine = (plain) => /^\s*(?:[-*]\s*)?[A-Za-z][\w '/-]{0,30}\s*:\s/.test(plain);

/** Read `**Name:** value`, `- Name: value`, with wrapped continuation lines. */
function field(body, name) {
  const lines = body.split('\n');
  const re = new RegExp('^(\\s*)(?:[-*]\\s*)?' + name + '\\s*:\\s*(.*)$', 'i');
  for (let i = 0; i < lines.length; i++) {
    const m = unbold(lines[i]).match(re);
    if (!m) continue;
    const acc = m[2].trim() ? [m[2].trim()] : [];
    for (let j = i + 1; j < lines.length; j++) {
      const raw = lines[j];
      if (!raw.trim()) break;
      if (/^#{1,6}\s/.test(raw)) break;
      const plain = unbold(raw);
      if (isFieldLine(plain)) break;
      if (/^\s*[-*]\s/.test(raw)) break;
      acc.push(plain.trim());
    }
    return acc.join(' ').trim() || null;
  }
  return null;
}

/** Read a field whose value is a nested bullet list. null = field absent. */
function listField(body, name) {
  const lines = body.split('\n');
  const re = new RegExp('^(\\s*)(?:[-*]\\s*)?' + name + '\\s*:\\s*(.*)$', 'i');
  for (let i = 0; i < lines.length; i++) {
    const m = unbold(lines[i]).match(re);
    if (!m) continue;
    const indent = m[1].length;
    const items = [];
    const inline = m[2].trim();
    if (inline && !/^(none|n\/a|-)\.?$/i.test(inline)) items.push(inline);
    for (let j = i + 1; j < lines.length; j++) {
      const raw = lines[j];
      if (!raw.trim()) { if (items.length) break; else continue; }
      const bm = raw.match(/^(\s*)[-*]\s+(.*)$/);
      if (bm && bm[1].length > indent) { items.push(unbold(bm[2]).trim()); continue; }
      // a wrapped continuation line of the bullet above it
      const cm = raw.match(/^(\s*)(\S.*)$/);
      if (cm && items.length && cm[1].length > indent && !isFieldLine(unbold(raw))) {
        items[items.length - 1] += ' ' + unbold(cm[2]).trim();
        continue;
      }
      break;
    }
    return items;
  }
  return null;
}

const rIds = (s) => {
  if (!s) return [];
  const out = [];
  for (const m of s.matchAll(/\bR(\d+)\b/g)) if (!out.includes('R' + m[1])) out.push('R' + m[1]);
  return out;
};

const paths = (s) => {
  if (!s) return [];
  const out = [];
  for (const m of s.matchAll(/`([^`]+)`/g)) {
    const p = m[1].trim();
    if (p && !out.includes(p)) out.push(p);
  }
  return out;
};

/* ------------------------------------------------------------------ *
 * parsers — one per pipeline phase
 * ------------------------------------------------------------------ */

function parseGrilling(text) {
  const reqs = [];
  const seen = new Set();
  for (const m of text.matchAll(/^\s*[-*]\s*(R\d+)\s*[—–:-]\s*(.+)$/gm)) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    reqs.push({ id: m[1], text: unbold(m[2]).trim() });
  }
  let outOfScope = [];
  for (const depth of [3, 2]) {
    for (const b of blocks(text, depth)) {
      if (!/out of scope|do not touch|don't touch/i.test(b.title)) continue;
      outOfScope = b.body.split('\n')
        .map((l) => l.match(/^\s*[-*]\s+(.*)$/))
        .filter(Boolean).map((m) => unbold(m[1]).trim());
      if (outOfScope.length) break;
    }
    if (outOfScope.length) break;
  }
  return { reqs, outOfScope };
}

function parseSolution(text) {
  const subs = [];
  for (const b of blocks(text, 2)) {
    // "Piece" is the old name for a sub-problem; still read it so existing
    // solve-me files keep mapping.
    const m = b.title.match(/^(?:Sub-?problem|Piece)\s+(\d+[a-z]?)\s*[—–:-]\s*(.+)$/i);
    if (!m) continue;
    const sub = {
      n: m[1],
      title: m[2].trim(),
      serves: rIds(field(b.body, 'Serves')),
      recommended: null,
      why: field(b.body, 'Why'),
      options: [],
    };
    const rec = b.body.match(/Recommended:\s*Option\s+([A-Za-z])/i);
    if (rec) sub.recommended = rec[1].toUpperCase();
    for (const ob of blocks(b.body, 3)) {
      const om = ob.title.match(/^Option\s+([A-Za-z])\s*[—–:-]\s*(.+)$/i);
      if (!om) continue;
      sub.options.push({
        letter: om[1].toUpperCase(),
        title: om[2].trim(),
        rejected: field(ob.body, 'Rejected'),
        how: field(ob.body, 'How it works'),
      });
    }
    subs.push(sub);
  }
  return { subs };
}

function parseBuild(text) {
  const commits = [];
  for (const b of blocks(text, 2)) {
    const m = b.title.match(/^Commit\s+(\d+[a-z]?)\s*[—–:-]\s*(.+)$/i);
    if (!m) continue;
    const from = field(b.body, 'From');
    const builds = field(b.body, 'Builds');
    const touches = field(b.body, 'Touches');
    const fm = from && from.match(/(?:sub-?problem|piece)\s+(\d+[a-z]?)/i);
    const bm = builds && builds.match(/Option\s+([A-Za-z])\s+of\s+(?:sub-?problem|piece)\s+(\d+[a-z]?)/i);
    const files = paths(touches);
    commits.push({
      n: m[1],
      title: m[2].trim(),
      sub: fm ? fm[1] : bm ? bm[2] : null,
      option: bm ? bm[1].toUpperCase() : null,
      serves: rIds(field(b.body, 'Serves')),
      why: field(b.body, 'Why we need it'),
      doneWhen: field(b.body, 'Done when'),
      touchesRaw: touches,
      files,
      // no backticked paths at all = still the plan's prose, never resolved
      filesResolved: files.length > 0,
      unplanned: listField(b.body, 'Unplanned'),
    });
  }
  return { commits };
}

function parseVerification(text) {
  const coverage = {};
  for (const m of text.matchAll(/^\|\s*(R\d+)\b([^|]*)\|([^|]*)\|([^|]*)\|/gm)) {
    const result = m[4];
    coverage[m[1]] = {
      by: m[3].trim(),
      status: /✅/.test(result) ? 'verified' : /❌/.test(result) ? 'failed' : 'skipped',
      note: result.replace(/[✅❌—–-]/g, '').trim(),
    };
  }
  let problems = [];
  for (const b of blocks(text, 2)) {
    if (!/problems found/i.test(b.title)) continue;
    problems = b.body.split('\n')
      .map((l) => l.match(/^\s*[-*]\s+(.*)$/))
      .filter(Boolean).map((m) => unbold(m[1]).trim());
  }
  return { coverage, problems };
}

/* ------------------------------------------------------------------ *
 * collect
 * ------------------------------------------------------------------ */

const runs = new Map();
const sources = [];

for (const path of walk(DOCS)) {
  let text;
  try { text = readFileSync(path, 'utf8'); } catch { continue; }
  const phase = classify(text);
  if (!phase) continue;
  const slug = slugOf(path);
  if (ONLY && slug !== ONLY) continue;
  if (!runs.has(slug)) runs.set(slug, { slug, files: {} });
  const run = runs.get(slug);
  if (run.files[phase]) continue; // first file of a phase wins
  const rel = path.startsWith(process.cwd()) ? path.slice(process.cwd().length + 1) : path;
  run.files[phase] = rel;
  sources.push({ slug, phase, path: rel });
  if (phase === 'grilling') Object.assign(run, parseGrilling(text));
  if (phase === 'solution') Object.assign(run, parseSolution(text));
  if (phase === 'build') Object.assign(run, parseBuild(text));
  if (phase === 'verification') Object.assign(run, parseVerification(text));
}

if (runs.size === 0) {
  console.error('map-me: found no ship-me artifacts under ' + DOCS_ARG);
  console.error('Expected files written by /grill-me, /solve-me, /build-me or /verify-me.');
  process.exit(1);
}

/* ------------------------------------------------------------------ *
 * graph
 * ------------------------------------------------------------------ */

const nodes = new Map();
const edges = [];
const holes = [];

const addNode = (n) => { if (!nodes.has(n.id)) nodes.set(n.id, n); return nodes.get(n.id); };
const addEdge = (from, to, type, label) => {
  if (!nodes.has(from) || !nodes.has(to)) return;
  edges.push({ from, to, type, label: label || null });
};
const hole = (kind, slug, node, text) => holes.push({ kind, slug, node: node || null, text });

for (const run of runs.values()) {
  const S = run.slug;
  const reqs = run.reqs || [];
  const subs = run.subs || [];
  const commits = run.commits || [];
  const coverage = run.coverage || {};
  const hasVerification = Boolean(run.files.verification);

  addNode({ id: S, kind: 'run', slug: S, label: S, phases: Object.keys(run.files), files: run.files });

  for (const r of reqs) {
    const cov = coverage[r.id];
    addNode({
      id: S + ':' + r.id, kind: 'requirement', slug: S, label: r.id,
      title: r.text,
      status: cov ? cov.status : hasVerification ? 'uncovered' : 'unverified',
      verifiedBy: cov ? cov.by : null,
    });
    addEdge(S + ':' + r.id, S, 'in-run');
  }

  for (const p of subs) {
    const pid = S + ':S' + p.n;
    addNode({
      id: pid, kind: 'subproblem', slug: S, label: 'S' + p.n, title: p.title,
      why: p.why, recommended: p.recommended,
    });
    addEdge(pid, S, 'in-run');
    for (const r of p.serves) addEdge(pid, S + ':' + r, 'serves');
    if (p.serves.length === 0) hole('subproblem-serves-nothing', S, pid, 'Sub-problem ' + p.n + ' names no requirement it serves.');
    for (const o of p.options) {
      const oid = pid + '.' + o.letter;
      const chosen = p.recommended === o.letter;
      addNode({
        id: oid, kind: 'option', slug: S, label: 'S' + p.n + '.' + o.letter,
        title: o.title, chosen, rejected: o.rejected, how: o.how,
      });
      addEdge(oid, pid, chosen ? 'chosen' : 'rejected', chosen ? p.why : o.rejected);
      if (!chosen && !o.rejected) {
        hole('unlabelled-rejection', S, oid,
          'Option ' + o.letter + ' of sub-problem ' + p.n + ' lost, but has no one-line **Rejected:** reason.');
      }
    }
    if (p.options.length && !p.recommended) {
      hole('no-recommendation', S, pid, 'Sub-problem ' + p.n + ' compares options but recommends none.');
    }
  }

  for (const c of commits) {
    const cid = S + ':C' + c.n;
    addNode({
      id: cid, kind: 'commit', slug: S, label: 'C' + c.n, title: c.title,
      why: c.why, doneWhen: c.doneWhen, touches: c.touchesRaw, files: c.files,
    });
    addEdge(cid, S, 'in-run');
    if (c.sub) addEdge(cid, S + ':S' + c.sub, 'from');
    if (c.option && c.sub) {
      const oid = S + ':S' + c.sub + '.' + c.option;
      addEdge(cid, oid, 'builds');
      const opt = nodes.get(oid);
      if (opt && opt.chosen === false) {
        hole('built-a-rejected-option', S, cid,
          'Commit ' + c.n + ' builds option ' + c.option + ' of sub-problem ' + c.sub +
          ', which the solution rejected. Either the gate was bypassed or the solution file is stale.');
      }
    }
    for (const r of c.serves) addEdge(cid, S + ':' + r, 'serves');
    if (c.serves.length === 0) {
      hole('commit-serves-nothing', S, cid,
        'Commit ' + c.n + ' names no requirement. build-me forbids this; nothing checked it afterwards.');
    }
    if (!c.doneWhen) {
      hole('no-falsifier', S, cid, 'Commit ' + c.n + ' has no **Done when:** — nothing states how you would know it is wrong.');
    }
    if (!c.filesResolved) {
      hole('unresolved-touches', S, cid,
        'Commit ' + c.n + ' still has the plan’s prose in **Touches:** instead of real paths. ' +
        'It cannot be linked to any file.');
    }
    for (const f of c.files) {
      addNode({ id: 'file:' + f, kind: 'file', slug: null, label: f, path: f });
      addEdge(cid, 'file:' + f, 'touches');
    }
    if (c.unplanned === null) {
      hole('unplanned-not-recorded', S, cid,
        'Commit ' + c.n + ' never recorded an **Unplanned:** line. Either nothing was decided mid-build, or it was decided and lost.');
    } else {
      c.unplanned.forEach((u, i) => {
        const uid = cid + ':U' + (i + 1);
        addNode({ id: uid, kind: 'unplanned', slug: S, label: 'C' + c.n + '.U' + (i + 1), title: u });
        addEdge(uid, cid, 'decided-during');
        hole('unplanned-decision', S, uid, 'Commit ' + c.n + ': ' + u);
      });
    }
  }

  // requirements that nothing builds / nothing proves
  for (const r of reqs) {
    const rid = S + ':' + r.id;
    const built = edges.some((e) => e.to === rid && e.type === 'serves' && nodes.get(e.from).kind === 'commit');
    if (!built && commits.length) {
      hole('requirement-not-built', S, rid, r.id + ' — "' + r.text + '" is served by no commit.');
    }
    const cov = coverage[r.id];
    if (hasVerification && !cov) {
      hole('requirement-not-covered', S, rid, r.id + ' is missing from the verification coverage table.');
    } else if (cov && cov.status === 'failed') {
      hole('requirement-failed', S, rid, r.id + ' failed verification' + (cov.note ? ' — ' + cov.note : '') + '.');
    } else if (cov && cov.status === 'skipped') {
      hole('requirement-skipped', S, rid, r.id + ' was skipped during verification' + (cov.note ? ' — ' + cov.note : '') + '.');
    } else if (!hasVerification && commits.length) {
      hole('run-not-verified', S, rid, r.id + ' has been built but never verified — no /verify-me file for this run.');
    }
  }

  for (const phase of ['grilling', 'solution', 'build', 'verification']) {
    if (!run.files[phase]) {
      hole('phase-missing', S, S, 'This run has no ' + phase + ' artifact.');
    }
  }
}

// cross-run hubs: the payoff of not namespacing file nodes
for (const n of nodes.values()) {
  if (n.kind !== 'file') continue;
  const touchers = edges.filter((e) => e.to === n.id && e.type === 'touches').map((e) => nodes.get(e.from));
  const runsTouching = [...new Set(touchers.map((t) => t.slug))];
  n.touchedBy = touchers.map((t) => t.id);
  n.runs = runsTouching;
  if (runsTouching.length > 1) {
    hole('cross-run-hub', null, n.id,
      n.path + ' is touched by ' + runsTouching.length + ' separate runs (' + runsTouching.join(', ') +
      '). Debt compounds here — this is where to spend review attention.');
  }
}

const HOLE_ORDER = [
  'requirement-failed', 'built-a-rejected-option', 'requirement-not-built', 'requirement-not-covered',
  'unplanned-decision', 'commit-serves-nothing', 'no-falsifier', 'requirement-skipped',
  'cross-run-hub', 'unresolved-touches', 'unplanned-not-recorded', 'run-not-verified',
  'no-recommendation', 'unlabelled-rejection', 'subproblem-serves-nothing', 'phase-missing',
];
holes.sort((a, b) => HOLE_ORDER.indexOf(a.kind) - HOLE_ORDER.indexOf(b.kind));

const holeNodes = new Set(holes.map((h) => h.node).filter(Boolean));
for (const n of nodes.values()) n.hole = holeNodes.has(n.id);

/* ------------------------------------------------------------------ *
 * emit — Obsidian vault
 * ------------------------------------------------------------------ */

function noteName(id) {
  const base = id.startsWith('file:')
    ? 'file--' + id.slice(5).replace(/\//g, '__')
    : id.replace(/:/g, '--');
  return base.replace(/[\\?%*<>|"]/g, '-');
}
const link = (id) => '[[' + noteName(id) + ']]';

const out = (...p) => join(OUT, ...p);
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const outgoing = (id) => edges.filter((e) => e.from === id);
const incoming = (id) => edges.filter((e) => e.to === id);

const HOLE_TEXT = {};
for (const h of holes) (HOLE_TEXT[h.node] ||= []).push(h.text);

function frontmatter(o) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(o)) {
    if (v === null || v === undefined) continue;
    if (Array.isArray(v)) {
      if (!v.length) continue;
      lines.push(k + ':');
      for (const item of v) lines.push('  - ' + JSON.stringify(String(item)));
    } else if (typeof v === 'boolean') {
      lines.push(k + ': ' + v);
    } else {
      lines.push(k + ': ' + JSON.stringify(String(v)));
    }
  }
  lines.push('---', '');
  return lines.join('\n');
}

for (const n of nodes.values()) {
  const body = [];
  const fm = { id: n.id, kind: n.kind, slug: n.slug, hole: n.hole };

  if (n.kind === 'run') {
    body.push('# Run — ' + n.label, '');
    body.push('| Phase | Artifact |', '|---|---|');
    for (const [phase, path] of Object.entries(n.files)) body.push('| ' + phase + ' | `' + path + '` |');
    body.push('');
    for (const [kind, plural] of [['requirement', 'requirements'],
                                 ['subproblem', 'sub-problems'], ['commit', 'commits']]) {
      const kids = [...nodes.values()].filter((x) => x.slug === n.slug && x.kind === kind);
      if (!kids.length) continue;
      body.push('## ' + plural, '');
      for (const k of kids) body.push('- ' + link(k.id) + ' — ' + (k.title || ''));
      body.push('');
    }
  }

  if (n.kind === 'requirement') {
    fm.status = n.status;
    body.push('# ' + n.label + ' — ' + n.title, '');
    body.push('**Status:** ' + n.status + (n.verifiedBy ? ' (' + n.verifiedBy + ')' : ''), '');
    const builtBy = incoming(n.id).filter((e) => e.type === 'serves' && nodes.get(e.from).kind === 'commit');
    const servedBy = incoming(n.id).filter((e) => e.type === 'serves' && nodes.get(e.from).kind === 'subproblem');
    body.push('**Designed in:** ' + (servedBy.map((e) => link(e.from)).join(', ') || '_nothing_'), '');
    body.push('**Built by:** ' + (builtBy.map((e) => link(e.from)).join(', ') || '_nothing_'), '');
    body.push('**Run:** ' + link(n.slug), '');
  }

  if (n.kind === 'subproblem') {
    body.push('# ' + n.label + ' — ' + n.title, '');
    if (n.why) body.push('**Why the chosen option won:** ' + n.why, '');
    const opts = incoming(n.id).map((e) => nodes.get(e.from)).filter((x) => x && x.kind === 'option');
    for (const o of opts) body.push('- ' + (o.chosen ? '**chosen** ' : 'rejected ') + link(o.id) + ' — ' + o.title);
    body.push('');
    body.push('**Serves:** ' + (outgoing(n.id).filter((e) => e.type === 'serves').map((e) => link(e.to)).join(', ') || '_nothing_'), '');
    body.push('**Run:** ' + link(n.slug), '');
  }

  if (n.kind === 'option') {
    fm.chosen = n.chosen;
    body.push('# ' + n.label + ' — ' + n.title, '');
    body.push(n.chosen ? '**Chosen.**' : '**Rejected.**', '');
    if (n.how) body.push('How it works: ' + n.how, '');
    if (n.rejected) body.push('Why it lost: ' + n.rejected, '');
    body.push('**Sub-problem:** ' + outgoing(n.id).map((e) => link(e.to)).join(', '), '');
    const builtBy = incoming(n.id).filter((e) => e.type === 'builds');
    if (builtBy.length) body.push('**Built by:** ' + builtBy.map((e) => link(e.from)).join(', '), '');
  }

  if (n.kind === 'commit') {
    body.push('# ' + n.label + ' — ' + n.title, '');
    if (n.why) body.push('**Why we need it:** ' + n.why, '');
    if (n.doneWhen) body.push('**Done when:** ' + n.doneWhen, '');
    body.push('**Serves:** ' + (outgoing(n.id).filter((e) => e.type === 'serves').map((e) => link(e.to)).join(', ') || '_nothing_'), '');
    const builds = outgoing(n.id).filter((e) => e.type === 'builds');
    if (builds.length) body.push('**Builds:** ' + builds.map((e) => link(e.to)).join(', '), '');
    const files = outgoing(n.id).filter((e) => e.type === 'touches');
    body.push('**Touches:** ' + (files.length ? files.map((e) => link(e.to)).join(', ') : '_' + (n.touches || 'nothing recorded') + '_'), '');
    const unplanned = incoming(n.id).filter((e) => e.type === 'decided-during');
    if (unplanned.length) body.push('**Decided mid-build:** ' + unplanned.map((e) => link(e.from)).join(', '), '');
    body.push('**Run:** ' + link(n.slug), '');
  }

  if (n.kind === 'unplanned') {
    body.push('# ' + n.label + ' — decided mid-build', '');
    body.push('> ' + n.title, '');
    body.push('Nobody approved this at a gate. It was decided while the code was being written.', '');
    body.push('**Commit:** ' + outgoing(n.id).map((e) => link(e.to)).join(', '), '');
  }

  if (n.kind === 'file') {
    fm.path = n.path;
    fm.runs = n.runs;
    body.push('# `' + n.path + '`', '');
    body.push('**Touched by ' + n.runs.length + ' run(s):** ' + n.runs.join(', '), '');
    for (const e of incoming(n.id)) {
      const c = nodes.get(e.from);
      body.push('- ' + link(c.id) + ' — ' + c.title + ' _(' + c.slug + ')_');
    }
    body.push('');
  }

  const mine = HOLE_TEXT[n.id];
  if (mine) {
    body.push('## Holes', '');
    for (const t of mine) body.push('- ' + t);
    body.push('');
  }

  writeFileSync(out(noteName(n.id) + '.md'), frontmatter(fm) + body.join('\n') + '\n');
}

/* ------------------------------------------------------------------ *
 * emit — HOLES.md, map.json, index.html
 * ------------------------------------------------------------------ */

const HOLE_TITLES = {
  'requirement-failed': 'Verified and failed',
  'built-a-rejected-option': 'Built an option the solution rejected',
  'requirement-not-built': 'Approved but never built',
  'requirement-not-covered': 'Built but never proven',
  'unplanned-decision': 'Decided mid-build, never approved at a gate',
  'commit-serves-nothing': 'Commit tied to no requirement',
  'no-falsifier': 'No "Done when" — nothing says how you would know it broke',
  'requirement-skipped': 'Skipped during verification',
  'cross-run-hub': 'Files where several runs collide',
  'unresolved-touches': 'Touches never resolved to real paths',
  'unplanned-not-recorded': 'No record of what was decided mid-build',
  'run-not-verified': 'Built, never verified',
  'no-recommendation': 'Options compared, none recommended',
  'unlabelled-rejection': 'Option rejected with no stated reason',
  'subproblem-serves-nothing': 'Sub-problem tied to no requirement',
  'phase-missing': 'Pipeline phase never run',
};

const md = ['# Holes', '',
  'Generated by `map-me`. These are the things the artifacts do **not** account for.',
  'The structure is readable in the four markdown files; this is the part that is not.', ''];
if (!holes.length) md.push('_No holes found._', '');
let lastKind = null;
for (const h of holes) {
  if (h.kind !== lastKind) {
    lastKind = h.kind;
    md.push('## ' + (HOLE_TITLES[h.kind] || h.kind), '');
  }
  md.push('- ' + (h.node ? '[[' + noteName(h.node) + ']] — ' : '') + h.text);
  if (h === holes[holes.length - 1] || holes[holes.indexOf(h) + 1].kind !== h.kind) md.push('');
}
writeFileSync(out('HOLES.md'), md.join('\n'));

const index = ['# Map', '',
  'One note per node. Open this folder as an Obsidian vault and use the graph view,',
  'or open `index.html` in a browser.', '',
  '- [[HOLES]] — ' + holes.length + ' hole(s)', ''];
for (const run of runs.values()) {
  index.push('## ' + link(run.slug), '');
  for (const [phase, path] of Object.entries(run.files)) index.push('- ' + phase + ': `' + path + '`');
  index.push('');
}
writeFileSync(out('_index.md'), index.join('\n'));

const data = { generated: new Date().toISOString(), nodes: [...nodes.values()], edges, holes, sources };
writeFileSync(out('map.json'), JSON.stringify(data, null, 2));

const HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Comprehension map</title>
<style>
:root{--bg:#fbfaf8;--fg:#1c1b19;--dim:#6b6a67;--line:#dcd9d4;--panel:#fff}
@media(prefers-color-scheme:dark){:root{--bg:#16151a;--fg:#e9e7e3;--dim:#8f8d89;--line:#2f2d33;--panel:#1e1d23}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 ui-sans-serif,-apple-system,Segoe UI,Roboto,sans-serif;overflow:hidden}
#wrap{display:flex;height:100vh}
#side{width:320px;flex:none;border-right:1px solid var(--line);padding:16px;overflow-y:auto;background:var(--panel)}
#stage{flex:1;position:relative}
canvas{display:block;cursor:grab}
canvas.drag{cursor:grabbing}
h1{font-size:15px;margin:0 0 4px}
h2{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--dim);margin:20px 0 8px;font-weight:600}
.sub{color:var(--dim);font-size:12px;margin:0 0 16px}
label{display:flex;align-items:center;gap:8px;padding:3px 0;cursor:pointer;font-size:13px}
.dot{width:10px;height:10px;border-radius:50%;flex:none}
input[type=search]{width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--fg);font:inherit}
#detail{font-size:13px}
#detail .t{font-weight:600;margin-bottom:6px}
#detail .k{color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:.06em}
#detail ul{margin:6px 0;padding-left:18px}
#detail li{margin:2px 0}
.hole{color:#c2410c}
@media(prefers-color-scheme:dark){.hole{color:#fb923c}}
.badge{display:inline-block;padding:1px 6px;border-radius:99px;border:1px solid var(--line);font-size:11px;color:var(--dim)}
#legend small{color:var(--dim)}
</style></head><body>
<div id="wrap">
<div id="side">
  <h1>Comprehension map</h1>
  <p class="sub" id="counts"></p>
  <input type="search" id="q" placeholder="filter nodes...">
  <h2>Show</h2>
  <div id="legend"></div>
  <label style="margin-top:8px"><input type="checkbox" id="onlyholes"> only nodes with holes</label>
  <h2>Selected</h2>
  <div id="detail"><span class="sub">Click a node.</span></div>
  <h2 id="holeshead">Holes</h2>
  <div id="holes"></div>
</div>
<div id="stage"><canvas id="cv"></canvas></div>
</div>
<script>
var DATA = __MAP_DATA__;
var COLORS = {run:"#8b8985",requirement:"#2f6fd0",subproblem:"#7b4fd0",option:"#3f9e6b",commit:"#d08a2f",file:"#2f9ea0",unplanned:"#d0342f"};
var LABELS = {subproblem:"sub-problem"};
var KINDS = ["requirement","subproblem","option","commit","file","unplanned","run"];
var RADIUS = {run:11,requirement:8,subproblem:8,option:5,commit:8,file:6,unplanned:6};
var show = {}; KINDS.forEach(function(k){show[k]=k!=="run";});
var onlyHoles = false, query = "";

var cv = document.getElementById("cv"), ctx = cv.getContext("2d");
var W=0,H=0,dpr=window.devicePixelRatio||1;
var nodes = DATA.nodes.map(function(n,i){
  var col = KINDS.indexOf(n.kind); if (col<0) col=6;
  return Object.assign({},n,{x:(col+1)*140+(Math.random()*60-30),y:200+((i*97)%520),vx:0,vy:0});
});
var byId = {}; nodes.forEach(function(n){byId[n.id]=n;});
var links = DATA.edges.filter(function(e){return byId[e.from]&&byId[e.to];})
  .map(function(e){return {s:byId[e.from],t:byId[e.to],type:e.type,label:e.label};});
var deg = {}; links.forEach(function(l){deg[l.s.id]=(deg[l.s.id]||0)+1;deg[l.t.id]=(deg[l.t.id]||0)+1;});

var tx=0,ty=0,scale=1,alpha=1,sel=null,hover=null;

function visible(n){
  if(!show[n.kind]) return false;
  if(onlyHoles && !n.hole) return false;
  if(query && (n.label+" "+(n.title||"")).toLowerCase().indexOf(query)<0) return false;
  return true;
}
function resize(){
  var r = document.getElementById("stage").getBoundingClientRect();
  W=r.width; H=r.height;
  cv.width=W*dpr; cv.height=H*dpr; cv.style.width=W+"px"; cv.style.height=H+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
function step(){
  if(alpha<0.005) return;
  var vis = nodes.filter(visible);
  for(var i=0;i<vis.length;i++){
    for(var j=i+1;j<vis.length;j++){
      var a=vis[i],b=vis[j],dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy||1;
      if(d2>250000) continue;
      var f=6500/d2, d=Math.sqrt(d2), fx=dx/d*f, fy=dy/d*f;
      a.vx-=fx;a.vy-=fy;b.vx+=fx;b.vy+=fy;
    }
  }
  links.forEach(function(l){
    if(!visible(l.s)||!visible(l.t)) return;
    var dx=l.t.x-l.s.x,dy=l.t.y-l.s.y,d=Math.sqrt(dx*dx+dy*dy)||1;
    var rest = l.type==="in-run"?260:150;
    var f=(d-rest)*0.012;
    l.s.vx+=dx/d*f; l.s.vy+=dy/d*f; l.t.vx-=dx/d*f; l.t.vy-=dy/d*f;
  });
  vis.forEach(function(n){
    n.vx += (W/2-n.x)*0.0011; n.vy += (H/2-n.y)*0.0011;
    n.vx*=0.86; n.vy*=0.86;
    n.x+=n.vx*alpha; n.y+=n.vy*alpha;
  });
  alpha*=0.994;
}
function nbrs(n){
  var s={}; links.forEach(function(l){ if(l.s===n)s[l.t.id]=1; if(l.t===n)s[l.s.id]=1; }); return s;
}
function draw(){
  ctx.clearRect(0,0,W,H);
  ctx.save(); ctx.translate(tx,ty); ctx.scale(scale,scale);
  var focus = sel||hover, near = focus?nbrs(focus):null;
  links.forEach(function(l){
    if(!visible(l.s)||!visible(l.t)) return;
    var on = !focus || l.s===focus || l.t===focus;
    ctx.globalAlpha = on?0.55:0.07;
    ctx.strokeStyle = l.type==="rejected" ? "#9a9894" : l.type==="decided-during" ? COLORS.unplanned : "#8a8884";
    ctx.lineWidth = l.type==="in-run"?0.5:1;
    if(l.type==="rejected"){ctx.setLineDash([3,3]);}else{ctx.setLineDash([]);}
    ctx.beginPath(); ctx.moveTo(l.s.x,l.s.y); ctx.lineTo(l.t.x,l.t.y); ctx.stroke();
  });
  ctx.setLineDash([]);
  nodes.forEach(function(n){
    if(!visible(n)) return;
    var on = !focus || n===focus || (near&&near[n.id]);
    ctx.globalAlpha = on?1:0.12;
    var r = RADIUS[n.kind]||6;
    if(n.kind==="file") r = 5+Math.min(6,(n.runs||[]).length*2);
    ctx.beginPath(); ctx.arc(n.x,n.y,r,0,6.2832);
    ctx.fillStyle = n.kind==="option"&&!n.chosen ? "#9a9894" : COLORS[n.kind]||"#888";
    ctx.fill();
    if(n.hole){ ctx.strokeStyle="#d0342f"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(n.x,n.y,r+3.5,0,6.2832); ctx.stroke(); }
    if(n===sel){ ctx.strokeStyle=getComputedStyle(document.body).color; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(n.x,n.y,r+7,0,6.2832); ctx.stroke(); }
    if(scale>0.55||n===focus){
      ctx.globalAlpha = on?0.9:0.1;
      ctx.fillStyle = getComputedStyle(document.body).color;
      ctx.font = "10px ui-sans-serif,sans-serif"; ctx.textAlign="center";
      ctx.fillText(n.kind==="file"?n.label.split("/").pop():n.label, n.x, n.y-r-5);
    }
  });
  ctx.restore();
}
function loop(){ step(); draw(); requestAnimationFrame(loop); }

function at(px,py){
  var x=(px-tx)/scale, y=(py-ty)/scale, best=null, bd=1e9;
  nodes.forEach(function(n){
    if(!visible(n)) return;
    var d=(n.x-x)*(n.x-x)+(n.y-y)*(n.y-y);
    if(d<bd&&d<400){bd=d;best=n;}
  });
  return best;
}
function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function detail(n){
  var el=document.getElementById("detail");
  if(!n){ el.innerHTML='<span class="sub">Click a node.</span>'; return; }
  var h='<div class="k">'+esc(LABELS[n.kind]||n.kind)+(n.slug?" &middot; "+esc(n.slug):"")+'</div>';
  h+='<div class="t">'+esc(n.label)+(n.title?" — "+esc(n.title):"")+'</div>';
  if(n.status) h+='<p><span class="badge">'+esc(n.status)+'</span></p>';
  if(n.kind==="option") h+='<p><span class="badge">'+(n.chosen?"chosen":"rejected")+'</span></p>';
  if(n.why) h+='<p><b>Why:</b> '+esc(n.why)+'</p>';
  if(n.rejected) h+='<p><b>Why it lost:</b> '+esc(n.rejected)+'</p>';
  if(n.doneWhen) h+='<p><b>Done when:</b> '+esc(n.doneWhen)+'</p>';
  if(n.kind==="file") h+='<p><b>Runs:</b> '+esc((n.runs||[]).join(", "))+'</p>';
  var outs=links.filter(function(l){return l.s===n;}), ins=links.filter(function(l){return l.t===n;});
  function list(t,arr,side){
    if(!arr.length) return "";
    return "<p><b>"+t+"</b></p><ul>"+arr.map(function(l){
      var o=side==="out"?l.t:l.s;
      return "<li>"+esc(l.type)+" &rarr; "+esc(o.label)+(o.title?" <span class=sub>"+esc(o.title)+"</span>":"")+"</li>";
    }).join("")+"</ul>";
  }
  h+=list("Points to",outs,"out")+list("Pointed to by",ins,"in");
  var mine=DATA.holes.filter(function(x){return x.node===n.id;});
  if(mine.length) h+='<p class="hole"><b>Holes</b></p><ul class="hole">'+mine.map(function(x){return "<li>"+esc(x.text)+"</li>";}).join("")+"</ul>";
  el.innerHTML=h;
}

var leg=document.getElementById("legend");
KINDS.forEach(function(k){
  var id="k_"+k;
  var l=document.createElement("label");
  l.innerHTML='<input type="checkbox" id="'+id+'"'+(show[k]?" checked":"")+'><span class="dot" style="background:'+COLORS[k]+'"></span>'+(LABELS[k]||k);
  leg.appendChild(l);
  l.querySelector("input").addEventListener("change",function(e){show[k]=e.target.checked;alpha=Math.max(alpha,0.35);});
});
document.getElementById("onlyholes").addEventListener("change",function(e){onlyHoles=e.target.checked;alpha=Math.max(alpha,0.35);});
document.getElementById("q").addEventListener("input",function(e){query=e.target.value.toLowerCase();alpha=Math.max(alpha,0.35);});
document.getElementById("counts").textContent =
  DATA.nodes.length+" nodes · "+links.length+" edges · "+DATA.holes.length+" holes";
var hh=document.getElementById("holes"), grouped={};
DATA.holes.forEach(function(h){(grouped[h.kind]=grouped[h.kind]||[]).push(h);});
hh.innerHTML = Object.keys(grouped).map(function(k){
  return '<p class="k">'+esc(k)+" ("+grouped[k].length+')</p><ul class="hole">'+grouped[k].map(function(h){
    return '<li data-id="'+esc(h.node)+'">'+esc(h.text)+"</li>";}).join("")+"</ul>";
}).join("") || '<span class="sub">None.</span>';
hh.addEventListener("click",function(e){
  var li=e.target.closest("li"); if(!li) return;
  var n=byId[li.getAttribute("data-id")]; if(!n) return;
  show[n.kind]=true; document.getElementById("k_"+n.kind).checked=true;
  sel=n; detail(n); alpha=0;
  tx=W/2-n.x*scale; ty=H/2-n.y*scale;
});

var dragging=false,lx=0,ly=0,moved=false;
cv.addEventListener("mousedown",function(e){dragging=true;moved=false;lx=e.clientX;ly=e.clientY;cv.classList.add("drag");});
window.addEventListener("mouseup",function(e){
  cv.classList.remove("drag");
  if(dragging&&!moved){var r=cv.getBoundingClientRect();sel=at(e.clientX-r.left,e.clientY-r.top);detail(sel);}
  dragging=false;
});
window.addEventListener("mousemove",function(e){
  if(dragging){ if(Math.abs(e.clientX-lx)+Math.abs(e.clientY-ly)>3) moved=true;
    tx+=e.clientX-lx; ty+=e.clientY-ly; lx=e.clientX; ly=e.clientY; return; }
  var r=cv.getBoundingClientRect();
  if(e.clientX<r.left) return;
  hover=at(e.clientX-r.left,e.clientY-r.top);
});
cv.addEventListener("wheel",function(e){
  e.preventDefault();
  var r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
  var k=Math.exp(-e.deltaY*0.0015), ns=Math.min(4,Math.max(0.2,scale*k));
  tx=mx-(mx-tx)*(ns/scale); ty=my-(my-ty)*(ns/scale); scale=ns;
},{passive:false});
window.addEventListener("resize",resize);
resize(); loop();
</script></body></html>
`;

writeFileSync(out('index.html'), HTML.replace('__MAP_DATA__', JSON.stringify(data)));

if (!QUIET) {
  const count = (k) => [...nodes.values()].filter((n) => n.kind === k).length;
  console.log('map-me — ' + runs.size + ' run(s), ' + nodes.size + ' nodes, ' + edges.length + ' edges');
  console.log('  ' + [['requirement', 'requirement'], ['subproblem', 'sub-problem'],
    ['option', 'option'], ['commit', 'commit'], ['file', 'file'], ['unplanned', 'unplanned']]
    .map(([k, label]) => count(k) + ' ' + label).join(', '));
  console.log('  ' + holes.length + ' hole(s)');
  const grouped = {};
  for (const h of holes) (grouped[h.kind] ||= []).push(h);
  for (const [k, v] of Object.entries(grouped)) console.log('    ' + String(v.length).padStart(3) + '  ' + (HOLE_TITLES[k] || k));
  console.log('  wrote ' + OUT.replace(process.cwd() + '/', '') + '/{index.html,HOLES.md,map.json,*.md}');
}
