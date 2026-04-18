(async function () {
  window.addEventListener('error', (e) => {
    console.error('[SERMAS] Uncaught error:', e.error || e.message);
    showFatal(e.error?.message || e.message, e.error?.stack);
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.error('[SERMAS] Unhandled rejection:', e.reason);
    showFatal(String(e.reason?.message || e.reason), e.reason?.stack);
  });

  function showFatal(msg, stack) {
    const el = document.getElementById('loading');
    if (!el) return;
    el.hidden = false;
    el.innerHTML = `
      <div class="mx-auto max-w-2xl rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <p class="font-semibold text-destructive">Error cargando el test</p>
        <p class="mt-2 text-sm">${String(msg).replace(/</g, '&lt;')}</p>
        ${stack ? `<pre class="mt-3 overflow-auto rounded bg-background border border-border p-3 text-xs">${String(stack).replace(/</g, '&lt;')}</pre>` : ''}
        <p class="mt-3 text-xs text-muted-foreground">Abre la consola (F12) para más detalles.</p>
      </div>`;
  }

  const params = new URLSearchParams(location.search);
  const testId = params.get('t');
  const mode = params.get('mode') === 'exam' ? 'exam' : 'study';

  const titleEl = document.getElementById('testTitle');
  const modeBadge = document.getElementById('modeBadge');
  const headerStatus = document.getElementById('headerStatus');
  const loadingEl = document.getElementById('loading');
  const pane = document.getElementById('questionPane');
  const resultPane = document.getElementById('resultPane');

  const qText = document.getElementById('questionText');
  const optList = document.getElementById('optionList');
  const feedback = document.getElementById('feedback');
  const progressFill = document.getElementById('progressFill');
  const qPosition = document.getElementById('qPosition');
  const qTotal = document.getElementById('qTotal');
  const markBtn = document.getElementById('markDoubt');
  const markIcon = document.getElementById('markIcon');

  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitBtn');
  const navMap = document.getElementById('navMap');
  const mapDialog = document.getElementById('mapDialog');
  const mapGrid = document.getElementById('mapGrid');
  const sidebarMap = document.getElementById('sidebarMap');
  const sbAnswered = document.getElementById('sbAnswered');
  const sbDoubts = document.getElementById('sbDoubts');
  const sbCounter = document.getElementById('sbCounter');

  if (!testId) {
    loadingEl.textContent = 'Falta el parámetro ?t=<id> en la URL.';
    return;
  }

  let manifest, testMeta, questions = [];

  try {
    const mres = await fetch('data/manifest.json', { cache: 'no-store' });
    if (!mres.ok) throw new Error('Manifest HTTP ' + mres.status);
    manifest = await mres.json();
    testMeta = manifest.tests.find(t => t.id === testId);
    if (!testMeta) throw new Error('Test no encontrado: ' + testId);

    questions = await loadQuestions(testMeta, manifest);
    if (!questions.length) throw new Error('El test no tiene preguntas.');

    titleEl.textContent = testMeta.title;
    document.title = `${testMeta.title} — SERMAS C2`;

    if (mode === 'exam') {
      modeBadge.textContent = 'Examen';
      modeBadge.className = 'inline-flex shrink-0 items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary';
    } else {
      modeBadge.textContent = 'Estudio';
      modeBadge.className = 'inline-flex shrink-0 items-center rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-medium text-success';
    }
  } catch (err) {
    loadingEl.innerHTML = `
      <div class="mx-auto max-w-xl rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p class="font-semibold text-destructive">No se pudo cargar el test.</p>
        <p class="mt-2 text-sm text-muted-foreground">${escapeHtml(String(err))}</p>
      </div>`;
    return;
  }

  const state = {
    idx: 0,
    answers: new Array(questions.length).fill(null),
    doubts: new Set(),
    locked: new Array(questions.length).fill(false),
    shuffledOptions: questions.map(q => shuffledOptionMap(q)),
    submitted: false,
  };

  loadingEl.hidden = true;
  pane.hidden = false;
  qTotal.textContent = questions.length;

  render();

  prevBtn.addEventListener('click', () => move(-1));
  nextBtn.addEventListener('click', () => move(1));
  submitBtn.addEventListener('click', submit);
  markBtn.addEventListener('click', toggleDoubt);
  if (navMap) navMap.addEventListener('click', openMap);
  document.getElementById('reviewBtn').addEventListener('click', toggleReview);
  document.getElementById('retryBtn').addEventListener('click', () => location.reload());

  document.addEventListener('keydown', e => {
    if (state.submitted) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
    else if (['1', '2', '3', '4', 'a', 'b', 'c', 'd', 'A', 'B', 'C', 'D'].includes(e.key)) {
      const map = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3, A: 0, B: 1, C: 2, D: 3 };
      selectOption(map[e.key]);
    }
  });

  function render() {
    const q = questions[state.idx];
    const shuffledMap = state.shuffledOptions[state.idx];

    qText.textContent = q.q;
    qPosition.textContent = state.idx + 1;
    progressFill.style.width = `${((state.idx + 1) / questions.length) * 100}%`;

    optList.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    shuffledMap.forEach((originalIdx, displayIdx) => {
      const li = document.createElement('li');
      li.dataset.displayIdx = displayIdx;
      li.dataset.originalIdx = originalIdx;
      li.className = 'opt flex items-start gap-3 rounded-md px-4 py-3 cursor-pointer transition';
      li.innerHTML = `
        <span class="letter flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">${letters[displayIdx]}</span>
        <span class="flex-1 leading-snug">${escapeHtml(q.options[originalIdx])}</span>`;
      li.addEventListener('click', () => selectOption(displayIdx));
      optList.appendChild(li);
    });

    if (state.answers[state.idx] !== null) {
      const displayIdx = shuffledMap.indexOf(state.answers[state.idx]);
      optList.children[displayIdx].classList.add('selected');
    }

    if (state.locked[state.idx]) {
      applyLockedStyling();
      renderFeedback(state.answers[state.idx] === q.correct, q);
    } else {
      feedback.hidden = true;
      feedback.innerHTML = '';
    }

    updateDoubtButton();

    prevBtn.disabled = state.idx === 0;
    nextBtn.disabled = state.idx === questions.length - 1;

    updateStatus();
    renderSidebarMap();
  }

  function renderFeedback(isCorrect, q) {
    feedback.hidden = false;
    feedback.className = 'mt-5 rounded-md border px-4 py-3 text-sm ' +
      (isCorrect
        ? 'border-success/30 bg-success/10 text-success'
        : 'border-destructive/30 bg-destructive/10 text-destructive');
    const icon = isCorrect ? '✅' : '❌';
    const label = isCorrect ? 'Correcto.' : 'Incorrecto.';
    const expl = q.explanation
      ? `<p class="mt-1 text-foreground/90"><strong class="font-semibold">Explicación:</strong> ${escapeHtml(q.explanation)}</p>`
      : '';
    feedback.innerHTML = `<p class="font-semibold">${icon} ${label}</p>${expl}`;
  }

  function updateDoubtButton() {
    const active = state.doubts.has(state.idx);
    markBtn.classList.toggle('border-warning', active);
    markBtn.classList.toggle('text-warning', active);
    markBtn.classList.toggle('bg-warning/10', active);
    if (markIcon) markIcon.textContent = active ? '★' : '☆';
  }

  function updateStatus() {
    const answered = state.answers.filter(a => a !== null).length;
    const txt = `${answered}/${questions.length} contestadas`;
    if (headerStatus) headerStatus.textContent = txt;
    if (sbAnswered) sbAnswered.textContent = String(answered);
    if (sbDoubts) sbDoubts.textContent = String(state.doubts.size);
    if (sbCounter) sbCounter.textContent = `${answered} / ${questions.length}`;
  }

  function selectOption(displayIdx) {
    if (state.locked[state.idx]) return;
    const originalIdx = state.shuffledOptions[state.idx][displayIdx];
    state.answers[state.idx] = originalIdx;

    [...optList.children].forEach(li => li.classList.remove('selected'));
    optList.children[displayIdx].classList.add('selected');

    if (mode === 'study') {
      state.locked[state.idx] = true;
      applyLockedStyling();
      renderFeedback(originalIdx === questions[state.idx].correct, questions[state.idx]);
    }
    updateStatus();
    renderSidebarMap();
  }

  function applyLockedStyling() {
    const q = questions[state.idx];
    const shuffledMap = state.shuffledOptions[state.idx];
    const chosenOriginal = state.answers[state.idx];
    [...optList.children].forEach((li, displayIdx) => {
      li.classList.add('locked');
      const orig = shuffledMap[displayIdx];
      if (orig === q.correct) li.classList.add('correct');
      else if (orig === chosenOriginal) li.classList.add('incorrect');
    });
  }

  function move(delta) {
    const next = state.idx + delta;
    if (next < 0 || next >= questions.length) return;
    state.idx = next;
    render();
  }

  function toggleDoubt() {
    if (state.doubts.has(state.idx)) state.doubts.delete(state.idx);
    else state.doubts.add(state.idx);
    updateDoubtButton();
    updateStatus();
    renderSidebarMap();
  }

  function buildMapCell(i, opts = {}) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = i + 1;
    btn.className = 'map-cell';
    if (state.answers[i] !== null) btn.classList.add('answered');
    if (state.doubts.has(i)) btn.classList.add('doubt');
    if (i === state.idx) btn.classList.add('current');
    btn.addEventListener('click', () => {
      state.idx = i;
      render();
      if (opts.closeDialog) mapDialog.close();
    });
    return btn;
  }

  function renderSidebarMap() {
    if (!sidebarMap) return;
    sidebarMap.innerHTML = '';
    questions.forEach((_, i) => sidebarMap.appendChild(buildMapCell(i)));
  }

  function openMap() {
    mapGrid.innerHTML = '';
    questions.forEach((_, i) => mapGrid.appendChild(buildMapCell(i, { closeDialog: true })));
    if (typeof mapDialog.showModal === 'function') mapDialog.showModal();
    else mapDialog.setAttribute('open', '');
  }

  function submit() {
    const unanswered = state.answers.filter(a => a === null).length;
    if (unanswered > 0) {
      if (!confirm(`Quedan ${unanswered} preguntas sin contestar. ¿Terminar igualmente?`)) return;
    }
    state.submitted = true;
    let correct = 0, wrong = 0, blank = 0;
    questions.forEach((q, i) => {
      if (state.answers[i] === null) blank++;
      else if (state.answers[i] === q.correct) correct++;
      else wrong++;
    });

    const total = questions.length;
    const score = (correct / total) * 10;
    const penaltyScore = Math.max(0, ((correct - wrong / 3) / total) * 10);

    document.getElementById('rCorrect').textContent = correct;
    document.getElementById('rWrong').textContent = wrong;
    document.getElementById('rBlank').textContent = blank;
    document.getElementById('rScore').textContent = score.toFixed(2);
    document.getElementById('rPenaltyScore').textContent = penaltyScore.toFixed(2);

    const summary = document.getElementById('rSummary');
    const percent = Math.round((correct / total) * 100);
    let verdict = '';
    if (percent >= 80) verdict = '¡Excelente! 💪';
    else if (percent >= 60) verdict = 'Buen nivel, sigue así.';
    else if (percent >= 40) verdict = 'Vas por buen camino, a repasar.';
    else verdict = 'A repasar con calma: revisa los errores.';
    summary.textContent = `${percent}% de aciertos · ${verdict}`;

    saveBest(testId, score, penaltyScore);

    pane.hidden = true;
    resultPane.hidden = false;
    if (headerStatus) headerStatus.textContent = `Nota: ${score.toFixed(2)}/10`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleReview() {
    const reviewPane = document.getElementById('reviewPane');
    if (!reviewPane.hidden) { reviewPane.hidden = true; return; }
    const list = document.getElementById('reviewList');
    list.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    questions.forEach((q, i) => {
      const item = document.createElement('div');
      item.className = 'py-5 first:pt-0';
      const chosen = state.answers[i];
      const status = chosen === null ? '⚪' : (chosen === q.correct ? '✅' : '❌');
      const statusColor = chosen === null ? 'text-muted-foreground' : (chosen === q.correct ? 'text-success' : 'text-destructive');

      const optionsHtml = q.options.map((opt, idx) => {
        let cls = 'text-muted-foreground';
        if (idx === q.correct) cls = 'text-success font-semibold';
        else if (idx === chosen) cls = 'text-destructive font-semibold';
        return `<li class="${cls} py-0.5">${letters[idx]}. ${escapeHtml(opt)}</li>`;
      }).join('');

      item.innerHTML = `
        <div class="flex items-start gap-2">
          <span class="${statusColor} text-base">${status}</span>
          <p class="font-semibold text-sm md:text-base leading-snug">${i + 1}. ${escapeHtml(q.q)}</p>
        </div>
        <ol class="mt-3 ml-7 list-none space-y-0.5 text-sm">${optionsHtml}</ol>
        ${q.explanation ? `
          <div class="mt-3 ml-7 rounded-md bg-muted px-3 py-2 text-sm">
            <strong class="font-semibold">Explicación:</strong> ${escapeHtml(q.explanation)}
          </div>` : ''}`;
      list.appendChild(item);
    });
    reviewPane.hidden = false;
    reviewPane.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function saveBest(id, score, penaltyScore) {
    try {
      const key = 'sermas.best.' + id;
      const prev = JSON.parse(localStorage.getItem(key) || 'null');
      const date = new Date().toISOString();
      if (!prev || score > prev.score) {
        localStorage.setItem(key, JSON.stringify({
          score: Number(score.toFixed(2)),
          penaltyScore: Number(penaltyScore.toFixed(2)),
          date,
        }));
      }
    } catch {}
  }

  async function loadQuestions(meta, manifest) {
    if (meta.type === 'aggregator') {
      const pool = [];
      const weights = meta.weights || {};
      const sources = meta.sources || [];
      const loaded = {};
      for (const srcId of sources) {
        const srcMeta = manifest.tests.find(t => t.id === srcId);
        if (!srcMeta || !srcMeta.path) continue;
        const r = await fetch('data/' + srcMeta.path, { cache: 'no-store' });
        if (!r.ok) continue;
        const data = await r.json();
        loaded[srcId] = (data.questions || []).map(q => ({ ...q, _src: srcId }));
      }
      const total = meta.questionCount || 100;
      if (Object.keys(weights).length) {
        const sum = Object.values(weights).reduce((a, b) => a + b, 0);
        for (const srcId of sources) {
          const w = weights[srcId] || 0;
          if (!w || !loaded[srcId]) continue;
          const n = Math.round((w / sum) * total);
          pool.push(...sampleN(loaded[srcId], n));
        }
      } else {
        const perSrc = Math.ceil(total / sources.length);
        for (const srcId of sources) {
          if (!loaded[srcId]) continue;
          pool.push(...sampleN(loaded[srcId], perSrc));
        }
      }
      return shuffle(pool).slice(0, total);
    }
    const res = await fetch('data/' + meta.path, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const qs = data.questions || [];
    return shuffle(qs.slice());
  }

  function sampleN(arr, n) {
    const copy = arr.slice();
    shuffle(copy);
    return copy.slice(0, Math.min(n, copy.length));
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function shuffledOptionMap(q) {
    const map = [0, 1, 2, 3];
    shuffle(map);
    return map;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }
})();
