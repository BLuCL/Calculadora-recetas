/**
 * Makyta Sushi — Apps Script (Google Sheets backend)
 *
 * INSTRUCCIONES DE DESPLIEGUE:
 * 1. Abre Google Sheets → Extensiones → Apps Script
 * 2. Pega todo este código (reemplaza lo que haya)
 * 3. Guarda (Ctrl+S)
 * 4. Haz clic en "Implementar" → "Nueva implementación"
 * 5. Tipo: "Aplicación web"
 *    · Ejecutar como: "Yo"
 *    · Quién tiene acceso: "Cualquier usuario"
 * 6. Copia la URL generada (termina en /exec) y pégala en
 *    Configuración → Google Sheets de la app Makyta
 *
 * Si ya tenías una versión anterior desplegada, haz
 * "Implementar" → "Administrar implementaciones" →
 * edita la existente y sube la versión.
 */

// Claves que se sincronizan entre la app y Google Sheets
const SYNC_KEYS = [
  'makyta_insumos',
  'makyta_recetas',
  'makyta_gastos',
  'makyta_personal',
  'makyta_config',
  'makyta_cat_recetas',
];

/* ── POST: la app envía datos → los guardamos en Properties ── */
function doPost(e) {
  try {
    const data  = JSON.parse(e.postData.contents);
    const props = PropertiesService.getScriptProperties();
    const ts    = new Date().toISOString();

    if (data.action === 'saveAll') {
      SYNC_KEYS.forEach(key => {
        if (data[key] !== undefined) {
          props.setProperty(key,          JSON.stringify(data[key]));
          props.setProperty(key + '_ts',  ts);
        }
      });
      return respond({ ok: true, ts: ts });
    }

    return respond({ ok: false, error: 'Acción desconocida' });

  } catch (err) {
    return respond({ ok: false, error: err.message });
  }
}

/* ── GET: la app pide datos → devolvemos lo guardado ─────── */
function doGet(e) {
  try {
    if (e.parameter.action === 'load') {
      const props  = PropertiesService.getScriptProperties();
      const result = {};

      SYNC_KEYS.forEach(key => {
        const raw = props.getProperty(key);
        const ts  = props.getProperty(key + '_ts') || '';
        if (raw) {
          result[key] = { value: JSON.parse(raw), ts: ts };
        }
      });

      return respond({ ok: true, data: result });
    }

    return respond({ ok: false, error: 'Acción desconocida' });

  } catch (err) {
    return respond({ ok: false, error: err.message });
  }
}

/* ── Helper ─────────────────────────────────────────────── */
function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
