# Configuración Google Sheets — v3.1

La aplicación está preparada para enviar registros a una implementación de Google Apps Script.

## Importante sobre CORS

GitHub Pages y Google Apps Script están en dominios distintos. Google Apps Script no expone encabezados CORS que permitan a la aplicación leer directamente la respuesta de `fetch()`.

La aplicación v3.1 evita el bloqueo enviando el JSON como `text/plain` con `mode: "no-cors"`. El navegador no puede leer la respuesta, pero la solicitud POST sí puede llegar al Apps Script. Cada registro tiene un ID único y el backend evita duplicados cuando un registro se reintenta.

Por esta razón, el estado local usa **enviado** en lugar de afirmar que la respuesta del servidor fue leída y confirmada por el navegador.

## Configuración

1. Crea una Google Sheet.
2. Abre **Extensiones → Apps Script**.
3. Pega el contenido de `google_apps_script.gs`.
4. Guarda.
5. **Implementar → Nueva implementación**.
6. Tipo: **Aplicación web**.
7. Ejecutar como: tu cuenta.
8. Configura el acceso de acuerdo con la política de tu organización.
9. Copia la URL que termina en `/exec`.
10. Si cambia la implementación, actualiza `API_URL` en `app.js`.

## Prueba

- Guarda un registro desde la aplicación.
- Debe aparecer el mensaje **Registro enviado a Google Sheets**.
- Revisa la pestaña `Registro` de la hoja.
- Si no hay internet, el registro permanece local como **pendiente** y puede enviarse después con **SINCRONIZAR PENDIENTES**.

No compartas públicamente la hoja si contiene datos personales o médicos.
