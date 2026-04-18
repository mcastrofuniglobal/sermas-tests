(async function () {
  const container = document.getElementById('menu');

  const CATEGORIES = [
    { id: 'Leyes',      anchor: 'leyes',      label: 'Tests por ley o norma',     desc: 'Un test por cada norma del temario.' },
    { id: 'Gestión',    anchor: 'gestion',    label: 'Gestión administrativa y sanitaria', desc: 'Citas, archivo, protección de datos, informática.' },
    { id: 'Bloques',    anchor: 'bloques',    label: 'Tests por bloque temático', desc: 'Preguntas mezcladas entre varias normas relacionadas.' },
    { id: 'Simulacros', anchor: 'simulacros', label: 'Simulacros generales',      desc: 'Preguntas de todo el temario al estilo del examen real.' },
  ];

  const CATEGORY_ICON = {
    'Leyes':      '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>',
    'Gestión':    '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>',
    'Bloques':    '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    'Simulacros': '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  };

  try {
    const res = await fetch('data/manifest.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const manifest = await res.json();

    const grouped = {};
    for (const t of manifest.tests) {
      (grouped[t.category] = grouped[t.category] || []).push(t);
    }

    container.innerHTML = '';

    CATEGORIES.forEach((cat, catIdx) => {
      const list = grouped[cat.id];
      if (!list || !list.length) return;

      const section = document.createElement('section');
      section.id = cat.anchor;
      section.className = 'mb-10 animate-in';
      section.style.animationDelay = `${catIdx * 40}ms`;

      // Header de sección
      const header = document.createElement('div');
      header.className = 'mb-4 flex flex-wrap items-end justify-between gap-2';
      header.innerHTML = `
        <div>
          <h2 class="flex items-center gap-2 text-xl md:text-2xl font-semibold tracking-tight">
            <span class="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">${CATEGORY_ICON[cat.id] || ''}</span>
            ${cat.label}
          </h2>
          <p class="mt-1 text-sm text-muted-foreground">${cat.desc}</p>
        </div>
        <span class="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
          ${list.length} test${list.length === 1 ? '' : 's'}
        </span>`;
      section.appendChild(header);

      // Grid de tarjetas
      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';
      for (const t of list) {
        grid.appendChild(renderCard(t));
      }
      section.appendChild(grid);
      container.appendChild(section);
    });

    if (manifest.repoUrl) {
      for (const id of ['repoLink', 'repoLinkFooter']) {
        const link = document.getElementById(id);
        if (link) link.href = manifest.repoUrl;
      }
    }
  } catch (err) {
    container.innerHTML = `
      <div class="mx-auto max-w-xl rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p class="font-semibold text-destructive">No se pudo cargar el manifiesto.</p>
        <p class="mt-2 text-sm text-muted-foreground">${escapeHtml(String(err))}</p>
        <p class="mt-3 text-xs text-muted-foreground">Si has abierto el fichero con doble clic, prueba con:
          <code class="rounded bg-background border border-border px-1.5 py-0.5 text-[11px]">python3 -m http.server -d public 8000</code>
        </p>
      </div>`;
  }

  function renderCard(t) {
    const card = document.createElement('div');
    card.className = 'group relative flex flex-col rounded-lg border border-border bg-card p-5 shadow-card transition hover:shadow-card-hover hover:border-primary/40';

    const isAggregator = t.type === 'aggregator';
    const badge = isAggregator
      ? '<span class="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">Mezclado</span>'
      : '<span class="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Directo</span>';

    const count = t.questionCount != null ? t.questionCount : '—';
    const best = readBest(t.id);
    const bestHtml = best
      ? `<div class="mt-2 inline-flex items-center gap-1.5 rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success">
           <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9 2 12l4 3"/><path d="m18 9 4 3-4 3"/><circle cx="12" cy="12" r="3"/></svg>
           Mejor: ${best.score}/10 · ${formatDate(best.date)}
         </div>`
      : '';

    card.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        ${badge}
        <span class="text-xs text-muted-foreground">${count} preguntas</span>
      </div>
      <h3 class="mt-3 text-base font-semibold leading-snug tracking-tight">${escapeHtml(t.title)}</h3>
      ${bestHtml}
      <div class="mt-auto pt-4 flex gap-2">
        <a href="test.html?t=${encodeURIComponent(t.id)}&mode=study"
           class="flex-1 inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-accent transition">
          Estudio
        </a>
        <a href="test.html?t=${encodeURIComponent(t.id)}&mode=exam"
           class="flex-1 inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition">
          Examen
        </a>
      </div>`;
    return card;
  }

  function readBest(testId) {
    try {
      const raw = localStorage.getItem('sermas.best.' + testId);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function formatDate(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch { return iso; }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }
})();
