# 📱 WhatsApp Validator Service - CRM Pietra Fina

Microservicio para verificar si un número de teléfono tiene cuenta de WhatsApp usando `whatsapp-web.js`.

## 🚀 Características

- ✅ Verificación real de números de WhatsApp
- 🔐 Autenticación con código QR
- 💾 Persistencia de sesión
- 🌐 API REST simple
- 📊 Panel de estado web
- 🔄 Reconexión automática
- 🛡️ Manejo de errores robusto

## 📋 Requisitos

- Node.js >= 16.0.0
- NPM o Yarn
- WhatsApp instalado en tu teléfono
- Conexión a internet

## 🛠️ Instalación

1. **Clonar o descargar el proyecto**
   ```bash
   cd whatsapp-validator-service
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar el servicio**
   ```bash
   npm start
   ```

4. **Para desarrollo (con auto-reload)**
   ```bash
   npm run dev
   ```

## 🔧 Configuración

### Variables de entorno (opcional)
```bash
PORT=3000  # Puerto del servidor (por defecto: 3000)
```

### CORS
El servicio está configurado para aceptar peticiones desde:
- `http://localhost:5000` (Firebase local)
- `http://127.0.0.1:5000`
- `https://crm-pietrafina.web.app` (producción)

## 📱 Primer uso - Autenticación con WhatsApp

1. **Iniciar el servicio**
   ```bash
   npm start
   ```

2. **Abrir el navegador**
   ```
   http://localhost:3000
   ```

3. **Escanear el código QR**
   - Abre WhatsApp en tu teléfono
   - Ve a Configuración > Dispositivos vinculados
   - Escanea el código QR que aparece en la terminal o en la página web

4. **¡Listo!**
   - El servicio estará autenticado y listo para usar
   - La sesión se guardará automáticamente para futuros usos

## 🔗 Endpoints disponibles

### 1. Verificar número de WhatsApp
```http
GET /check-whatsapp/:numero
```

**Ejemplo:**
```bash
curl http://localhost:3000/check-whatsapp/521332261234
```

**Respuesta:**
```json
{
  "numero": "521332261234",
  "tieneWhatsapp": true,
  "timestamp": "2025-01-29T23:16:00.000Z"
}
```

### 2. Estado del servicio
```http
GET /status
```

**Respuesta:**
```json
{
  "status": "running",
  "whatsappReady": true,
  "qrGenerated": false,
  "timestamp": "2025-01-29T23:16:00.000Z"
}
```

### 3. Obtener código QR
```http
GET /qr
```

### 4. Reiniciar servicio
```http
POST /restart
```

### 5. Prueba del servicio
```http
GET /test
```

## 🧪 Pruebas

### Prueba básica
```bash
# Verificar estado
curl http://localhost:3000/status

# Probar endpoint
curl http://localhost:3000/test

# Verificar un número
curl http://localhost:3000/check-whatsapp/521332261234
```

### Prueba desde el navegador
1. Abre `http://localhost:3000`
2. Usa los botones de la interfaz web
3. Prueba diferentes números

## 🔌 Integración con el CRM

El CRM ya está configurado para usar este microservicio. Las funciones de validación de WhatsApp en `script.js` han sido actualizadas para llamar al endpoint:

```javascript
const validateWhatsAppNumber = async (phoneNumber) => {
    try {
        // ... validación de formato ...
        
        // Llamar al microservicio
        const response = await fetch(`http://localhost:3000/check-whatsapp/${formattedNumber}`);
        
        if (!response.ok) {
            return false;
        }
        
        const data = await response.json();
        return data.tieneWhatsapp;
        
    } catch (error) {
        console.error('Error validando número de WhatsApp:', error);
        return true; // Fallback si el servicio no está disponible
    }
};
```

## 🚨 Solución de problemas

### Error: "Cliente de WhatsApp no está listo"
- Verifica que hayas escaneado el código QR
- Revisa la consola del servidor para errores
- Usa el endpoint `/restart` para reiniciar

### Error: "Error de autenticación"
- La sesión puede haber expirado
- Reinicia el servicio con `/restart`
- Escanea el nuevo código QR

### Error: "Servicio no responde"
- Verifica que el puerto 3000 esté libre
- Revisa los logs del servidor
- Asegúrate de que Node.js esté instalado correctamente

### Error: "CORS"
- Verifica que el origen del CRM esté en la lista de CORS
- Asegúrate de que estés usando la URL correcta

## 📁 Estructura del proyecto

```
whatsapp-validator-service/
├── whatsapp-validator-service.js  # Servidor principal
├── package.json                   # Dependencias
├── README.md                      # Este archivo
├── .wwebjs_auth/                  # Sesiones de WhatsApp (se crea automáticamente)
└── public/                        # Archivos estáticos (se crea automáticamente)
```

## 🔒 Seguridad

- ✅ CORS configurado para orígenes específicos
- ✅ Validación de entrada en todos los endpoints
- ✅ Manejo de errores sin exponer información sensible
- ✅ Sesiones locales (no se envían datos a servidores externos)

## 📝 Notas importantes

1. **Sesión única**: Solo una instancia del servicio puede estar autenticada a la vez
2. **Persistencia**: La sesión se guarda localmente y se reutiliza automáticamente
3. **Reconexión**: El servicio se reconecta automáticamente si se pierde la conexión
4. **Rate limiting**: WhatsApp puede limitar las consultas si se hacen demasiadas rápidamente
5. **Uso personal**: Este servicio es para uso interno del CRM, no para uso comercial masivo

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs en la consola del servidor
2. Verifica que WhatsApp esté funcionando en tu teléfono
3. Asegúrate de que el número que estás verificando tenga el formato correcto
4. Reinicia el servicio si es necesario

## 📄 Licencia

MIT License - MVGN Labs 2025 