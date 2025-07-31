# CRM Pietra Fina

Sistema de gestión de prospectos para Pietra Fina.

## 🚀 Deploy en Vercel

Este proyecto es una aplicación web estática que se puede desplegar directamente en Vercel sin necesidad de build.

### Configuración para Vercel

1. **Conectar el repositorio** a Vercel
2. **Framework Preset**: Seleccionar "Other" o "Static Site"
3. **Build Command**: Dejar vacío (no se requiere build)
4. **Output Directory**: Dejar vacío (archivos en raíz)
5. **Install Command**: `npm install` (opcional, solo para dependencias de desarrollo)

### Archivos de Configuración

- `vercel.json`: Configuración específica para Vercel
- `.vercelignore`: Archivos a excluir del deploy
- `package.json`: Configurado para aplicación estática

### Estructura del Proyecto

```
CRM PIETRAFINA/
├── index.html              # Página principal
├── script.js               # Lógica del CRM
├── style.css               # Estilos
├── whatsapp-massive.html   # Página de envío masivo
├── assets/                 # Imágenes y recursos
├── vercel.json            # Configuración de Vercel
└── .vercelignore          # Archivos a ignorar
```

### Variables de Entorno

Si necesitas configurar variables de entorno en Vercel:

1. Ve a Settings > Environment Variables
2. Agrega las variables necesarias para Firebase

### Notas Importantes

- Este es un proyecto **estático**, no requiere build
- Los archivos se sirven directamente desde la raíz
- El microservicio de WhatsApp se despliega por separado
- Firebase se configura directamente en el frontend

## 🛠️ Desarrollo Local

Para desarrollo local, simplemente abre `index.html` en tu navegador o usa un servidor local:

```bash
# Con Python
python -m http.server 8000

# Con Node.js
npx serve .

# Con PHP
php -S localhost:8000
```

## 📱 Características

- ✅ Gestión de prospectos
- ✅ Flujo de estatus visual
- ✅ Integración con WhatsApp
- ✅ Dashboard de métricas
- ✅ Responsive design
- ✅ Autenticación con Firebase 