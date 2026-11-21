# Port SIEMDES → Pietrafina, Fase 2

Origen local proporcionado por el operador: `../siemdes-referencia/public/`. No se descargó ni inventó un módulo ausente: todos los archivos solicitados existen. Los hashes siguientes identifican exactamente la referencia usada.

## Adaptaciones

- Pipeline: conserva utilidades de fechas, historial, último contacto, semáforo y terminales. Corrige validación de fechas imposibles y serialización ISO; sustituye guardas de visita/cotización (no existen como estatus de PF) por validación de once etiquetas, nota, fecha y reapertura explícita. No se impone una nueva reducción ni una secuencia comercial obligatoria.
- Reactivación: conserva el patrón puro elegibilidad/fila/búsqueda/priorización, cambia las condiciones SIEMDES (campaña/llamada previa/15 días) por las reglas PF de estatus y fecha. No importa reglas de Alfredo ni de visitas técnicas.
- Cadencia: conserva clasificación y agrupación de campaña; añade cálculo explícito de los tres toques WA/llamada/WA 1/4/8, nota y cierre +30. Corrige el signo de días futuros del origen.
- Plantillas/WhatsApp: conserva sustitución de tokens, omisión de datos faltantes, enlace y puente compartido. Añade textos PF/editabilidad local/formato Nico; valida teléfono mexicano. No cuenta una apertura como envío.
- Segmentos: conserva filtros y conteos, adapta etiquetas a PF y añade tipos de negocio y prioridad comercial.
- Recordatorios: conserva una sola tarea por prospecto y precedencia de cadencia; añade resumen lunes-viernes y semana vacía.
- Métricas: conserva el cálculo original para eventos de envío y añade lectura de `followUpNotes` por campaña, que es donde PF conserva evidencia. No exige una nueva subcolección.
- CSV: conserva generador, escape, BOM y descarga; añade parser e importador de respaldo completo en JSON por fila. El origen no tenía importador.
- Config/preview: conserva constantes centralizadas y datos de demo aislados. No se copian proyectos Firebase, identidad, servicios, enlaces o datos comerciales de SIEMDES a la configuración de PF.
- HTML/controladores: las pantallas de origen usan el CSS de SIEMDES (`assets/app.css`), inexistente en PF. Se adaptó su estructura de filtros/lista/captura/previa al contenedor, fuentes, colores y logo existentes de PF. Las capturas de visitas técnicas, equipos, anfitrión Alfredo y firma de SIEMDES no pertenecen al alcance de PF.

La persistencia de esta entrega está aislada en borradores locales por UID, o en un espacio `preview` separado. No hay un adaptador que escriba la Fase 2 en Firestore. Las operaciones CRUD anteriores de Fase 1 conservan su comportamiento, salvo el puente de preparación WhatsApp documentado en el reporte.

## SHA-256 del origen

| Archivo | SHA-256 |
| --- | --- |
| `reactivacion.html` | `c2fed155fdf67c58f18e8da65be1bbb05364aceb7a40c9fce15cf321a7b6d7c5` |
| `reactivacion-model.js` | `52d119c9b5b00e056b4895a65d5dcb31f7af80f959dcbf0d1f24dd9c2e28d8b0` |
| `reactivacion-script.js` | `13be4f032fed6c67ead080bb633eda6548809717d8200b822f8155e48b5dc41a` |
| `cadencia.html` | `b2ad828234030929c82b6738a81be5384e4c7ea01d552c12e31fce0c5fccdad5` |
| `cadencia-script.js` | `5aace147b2d120b97f06b5dd5a7dcbb93a457dda2f7c30c85d54b77857cf0d51` |
| `plantillas.html` | `823d5df5ebc5359f1788d6f3008e51610c4abc48ae3628c7e3ea2b746f07c06f` |
| `plantillas-script.js` | `70a09baf2094b74d7e95177c5c4a56bc2f2a2cc0d5a57c9ec53c3a20753bd4f9` |
| `plantillas.json` | `6702d5801bf8645aeab7046f03150d67e629648480724b5441d8dc9ce3b9eef6` |
| `pipeline-model.js` | `d7e0fd9b04683a64859d80b45c62811a6ae0f9697f6411d7b61e5cd09e18dba6` |
| `segmentos-model.js` | `6f60ce22322d08b090a7bc4bf0cd4885f941a465b38bed8e4dcd0aa0f8ffea5b` |
| `recordatorios-model.js` | `7ad69d759e36f6707fa8e2fc96da22eca5849161f190f87305d10a4222dfbb4a` |
| `campania-model.js` | `7af3a752134854e3660cde157ca12b127f5d6d071c6c175fb84eeadc060cca06` |
| `campana-metricas-model.js` | `357d83d16fde128e7674f98c019cfb713f7220479c273c1706d8807dc85cd238` |
| `csv-model.js` | `819d17bb095437eaef843af2f4d27784d0af1ea925ab46e76d5986da8e723ec1` |
| `whatsapp-model.js` | `b66383891f606a6d05ad5cfee029b3ba6fcf6a708abf200b816f7b7f8536298e` |
| `whatsapp-envio.js` | `89102291dbb312682a9fbef17447683a22cf590b2c06cea20a6b0e3e445000c8` |
| `config.js` | `d2d6f8490b376ba4a5e4a46d1798bf1985613b46055f0e9b59a63828c390a072` |
| `preview.js` | `2ad399e6f2de61c4387c1db02c63548a01e1552576be1bad71e3f74537a72962` |
