# Cómo contribuir y ampliar el banco de preguntas

Este documento explica el flujo para ampliar los bancos de preguntas en sucesivas sesiones de trabajo (con Claude o cualquier LLM), y cómo añadir un test completamente nuevo.

---

## 1. Añadir preguntas a un banco existente

### Paso 1 — Generar las preguntas con Claude

Pega este *prompt* adaptado a la ley y tema que quieras:

> Genera **N preguntas** tipo test (4 opciones, una sola correcta) sobre la **[NOMBRE DE LA LEY]**, concretamente sobre los **artículos X-Y / capítulo Z**.
>
> Formato JSON exacto para cada pregunta:
> ```json
> {
>   "id": "prefijo-NNN",
>   "q": "...",
>   "options": ["A", "B", "C", "D"],
>   "correct": 0,
>   "explanation": "... (1-2 frases citando el artículo)"
> }
> ```
>
> Requisitos:
> - Usa como prefijo de ID el mismo que ya hay en el fichero (ver tabla abajo).
> - Numera los IDs a partir del último usado.
> - Distribuye la opción correcta equilibradamente entre índices 0, 1, 2 y 3.
> - Distractores plausibles (números de artículo cercanos, términos similares).
> - Evita duplicar preguntas ya existentes en el banco.
> - Cada explicación debe citar el artículo concreto.
>
> Devuelve únicamente el array de preguntas en JSON válido, sin texto alrededor.

**Prefijos de ID por banco**:

| Banco                         | Prefijo   |
|-------------------------------|-----------|
| `ce-1978.json`                | `ce-`     |
| `estatuto-cam.json`           | `est-`    |
| `ley-gobierno-cam.json`       | `lgc-`    |
| `ley-39-2015.json`            | `l39-`    |
| `ley-14-1986.json`            | `l14-`    |
| `ley-12-2001.json`            | `l12-`    |
| `ley-16-2003.json`            | `l16-`    |
| `lo-1-2004.json`              | `lo1-`    |
| `gestion-admin-sanitaria.json`| `ges-`    |

### Paso 2 — Pegar las preguntas en el fichero

1. Abre el fichero del banco correspondiente en `public/data/leyes/` o `public/data/gestion/`.
2. Busca el último `]` del array `questions`.
3. Inserta las nuevas preguntas antes, separándolas por coma.
4. Actualiza el campo `lastUpdated` con la fecha actual (formato `YYYY-MM-DD`).

### Paso 3 — Actualizar `manifest.json`

Incrementa el `questionCount` del test correspondiente para que el menú muestre el número correcto.

### Paso 4 — Validar el JSON

```bash
python3 -m json.tool public/data/leyes/ley-39-2015.json > /dev/null && echo OK
# O con jq:
jq . public/data/leyes/ley-39-2015.json > /dev/null && echo OK
```

Si hay error de sintaxis, revisa comas sueltas o comillas sin escapar.

### Paso 5 — Probar en local

```bash
python3 -m http.server -d public 8000
```

Abre `http://localhost:8000`, entra al test, verifica que cuenta las preguntas nuevas y responde alguna.

### Paso 6 — Commit y push

```bash
git add public/data/leyes/ley-39-2015.json public/data/manifest.json
git commit -m "Añade 80 preguntas Ley 39/2015 (cap. IV-VI)"
git push
```

Vercel desplegará automáticamente la nueva versión en ~30 segundos.

---

## 2. Añadir un banco completamente nuevo

Por ejemplo, si el temario se amplía con una norma adicional (LOPDGDD, Ley 19/2013 de transparencia, etc.).

### Paso 1 — Crear el fichero del banco

Crea `public/data/leyes/mi-nueva-ley.json` con la estructura:

```json
{
  "id": "mi-nueva-ley",
  "title": "Ley X/YYYY, de [asunto]",
  "category": "Leyes",
  "source": "Ley X/YYYY, de DD de mes (texto consolidado)",
  "lastUpdated": "YYYY-MM-DD",
  "questions": [
    {
      "id": "mnl-001",
      "q": "...",
      "options": ["A", "B", "C", "D"],
      "correct": 0,
      "explanation": "..."
    }
  ]
}
```

### Paso 2 — Añadir al `manifest.json`

Añade una entrada al array `tests`:

```json
{
  "id": "mi-nueva-ley",
  "title": "Ley X/YYYY, de [asunto]",
  "category": "Leyes",
  "path": "leyes/mi-nueva-ley.json",
  "questionCount": 40
}
```

### Paso 3 — (Opcional) Incluir el nuevo banco en bloques y simulacros

Si la nueva ley pertenece a un bloque existente, añade su `id` al array `sources` del agregador correspondiente y ajusta los `weights`:

```json
{
  "id": "bloque-constitucional",
  "type": "aggregator",
  "sources": ["ce-1978", "estatuto-cam", "ley-gobierno-cam", "ley-39-2015", "mi-nueva-ley"],
  "questionCount": 100,
  "weights": {
    "ce-1978": 30,
    "estatuto-cam": 15,
    "ley-gobierno-cam": 15,
    "ley-39-2015": 30,
    "mi-nueva-ley": 10
  }
}
```

Los pesos no tienen por qué sumar 100; el código normaliza proporcionalmente.

### Paso 4 — Commit

```bash
git add public/data/leyes/mi-nueva-ley.json public/data/manifest.json
git commit -m "Añade banco de preguntas de la Ley X/YYYY"
git push
```

---

## 3. Crear un simulacro o bloque nuevo

Solo hay que añadir una entrada de tipo `aggregator` en `manifest.json`:

```json
{
  "id": "simulacro-3",
  "title": "Simulacro General 3",
  "category": "Simulacros",
  "type": "aggregator",
  "sources": [
    "ce-1978", "estatuto-cam", "ley-gobierno-cam", "ley-39-2015",
    "ley-14-1986", "ley-12-2001", "ley-16-2003", "lo-1-2004",
    "gestion-admin-sanitaria"
  ],
  "questionCount": 100,
  "weights": {
    "ce-1978": 15,
    "estatuto-cam": 5,
    "ley-gobierno-cam": 5,
    "ley-39-2015": 20,
    "ley-14-1986": 15,
    "ley-12-2001": 15,
    "ley-16-2003": 8,
    "lo-1-2004": 5,
    "gestion-admin-sanitaria": 12
  }
}
```

No hace falta crear ningún fichero JSON adicional: el simulacro se genera al vuelo.

---

## 4. Reglas de estilo para las preguntas

- **Una sola respuesta correcta**. Si hay ambigüedad, reformula.
- **Opciones de longitud similar**: evita que la correcta sea siempre la más larga (pista involuntaria).
- **Distractores plausibles**: que obliguen a saber el artículo, no a descartar por el sinsentido.
- **Explicación breve** (1-2 frases) con la referencia legal concreta (`"Art. 43 CE..."`, `"Art. 14 Ley 39/2015..."`).
- **Neutralidad política**: el temario es normativo, no opinable.
- **Actualidad**: comprobar si la norma ha sido modificada (usar el texto consolidado del BOE).

---

## 5. Comprobaciones antes del commit

- [ ] JSON válido (`python3 -m json.tool`).
- [ ] IDs únicos dentro del banco.
- [ ] `questionCount` en el manifest coincide con el número real de preguntas.
- [ ] `lastUpdated` actualizado.
- [ ] Probar al menos 1 pregunta nueva en local.
- [ ] Si cambia un agregador, probar también el bloque/simulacro afectado.

---

## 6. Troubleshooting

- **"Failed to load manifest"** en la consola del navegador → estás abriendo con `file://` en vez de un servidor HTTP. Usa `python3 -m http.server -d public 8000`.
- **Aparecen menos preguntas de las esperadas** en un test → `questionCount` en manifest es mayor que las preguntas reales del banco, o un agregador pide más de las disponibles en la fuente.
- **Una pregunta siempre sale con la correcta en la misma posición** → comprueba que `correct` está bien y que `shuffle` se ejecuta (abre DevTools y recarga).
