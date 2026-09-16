# App — Chequeo Médico de Operadores — v2

## Cambios de esta versión
- Antidoping: Negativo / Positivo / **No aplica**.
- Alcoholímetro: Negativo / Positivo / **No aplica**. Ya no captura valores numéricos.
- Tensión arterial, temperatura, glucosa, peso, frecuencia cardiaca y SpO₂:
  - captura manual, o
  - opción **No aplica**.
- Los registros se agrupan por **fecha**.
- Cada día muestra el número de chequeos.
- Se puede exportar **todo un día en un solo CSV**, evitando exportaciones individuales.
- También se mantiene la exportación de todos los registros.
- Fecha y hora siguen siendo editables manualmente.
- El almacenamiento local continúa disponible para uso sin conexión.
- Preparada para sincronización futura con Google Sheets.

## Importante
La clave de almacenamiento cambió a `v2`, por lo que los registros de la v1 no se muestran automáticamente en la v2. Esto evita mezclar estructuras diferentes durante las pruebas.

Antes de uso real con datos personales/laborales, debe añadirse autenticación, control de acceso, seguridad de datos y una política de respaldo/sincronización.
