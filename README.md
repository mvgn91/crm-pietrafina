# CRM Pietrafina

## Estado del proyecto (2026-11-20)

- **CRM DEFINITIVO y único: v2 (Firebase)** → <https://crm-pietrafina-v2.web.app>. Aquí se cargan, consultan y gestionan todos los prospectos (colección `prospects` de Firestore).
- **v1 (Vercel) DEPRECADA**: ya no se alimenta, no se agregan prospectos ahí y no se usa. No hacer cambios, no agregar datos y no desplegar en v1.

## Dónde vive el código de la v2

- Repositorio: `mvgn91/crm-pietrafina`. Rama de la v2 desplegada: **`main`**.
- Código fuente: carpeta [`public/`](public/). Es un sitio estático con ES modules y Firebase SDK 11.6.1 cargado desde `gstatic`.
  - `public/index.html` — login y selección de rol.
  - `public/admin-app.html` — **Gestión** (panel de administración).
  - `public/prospeccion.html` — Prospección y planificador semanal.
  - `public/dashboard.html` — Dashboard general.
  - `public/api.js` — acceso a Firestore (`subscribeToProspects`, altas, ediciones, notas).
  - `public/firebase.js` — configuración de Firebase y autenticación.
  - `public/ui.js` — render compartido (listas, modales, tarjetas, estados de carga).
- `OLD/` contiene código legacy solo como referencia histórica: no editar ni desplegar.
- `preview-fase1` / `preview-fase2` son ramas de borrador: **no son la v2 en producción**.

## URLs de la v2

| Pantalla | Ruta |
| --- | --- |
| Login | `/index.html` |
| Gestión (panel de administración) | `/admin-app.html` |
| Prospección | `/prospeccion.html` |
| Dashboard | `/dashboard.html` |

> Nota: la gestión se conoce informalmente como "/admin", pero en este repo **no existe una ruta `/admin`**: el enlace del login apunta a `/admin-app.html` y Firebase redirige cualquier ruta desconocida a `/index.html`.

## Cómo se despliega

- Proyecto Firebase: `crm-pietrafina` (ver `.firebaserc`).
- `firebase.json` define dos targets de Hosting que publican **el mismo directorio `public/`**:
  - `crm-produccion` → sitio `crm-pietrafina` (`crm-pietrafina.web.app`).
  - `crm-nuevo` → sitio `crm-pietrafina-123`.
- El repo **no nombra explícitamente** `crm-pietrafina-v2.web.app`; antes de desplegar hay que confirmar en Firebase Console (o con `firebase hosting:sites:list`, que requiere login) cuál de esos targets corresponde al sitio v2 y usar ese target, p. ej. `firebase deploy --only hosting:crm-nuevo`.
- **No desplegar sin autorización de Armand.**

## Comportamiento de carga de prospectos

La lista no muestra "0 prospectos" hasta recibir el primer snapshot del servidor:

- Mientras carga se muestra `Cargando prospectos…`.
- Si el listener falla, se muestra `Sin conexión con el servidor. Reintentando…` y se re-suscribe con backoff (2 s → 4 s → … → 30 s).
- Un snapshot vacío proveniente de caché se ignora; solo un snapshot del servidor puede confirmar que realmente hay 0 documentos.
- Al volver a una pestaña inactiva (`visibilitychange`) o recuperarse la red (`online`), se re-suscribe si no hay datos o si el listener murió.
- No se usa caché persistente en disco (`persistentLocalCache`) ni `getDocs` de respaldo: esa decisión de privacidad/endurecimiento está pendiente de autorización.
