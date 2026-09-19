# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este proyecto

Panel de control de costos para **Makyta Sushi** (Nancagua, Chile). Calcula el costo de recetas a partir de insumos, controla gastos fijos y personal, y calcula el punto de equilibrio mensual.

Toda la aplicación vive en **un solo archivo**: `index.html` (~5000 líneas, HTML + CSS + JS inline, sin dependencias ni build step). Los otros dos archivos son:

- `Code.gs` — backend de Google Apps Script (se copia/pega manualmente en el editor de Apps Script; **no se despliega desde este repo**).
- `.github/workflows/static.yml` — publica el repo completo en GitHub Pages en cada push a `main`.

## Comandos

No hay build, tests, ni linter. Para desarrollar:

```bash
python3 -m http.server 8000    # luego abrir http://localhost:8000
```

Cualquier push a `main` despliega automáticamente a https://blucl.github.io/Calculadora-recetas/ (~1–2 min).

## Arquitectura de `index.html`

El archivo está dividido en bloques `<script>` numerados por comentarios `PART N`, cada uno con un módulo funcional. Para ubicarse rápido, buscar `PART ` o los banners `<!-- ===== -->`:

| Bloque | Contenido | Claves de localStorage |
|---|---|---|
| (HTML) | Lock screen, header, 5 pestañas, modales | — |
| Part 1 | Navegación, modales, toasts, formato CLP, **stubs** | — |
| Part 2 | Módulo Insumos | `makyta_insumos` |
| Part 3 | Módulo Recetas + categorías + exportaciones | `makyta_recetas`, `makyta_cat_recetas` |
| Part 4 | Gastos fijos, Personal, valor UF | `makyta_gastos`, `makyta_personal`, `makyta_uf` |
| Part 5 | Punto de equilibrio + facturas del mes | `makyta_eq_mes` |
| Part 6 | Sincronización con Google Sheets | `makyta_sheets_url`, `makyta_last_sync`, `*_ts` |
| Part 7 | Contraseña, auto-sync, configuración | `makyta_config` |

Las 5 pestañas son `#tab-insumos`, `#tab-recetas`, `#tab-gastos`, `#tab-equilibrio`, `#tab-config`.

### Trampa importante: los stubs de Part 1

Part 1 termina con una lista de funciones vacías (`saveReceta()`, `exportRecetas()`, etc.) que existen para que los `onclick` del HTML no fallen antes de que carguen los bloques posteriores. Las implementaciones reales están más abajo y **ganan por hoisting de `function`**. Al modificar el comportamiento hay que editar la definición real (la última del archivo), no el stub. Buscar con `grep -n "^function nombreFn"` y quedarse con la coincidencia de mayor número de línea.

### Capa de datos

Cada módulo define su propio par `getX()` / `setX()` sobre `localStorage` con `JSON.parse` en try/catch. `getX()` devuelve `null` (no `[]`) cuando no hay nada guardado, y los llamadores hacen `getX() || DEFAULTS_X`. La excepción deliberada es `getCatRecetas()`: las categorías **no tienen defaults** porque los ejemplos hardcodeados reaparecían en dispositivos nuevos; `syncCatsConRecetas()` las deriva de las recetas realmente guardadas.

Part 7 envuelve `setInsumos`, `setRecetas`, `setGastos` y `setPersonal` en `window[name]` para disparar `scheduleSync()` (auto-sync con debounce de 2.5 s) en cada escritura. Si se agrega un nuevo setter que deba sincronizar, hay que añadirlo a ese array en `wrapSetters()`.

### Recetas anidadas

Un ingrediente es `{insumoId, cantidad}` **o** `{recetaId, cantidad}` (una sub-receta). `calcCostoReceta()` resuelve la cadena recursivamente y lleva un `Set` `_seen` para no colgarse si los datos tuvieran un ciclo. `recetaContieneA()` hace la comprobación inversa y se usa para impedir que una receta se incluya a sí misma. Al borrar una receta hay que limpiar las referencias `recetaId` en las demás.

El semáforo de margen (`semaforoData`) usa % de costo sobre precio: <25 % verde, 25–35 % amarillo, >35 % rojo. **El precio de venta 0 es válido** — hay recetas internas que solo sirven para controlar costos y no se cobran al cliente; las validaciones usan `precio < 0`, nunca `<= 0`.

### Sincronización con Google Sheets

`syncData()` hace PUSH de todo el estado a la URL del Apps Script; `loadFromSheets()` hace PULL al arrancar. La resolución de conflictos es por timestamp ISO: se compara `localStorage[key + '_ts']` contra el `ts` remoto y **gana el más reciente**, clave por clave.

Al agregar una clave nueva a la sincronización hay que tocar **cuatro** lugares, o la clave se sincroniza a medias:
1. El `payload` de `syncData()` (Part 6)
2. El array de timestamps que se escriben tras un PUSH exitoso (Part 6)
3. El array `keys` de `loadFromSheets()` (Part 6)
4. `SYNC_KEYS` en `Code.gs` — y después **volver a desplegar el Apps Script** ("Implementar → Administrar implementaciones → Nueva versión"), porque el script no se actualiza solo.

El backend guarda en `PropertiesService.getScriptProperties()`, no en celdas de la hoja.

### Autenticación

`checkPin()` compara el SHA-256 de lo ingresado (vía `crypto.subtle.digest`) contra un hash literal en el código, y guarda `sessionStorage.makyta_auth = '1'`. Es ofuscación del lado cliente, no seguridad real: solo evita que la contraseña sea legible en el fuente público de GitHub. **No hay que reintroducir la contraseña en texto plano**, ni moverla a un GitHub Secret con placeholder (se intentó y rompió el login cuando el Secret no estaba configurado).

## Convenciones

- **Todo el texto de la interfaz, los comentarios y los mensajes de commit van en español.** El usuario pide explícitamente respuestas en español.
- Moneda: siempre vía `clp(n)` para mostrar, `fmtInput(el)` para formatear mientras se escribe y `parseInputVal(id)` para leer. Nunca parsear un input de moneda a mano — llevan separadores de miles `es-CL`.
- Ordenamientos alfabéticos con `localeCompare(x, 'es')`.
- **Visibilidad:** existe `.hidden { display: none !important }`. Usar `classList.add/remove('hidden')`; asignar `style.display` no funciona porque el `!important` lo pisa.
- Escapar siempre con `esc()` al construir HTML por `innerHTML` con datos del usuario.
- Los avisos al usuario van por `showToast(msg, type)`; los borrados por `confirmDelete(title, text, onConfirm)` (hay un `confirm()` nativo suelto en `disconnectSheets`).
- Tema oscuro: la escala `--gray-*` de `:root` está **invertida** respecto a la convención habitual — `--gray-900` es el texto más claro y `--gray-50` el fondo más oscuro.

## Dependencias externas

- `mindicador.cl/api/uf` — valor UF del día para gastos indexados. Falla en silencio y cae al último valor cacheado o a `UF_FALLBACK`.
- El endpoint de Apps Script, cuya URL por defecto está hardcodeada en Part 6 y puede sobrescribirse desde Configuración.
