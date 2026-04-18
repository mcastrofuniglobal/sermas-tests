# Tests SERMAS — Grupo C2

Aplicación web estática de tests tipo examen para la preparación de las oposiciones al **Servicio Madrileño de Salud (SERMAS)**, categoría **Auxiliar Administrativo / Grupo C2**.

> ⚠️ **Disclaimer**: este repositorio es una herramienta de entrenamiento de elaboración propia. No sustituye al estudio del temario oficial ni es material oficial del SERMAS. Puede contener errores: si detectas alguno, abre una *issue* o envía un *pull request*.

---

## Qué es

Una web estática (HTML + CSS + JS vanilla, sin framework ni build step) que sirve bancos de preguntas almacenados en ficheros JSON. Permite entrenar con tests por ley, por bloque temático o simulacros generales, en dos modos (examen y estudio), con aleatorización y puntuación con penalización por fallo.

## Temario cubierto

### Bloque I — Constitución y Derecho Administrativo

- **Constitución Española de 1978** (80 preguntas)
- **Estatuto de Autonomía de la Comunidad de Madrid** (40 preguntas) — LO 3/1983
- **Ley 1/1983, de Gobierno y Administración de la CAM** (40 preguntas)
- **Ley 39/2015, Procedimiento Administrativo Común** (80 preguntas)

### Bloque II — Legislación Sanitaria

- **Ley 14/1986, General de Sanidad** (80 preguntas)
- **Ley 12/2001, de Ordenación Sanitaria de la CAM** (60 preguntas)
- **Ley 16/2003, de Cohesión y Calidad del SNS** (50 preguntas)
- **LO 1/2004, de Violencia de Género** (40 preguntas)

### Bloque III — Gestión administrativa y sanitaria

- **Gestión admin./sanitaria** (60 preguntas): citas y agendas, atención al paciente, documentación clínica y archivo, protección de datos, informática básica, registro y procedimiento.

Además, **tests agregados** generados dinámicamente a partir de los bancos anteriores:

- 3 tests por bloque (≈100, 100 y 60 preguntas muestreadas con pesos).
- 2 simulacros generales de 100 preguntas cada uno con distribución proporcional de todo el temario.

> **Total base: ~530 preguntas únicas** en 9 bancos fuente, más tests agregados que combinan y remuestrean el contenido. El banco crece con cada *commit* (ver sección *Contribuir*).

## Tipos de test

- **Por ley/norma**: un test por cada norma del temario.
- **Por bloque temático**: combinan aleatoriamente preguntas de todas las normas del bloque, con pesos configurables en el manifest.
- **Simulacros generales**: 100 preguntas que cubren todo el temario, simulando un examen real.

## Modos de entrenamiento

- **Modo estudio**: feedback inmediato después de cada respuesta con la explicación y la referencia al artículo correspondiente.
- **Modo examen**: se contesta todo y se ve el resultado al final. Incluye:
  - Aciertos, fallos, preguntas en blanco.
  - Nota bruta sobre 10.
  - Nota con penalización (–1/3 por fallo).
  - Revisión completa de todas las preguntas con sus explicaciones.

## Otras funcionalidades

- **Aleatorización** del orden de las preguntas y de las opciones en cada intento.
- **Navegación libre** entre preguntas, con marcador de "dudosa".
- **Enlaces compartibles**: `test.html?t=<id>&mode=exam|study`.
- **localStorage**: guarda la mejor puntuación por test y la fecha del último intento.
- **Responsive**: usable en móvil, tablet y escritorio.

---

## Cómo usarlo

### En producción

Visita la URL de despliegue en Vercel (pendiente de configurar).

### En local

Clonar el repo y servir la carpeta `public/` con cualquier servidor estático:

```bash
# Opción 1: Python
python3 -m http.server -d public 8000

# Opción 2: Node (npx)
npx serve public

# Opción 3: Con Vercel CLI
npm i -g vercel
vercel dev
```

Después abre `http://localhost:8000` en el navegador.

> **Importante**: no abras los ficheros HTML directamente con `file://` — el navegador bloquearía las peticiones `fetch()` a los JSON. Usa siempre un servidor estático.

---

## Despliegue en Vercel

El proyecto está pensado para desplegarse en Vercel como sitio estático sin build:

1. Crear cuenta en [vercel.com](https://vercel.com) y conectar el repo de GitHub.
2. Vercel detecta automáticamente la carpeta `public/` como *output*. No hay que configurar nada más (el `vercel.json` incluido basta).
3. Cada `git push` a `main` dispara un redeploy automático.

También funciona con el CLI:

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## Estructura del repositorio

```
sermas-tests/
├── README.md                        # Este fichero
├── LICENSE                          # MIT
├── vercel.json                      # Config mínima de Vercel
├── .gitignore
├── public/                          # Raíz del sitio estático
│   ├── index.html                   # Menú principal
│   ├── test.html                    # Pantalla de test
│   ├── styles.css                   # Estilos (responsive)
│   ├── app.js                       # Lógica de test
│   ├── menu.js                      # Lógica del menú
│   └── data/
│       ├── manifest.json            # Listado de tests con metadatos
│       ├── leyes/                   # Bancos de preguntas por norma
│       │   ├── ce-1978.json
│       │   ├── estatuto-cam.json
│       │   ├── ley-gobierno-cam.json
│       │   ├── ley-39-2015.json
│       │   ├── ley-14-1986.json
│       │   ├── ley-12-2001.json
│       │   ├── ley-16-2003.json
│       │   └── lo-1-2004.json
│       └── gestion/
│           └── gestion-admin-sanitaria.json
└── docs/
    └── CONTRIBUTING.md              # Cómo generar preguntas con Claude
```

Los tests por bloque y los simulacros **no tienen fichero propio**: están definidos en `manifest.json` como entradas de tipo `"aggregator"` que indican qué bancos combinar y con qué peso. `app.js` los construye al vuelo muestreando de los bancos fuente.

---

## Formato de una pregunta

```json
{
  "id": "ce-001",
  "q": "¿En qué artículo de la Constitución se reconoce el derecho a la protección de la salud?",
  "options": ["Artículo 41", "Artículo 43", "Artículo 45", "Artículo 49"],
  "correct": 1,
  "explanation": "El art. 43 CE reconoce el derecho a la protección de la salud (Título I, Capítulo III)."
}
```

- `correct` es el índice 0-3 de la opción correcta.
- `explanation` se muestra en modo estudio y en la revisión final.

Estructura del fichero de un banco:

```json
{
  "id": "ley-14-1986",
  "title": "Ley 14/1986, General de Sanidad",
  "category": "Leyes",
  "source": "BOE-A-1986-10499 (texto consolidado)",
  "lastUpdated": "2026-04-18",
  "questions": [ /* array de preguntas */ ]
}
```

---

## Contribuir (ampliar el banco de preguntas)

Este repo está diseñado para crecer con el tiempo. Cada mes se pueden generar más preguntas con ayuda de Claude (o cualquier LLM) y añadirlas mediante commits.

**Flujo rápido**:

1. Sesión con Claude: *"Generemos 80 preguntas más sobre la Ley 39/2015, capítulos IV-VI."*
2. Claude genera las preguntas en formato JSON.
3. Pegarlas en el banco correspondiente (`public/data/leyes/...`).
4. Actualizar `lastUpdated` en el fichero y `questionCount` en `manifest.json`.
5. `git commit -m "Añade 80 preguntas Ley 39/2015 (cap. IV-VI)"` → `git push`.
6. Vercel redespliega automáticamente en ~30 segundos.

La guía detallada, con ejemplos de *prompt* para Claude, está en [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md).

---

## Fuentes

- Constitución Española de 1978 (BOE 29-12-1978).
- LO 3/1983, de 25 de febrero, de Estatuto de Autonomía de la Comunidad de Madrid.
- Ley 1/1983, de 13 de diciembre, de Gobierno y Administración de la CAM.
- Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las AAPP.
- Ley 14/1986, de 25 de abril, General de Sanidad.
- Ley 12/2001, de 21 de diciembre, de Ordenación Sanitaria de la Comunidad de Madrid.
- Ley 16/2003, de 28 de mayo, de Cohesión y Calidad del SNS.
- LO 1/2004, de 28 de diciembre, de Medidas de Protección Integral contra la Violencia de Género.

Textos consolidados disponibles en [BOE.es](https://www.boe.es). Las preguntas son de elaboración propia.

---

## Licencia

MIT — ver [LICENSE](LICENSE).

Las preguntas y explicaciones son de elaboración propia. El texto de las normas es de dominio público (BOE).
