# CONEXIÓN REAL CON GOOGLE SHEETS

## Paso 1 — Crear la hoja
En Google Drive crea una hoja de cálculo nueva, por ejemplo:

**Registro Médico de Operadores**

No necesitas crear las columnas manualmente: el Apps Script las crea.

## Paso 2 — Crear el Apps Script
Dentro de la hoja:
**Extensiones → Apps Script**

Borra el código que aparezca y pega el contenido de `google_apps_script.gs`.

Guarda el proyecto.

## Paso 3 — Publicarlo como aplicación web
En Apps Script:
**Implementar → Nueva implementación**

Selecciona:
**Tipo de implementación: Aplicación web**

Ejecutar como:
**Tu cuenta**

Quién tiene acceso:
elige la configuración que corresponda a tu organización. Si se permite acceso público, la URL puede recibir solicitudes sin iniciar sesión, por lo que debe evaluarse cuidadosamente antes de utilizar datos médicos reales.

Presiona **Implementar** y autoriza los permisos solicitados.

Copia la URL que termina en:
`/exec`

## Paso 4 — Colocar la URL en la app
Abre `app.js` y busca:

`const API_URL = "";`

Cámbialo por:

`const API_URL = "TU_URL_DEL_APPS_SCRIPT";`

Guarda el archivo y vuelve a subirlo a GitHub.

## Paso 5 — Prueba
Haz un registro de prueba desde el celular.

Al guardar:
1. Se conserva localmente.
2. La app intenta enviarlo a Google Sheets.
3. Si se recibe correctamente, aparecerá una nueva fila en la pestaña `Registro`.
4. Si no hay internet, queda como pendiente y puede intentarse la sincronización posteriormente desde **VER REGISTROS POR DÍA → SINCRONIZAR PENDIENTES**.

## Estructura que recibirá Google Sheets

ID registro | Fecha | Hora | # Empleado | Nombre | DM | HTA | Antidoping | Alcoholímetro | Destino | Tensión arterial | Temp. corporal | Glucosa | Peso (kg) | FC | SpO₂ | Apto (Sí/No) | Motivo | Observación | Atendió | Fecha de sincronización

## Seguridad

Antes de utilizar el sistema con datos reales:
- restringir el acceso a la Google Sheet;
- definir quién puede consultar/modificar los registros;
- utilizar cuentas institucionales cuando corresponda;
- revisar las políticas internas de manejo de datos;
- evitar compartir públicamente la hoja;
- considerar autenticación de usuarios y controles de acceso más estrictos si el proyecto pasa a producción.

Esta versión ya incorpora una identificación única por registro y estado local/sincronizado.
