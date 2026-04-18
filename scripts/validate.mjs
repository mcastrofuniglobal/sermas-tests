#!/usr/bin/env node
// Valida que los bancos de preguntas y el manifest están bien formados.
// Uso: node scripts/validate.mjs

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const DATA = join(ROOT, 'public', 'data');
const MANIFEST_PATH = join(DATA, 'manifest.json');

const errors = [];
const warnings = [];
function err(file, msg) { errors.push(`✗ ${relative(ROOT, file)}: ${msg}`); }
function warn(file, msg) { warnings.push(`! ${relative(ROOT, file)}: ${msg}`); }

function listJsonFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...listJsonFiles(p));
    else if (name.endsWith('.json')) out.push(p);
  }
  return out;
}

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch (e) { err(path, `JSON inválido — ${e.message}`); return null; }
}

const manifest = readJson(MANIFEST_PATH);
if (!manifest) { console.error(errors.join('\n')); process.exit(1); }
if (!Array.isArray(manifest.tests)) err(MANIFEST_PATH, 'Falta el array "tests"');

const manifestById = new Map();
for (const t of manifest.tests || []) {
  if (!t.id) { err(MANIFEST_PATH, 'Test sin id'); continue; }
  if (manifestById.has(t.id)) err(MANIFEST_PATH, `id duplicado en manifest: ${t.id}`);
  manifestById.set(t.id, t);
}

const bankFiles = listJsonFiles(DATA).filter(p => p !== MANIFEST_PATH);
const countsByBank = new Map();

for (const file of bankFiles) {
  const data = readJson(file);
  if (!data) continue;

  if (!data.id) err(file, 'Falta campo "id"');
  if (!data.title) err(file, 'Falta campo "title"');
  if (!Array.isArray(data.questions)) { err(file, 'Falta array "questions"'); continue; }

  const seenIds = new Set();
  data.questions.forEach((q, i) => {
    const loc = `q[${i}]${q.id ? ` (${q.id})` : ''}`;
    if (!q.id) err(file, `${loc}: falta id`);
    else if (seenIds.has(q.id)) err(file, `id de pregunta duplicado: ${q.id}`);
    else seenIds.add(q.id);

    if (typeof q.q !== 'string' || !q.q.trim()) err(file, `${loc}: enunciado vacío`);
    if (!Array.isArray(q.options) || q.options.length !== 4) err(file, `${loc}: debe tener 4 opciones`);
    else {
      const set = new Set(q.options.map(s => String(s).trim()));
      if (set.size !== 4) err(file, `${loc}: opciones duplicadas`);
      q.options.forEach((o, j) => {
        if (typeof o !== 'string' || !o.trim()) err(file, `${loc}: option[${j}] vacía`);
      });
    }
    if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) {
      err(file, `${loc}: "correct" fuera de rango 0-3 (recibido ${q.correct})`);
    }
    if (q.explanation != null && typeof q.explanation !== 'string') {
      err(file, `${loc}: "explanation" debe ser string`);
    }
  });

  countsByBank.set(data.id, data.questions.length);

  // Distribución de posiciones correctas (advertencia si muy desbalanceada)
  const dist = [0, 0, 0, 0];
  data.questions.forEach(q => { if (q.correct >= 0 && q.correct <= 3) dist[q.correct]++; });
  const max = Math.max(...dist), min = Math.min(...dist);
  if (data.questions.length >= 20 && (max - min) > data.questions.length * 0.4) {
    warn(file, `Distribución desequilibrada de correctas [${dist.join(', ')}]`);
  }
}

// Cruce manifest ↔ bancos directos
for (const t of manifest.tests || []) {
  if (t.type === 'aggregator') {
    for (const src of t.sources || []) {
      if (!manifestById.has(src)) err(MANIFEST_PATH, `Aggregator ${t.id} referencia fuente desconocida: ${src}`);
    }
    if (t.weights) {
      for (const k of Object.keys(t.weights)) {
        if (!(t.sources || []).includes(k)) warn(MANIFEST_PATH, `Aggregator ${t.id} tiene peso para ${k} no listado en sources`);
      }
    }
    continue;
  }
  const real = countsByBank.get(t.id);
  if (real == null) err(MANIFEST_PATH, `Test ${t.id} en manifest pero no existe banco`);
  else if (real !== t.questionCount) {
    err(MANIFEST_PATH, `${t.id}: questionCount=${t.questionCount} pero el banco tiene ${real} preguntas`);
  }
}

// Report
const totalQ = [...countsByBank.values()].reduce((a, b) => a + b, 0);
console.log(`Bancos encontrados: ${countsByBank.size}`);
console.log(`Preguntas totales: ${totalQ}`);
console.log(`Tests en manifest: ${manifestById.size}`);

if (warnings.length) {
  console.log('\nAvisos:');
  warnings.forEach(w => console.log(w));
}
if (errors.length) {
  console.log('\nErrores:');
  errors.forEach(e => console.log(e));
  process.exit(1);
}
console.log('\n✓ Todo correcto.');
