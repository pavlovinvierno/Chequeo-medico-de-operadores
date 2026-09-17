/**
 * BACKEND — REGISTRO DE CHEQUEO MÉDICO DE OPERADORES
 * Google Apps Script para recibir registros desde la aplicación.
 *
 * CONFIGURACIÓN:
 * 1) Crea una Google Sheet.
 * 2) En esa hoja: Extensiones > Apps Script.
 * 3) Pega este código completo.
 * 4) Guarda el proyecto.
 * 5) Implementar > Nueva implementación.
 * 6) Tipo: Aplicación web.
 * 7) Ejecutar como: tu cuenta.
 * 8) Acceso: selecciona la opción que permita a los usuarios de la app
 *    enviar datos según las políticas de tu organización.
 * 9) Copia la URL que termina en /exec.
 * 10) Colócala en API_URL dentro de app.js.
 *
 * IMPORTANTE:
 * No compartas públicamente la hoja si contiene datos personales o médicos.
 */

const SHEET_NAME = "Registro";

const HEADERS = [
  "ID registro",
  "Fecha",
  "Hora",
  "# Empleado",
  "Nombre",
  "DM",
  "HTA",
  "Antidoping",
  "Alcoholímetro",
  "Destino",
  "Tensión arterial",
  "Temp. corporal",
  "Glucosa",
  "Peso (kg)",
  "FC",
  "SpO₂",
  "Apto (Sí/No)",
  "Motivo",
  "Observación",
  "Atendió",
  "Fecha de sincronización"
];

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      service: "Registro de chequeo médico",
      status: "online"
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No se recibió información.");
    }

    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    ensureHeaders_(sheet);

    const id = data.id_registro || Utilities.getUuid();
    const syncedAt = new Date();

    sheet.appendRow([
      id,
      data.fecha || "",
      data.hora || "",
      data.empleado || "",
      data.nombre || "",
      data.dm || "",
      data.hta || "",
      data.antidoping || "",
      data.alcoholimetro || "",
      data.destino || "",
      data.tension_arterial || "",
      data.temperatura || "",
      data.glucosa || "",
      data.peso || "",
      data.fc || "",
      data.spo2 || "",
      data.apto || "",
      data.motivo || "",
      data.observacion || "",
      data.atendio || "",
      syncedAt
    ]);

    return json_({
      ok: true,
      id_registro: id,
      message: "Registro guardado correctamente"
    });

  } catch (err) {
    return json_({
      ok: false,
      error: String(err)
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (_) {}
  }
}

function ensureHeaders_(sheet) {
  const current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];

  let needsHeaders = sheet.getLastRow() === 0;
  if (!needsHeaders) {
    needsHeaders = HEADERS.some((h, i) => current[i] !== h);
  }

  if (needsHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight("bold");
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
