#!/usr/bin/env node
// Rebalancea la posición de la respuesta correcta en un banco JSON.
// Si una posición (0-3) tiene exceso de correctas y otra tiene déficit,
// intercambia opciones para igualar la distribución (sin alterar el
// contenido de las preguntas).
// Uso: node scripts/rebalance.mjs public/data/leyes/ce-1978.json [...más ficheros]

import { readFileSync, writeFileSync } from 'node:fs';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Uso: node scripts/rebalance.mjs <fichero.json> [...]');
  process.exit(1);
}

for (const file of files) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(data.questions)) {
    console.error(`${file}: sin questions`);
    continue;
  }

  const n = data.questions.length;
  const target = n / 4;

  const dist = [0, 0, 0, 0];
  for (const q of data.questions) if (q.correct >= 0 && q.correct <= 3) dist[q.correct]++;
  const before = [...dist];

  // Recorrido determinista: para cada pregunta, si su correct está en una
  // posición con exceso y existe otra con déficit, swap opciones.
  let swaps = 0;
  for (const q of data.questions) {
    if (!Array.isArray(q.options) || q.options.length !== 4) continue;
    const c = q.correct;
    if (dist[c] <= Math.ceil(target)) continue; // ya está o por debajo

    // Elegir la posición con menor dist (más deficitaria)
    let targetPos = -1;
    let minDist = Infinity;
    for (let j = 0; j < 4; j++) {
      if (j === c) continue;
      if (dist[j] < Math.floor(target) && dist[j] < minDist) {
        minDist = dist[j];
        targetPos = j;
      }
    }
    if (targetPos === -1) continue;

    // Swap options[c] con options[targetPos]
    [q.options[c], q.options[targetPos]] = [q.options[targetPos], q.options[c]];
    dist[c]--;
    dist[targetPos]++;
    q.correct = targetPos;
    swaps++;
  }

  const after = [...dist];
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log(`${file}`);
  console.log(`  antes:    [${before.join(', ')}]`);
  console.log(`  después:  [${after.join(', ')}]  (${swaps} swaps)`);
}
