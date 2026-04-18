# Tests SERMAS C2 — Contexto para Claude

Este repo es una web estática (HTML/CSS/JS vanilla + Tailwind CDN) para entrenar tests de la oposición al SERMAS Grupo C2. Desplegada en Vercel; cada `git push` a `main` redespliega automáticamente en ~30 s.

Tu rol habitual en este repo es **generar preguntas** tipo test, **añadirlas** al banco correspondiente y **dejarlas commiteadas**. Mira el temario y estructura antes de nada. No inventes leyes ni artículos que no existen.

---

## Estructura

```
public/
├── index.html, test.html, styles.css, menu.js, app.js
└── data/
    ├── manifest.json                 # Índice de tests (directos + aggregators)
    ├── leyes/
    │   ├── ce-1978.json              # 80q   prefijo ID: ce-
    │   ├── estatuto-cam.json         # 40q   est-
    │   ├── ley-gobierno-cam.json     # 40q   lgc-
    │   ├── ley-39-2015.json          # 80q   l39-
    │   ├── ley-14-1986.json          # 80q   l14-
    │   ├── ley-12-2001.json          # 60q   l12-
    │   ├── ley-16-2003.json          # 50q   l16-
    │   └── lo-1-2004.json            # 40q   lo1-
    └── gestion/
        └── gestion-admin-sanitaria.json  # 60q   ges-
scripts/
└── validate.mjs                      # node scripts/validate.mjs
```

Bloques y simulacros se construyen en runtime desde `manifest.json` (type: "aggregator") — **no añadir ficheros nuevos para ellos**, solo ajustar `sources` y `weights` si cambia algo.

---

## Formato de pregunta (estricto)

```json
{
  "id": "l39-081",
  "q": "Enunciado claro y autocontenido.",
  "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
  "correct": 1,
  "explanation": "1-2 frases citando el artículo concreto (ej: «Art. 14 Ley 39/2015»)."
}
```

Estructura del fichero del banco:

```json
{
  "id": "ley-39-2015",
  "title": "Ley 39/2015, Procedimiento Administrativo Común",
  "category": "Leyes",
  "source": "Ley 39/2015 (texto consolidado)",
  "lastUpdated": "YYYY-MM-DD",
  "questions": [ /* ... */ ]
}
```

---

## Reglas de calidad (no negociables)

1. **Una sola respuesta correcta** y verificable en el BOE.
2. **Cita el artículo** en `explanation`. Si no puedes citarlo, no generes la pregunta.
3. **4 opciones distintas** entre sí; distractores plausibles (números de artículo cercanos, términos similares, órganos del mismo rango).
4. **Longitud de opciones similar** — no dejes que la correcta sea siempre la más larga.
5. **Respuestas equilibradas**: reparte los `correct` entre índices 0, 1, 2 y 3.
6. **IDs únicos** dentro del banco, numeración continua a partir del último (`sort -V` para comprobar).
7. **Evita duplicar** preguntas ya existentes. Antes de añadir, hojea el fichero.
8. **Neutralidad**: el temario es normativo, no opinable.

---

## Flujo operativo (la secuencia que sigues por defecto)

1. Pregúntate qué banco y qué tema pide el usuario. Si no lo dice, asume que quieres ampliar el que menos cobertura tiene o el que él esté revisando.
2. **Lee el fichero del banco** (no solo los primeros N — comprueba el último ID usado y evita duplicados).
3. Genera las preguntas. Si son muchas (>40), **usa varios agentes en paralelo** (uno por tema o rango de artículos) para acelerar.
4. Edita el fichero: añade preguntas al array `questions`, actualiza `lastUpdated`.
5. Si el número total del banco cambia, actualiza `questionCount` en `public/data/manifest.json`.
6. **Valida**: `node scripts/validate.mjs`. Si falla, arregla antes de commitear.
7. **Commit + push**:
   ```bash
   git add public/data/<ruta> public/data/manifest.json
   git commit -m "Añade N preguntas <banco> (<tema>)"
   git push
   ```
8. Vercel redespliega solo. Confirma al usuario la URL y el nº total de preguntas nuevas.

---

## Prompts listos por banco

Si el usuario dice *"genera más de la Ley X"*, adapta uno de estos prompts y lánzalo a agentes en paralelo. Siempre incluye el contexto de **número de preguntas**, **rango de artículos/capítulos** y **distribución de posiciones correctas**.

### CE 1978 (`ce-1978.json`, prefijo `ce-`)

Temas pendientes/recurrentes: derechos fundamentales (arts. 14-29), garantías (53-54), Corona (56-65), Cortes (66-96), Gobierno (97-107), PJ (117-127), TC (159-165), organización territorial (137-158).

### Estatuto CAM (`estatuto-cam.json`, `est-`)

Revisa antes: arts. 1-7 (generales), 9-24 (instituciones), 26-31 (competencias), 36-40 (justicia), 51-63 (hacienda), 72-73 (reforma). LO 5/2022 sí está vigente.

### Ley 1/1983 Gobierno CAM (`ley-gobierno-cam.json`, `lgc-`)

Presidente, Vicepresidente, Consejeros, Gobierno (Consejo de Gobierno), relaciones con la Asamblea (cuestión de confianza, moción de censura constructiva), actos y disposiciones (decretos, órdenes, BOCM), responsabilidad patrimonial.

### Ley 39/2015 LPAC (`ley-39-2015.json`, `l39-`)

Interesados (arts. 3-12), art. 14 (obligados electrónicos), plazos (art. 30), silencio (24-25), notificaciones (40-46), nulidad/anulabilidad (47-48), revisión de oficio (106-111), recursos (112-126), caducidad (95), tramitación simplificada (96), ejecución forzosa (99-105).

### Ley 14/1986 LGS (`ley-14-1986.json`, `l14-`)

Titularidad del derecho, SNS, Áreas de Salud (56-59), Zonas Básicas (62), Consejo Interterritorial, alta inspección, salud mental (art. 20), salud laboral (21-22), medidas preventivas (art. 26).

### Ley 12/2001 LOSCAM (`ley-12-2001.json`, `l12-`)

Derechos y deberes del paciente (27-33), tarjeta sanitaria (35), SAIP y cartas de servicios (39-40), SERMAS como Ente de Derecho Público (62-70), Consejo de Salud CAM (48-50), Plan de Salud (44-47), Áreas/ZBS (12-14), Decreto 52/2010 (Área Única), inspección (77 y ss.), régimen sancionador.

### Ley 16/2003 Cohesión SNS (`ley-16-2003.json`, `l16-`)

Cartera común (básica/suplementaria/accesoria, arts. 7-22), condición de asegurado (art. 3 tras RDL 7/2018), profesionales (34-43, formación MIR/EIR), Consejo Interterritorial (69-75), Alta Inspección (76), tarjeta sanitaria (57), calidad (59-62), AEMPS/ONT/ISCIII.

### LO 1/2004 Violencia de Género (`lo-1-2004.json`, `lo1-`)

Objeto y ámbito (1-2), ámbito educativo (4-9), publicidad (10-14), sanitario (15-16), derechos (17-28), tutela institucional (29-32), tutela penal (33-42: CP 148.4, 153, 171.4, 172.2, 468), tutela judicial (43-72: JVM, Fiscal, orden de protección).

### Gestión admin/sanitaria (`gestion-admin-sanitaria.json`, `ges-`)

Citas y agendas (HCIS, AP-Madrid, CAP), SAIP, reclamaciones, historia clínica (Ley 41/2002), consentimiento informado, instrucciones previas, LOPDGDD/RGPD (art. 9), ofimática (Excel fórmulas, Word, correo), registro electrónico (Ley 39/2015 art. 16), tarjeta sanitaria, facturación a terceros, Cl@ve/DNIe.

---

## Despliegue

- Repo: `git@github.com:mcastrofuniglobal/sermas-tests.git`
- URL producción: conectada desde Vercel dashboard al repo → cada push a `main` redespliega.
- Cache: `max-age=0, must-revalidate` global en `vercel.json`. El usuario solo tiene que volver a entrar — nunca pedirle un hard reload.

## Cuándo NO pedir confirmación al usuario

Si el usuario dice "genera N preguntas de X y commitea", ejecuta el flujo completo (generar → validar → commit → push) sin parar a preguntar. Si algo choca (banco inexistente, tema fuera del temario), pregunta antes de inventar.
