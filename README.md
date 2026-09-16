# App — Chequeo Médico de Operadores

Primera versión funcional de la aplicación móvil.

## Características actuales
- Diseño responsive para celular, tablet y computadora.
- Fecha y hora son MANUALES (se rellenan inicialmente con la fecha/hora actual, pero el usuario puede modificarlas).
- Captura de todos los parámetros del formato de Registro de chequeo médico.
- Validaciones básicas de datos.
- Guardado local en el dispositivo mediante localStorage.
- Historial de registros locales.
- Exportación CSV.
- PWA básica para instalación en dispositivos compatibles.
- Preparada para conectar con Google Sheets mediante Google Apps Script.

## Conexión con Google Sheets
El archivo `google_apps_script.gs` contiene el receptor para guardar cada registro en una hoja llamada `Registro`.

Después de desplegar el Apps Script como aplicación web, copia su URL `/exec` y asigna:
API_URL = "URL_DE_TU_APLICACION_WEB";
en `app.js`.

## Nota de arquitectura
Esta primera versión prioriza la captura y funcionamiento móvil. Antes de ponerla en uso real con datos de pacientes/empleados, conviene agregar autenticación, control de acceso, cifrado/seguridad, política de respaldo y un mecanismo de sincronización robusto.
