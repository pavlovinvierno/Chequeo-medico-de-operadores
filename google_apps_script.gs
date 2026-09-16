/**
 * GOOGLE APPS SCRIPT — receptor de registros de Chequeo Médico
 *
 * 1. Abre la hoja de Google Sheets que utilizarás.
 * 2. Extensiones > Apps Script.
 * 3. Pega este código.
 * 4. Implementar > Nueva implementación > Aplicación web.
 * 5. Ejecutar como: Tú.
 * 6. Quién tiene acceso: según las políticas de tu organización.
 * 7. Copia la URL /exec y colócala en API_URL dentro de app.js.
 */

const SHEET_NAME = "Registro";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    const headers = [
      "Fecha","Hora","# Empleado","Nombre","DM","HTA","Antidoping",
      "Alcoholímetro","Destino","Tensión arterial","Temp. corporal",
      "Glucosa","Peso (kg)","FC","SpO₂","Apto (Sí/No)",
      "Motivo","Observación","Atendió"
    ];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }

    sheet.appendRow([
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
      data.atendio || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ok:true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ok:false,error:String(err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
