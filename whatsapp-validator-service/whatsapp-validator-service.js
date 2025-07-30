const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar CORS para permitir peticiones desde el CRM
app.use(cors({
    origin: ['http://localhost:5000', 'http://127.0.0.1:5000', 'https://crm-pietrafina.web.app'],
    credentials: true
}));

app.use(express.json());

// Variables globales para el cliente de WhatsApp
let client = null;
let isClientReady = false;
let qrCodeGenerated = false;
let sessionData = null;

// Directorio para almacenar la sesión
const sessionDir = path.join(__dirname, '.wwebjs_auth');
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

// Función para inicializar el cliente de WhatsApp
const initializeWhatsAppClient = () => {
    if (client) {
        console.log('Cliente de WhatsApp ya inicializado');
        return;
    }

    console.log('🔧 Inicializando cliente de WhatsApp...');
    
    client = new Client({
        authStrategy: new LocalAuth({
            clientId: 'pietrafina-crm',
            dataPath: sessionDir
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        }
    });

    // Evento cuando se genera el código QR
    client.on('qr', (qr) => {
        console.log('📱 Código QR generado:');
        qrcode.generate(qr, { small: true });
        qrCodeGenerated = true;
        
        // Guardar el QR en un archivo para acceso web
        const qrPath = path.join(__dirname, 'public', 'qr-code.txt');
        fs.writeFileSync(qrPath, qr);
    });

    // Evento cuando el cliente está listo
    client.on('ready', () => {
        console.log('✅ Cliente de WhatsApp listo!');
        isClientReady = true;
        qrCodeGenerated = false;
        
        // Limpiar archivo QR
        const qrPath = path.join(__dirname, 'public', 'qr-code.txt');
        if (fs.existsSync(qrPath)) {
            fs.unlinkSync(qrPath);
        }
    });

    // Evento de autenticación
    client.on('authenticated', (session) => {
        console.log('🔐 Cliente autenticado');
        sessionData = session;
    });

    // Evento de autenticación fallida
    client.on('auth_failure', (msg) => {
        console.error('❌ Error de autenticación:', msg);
        isClientReady = false;
    });

    // Evento de desconexión
    client.on('disconnected', (reason) => {
        console.log('🔌 Cliente desconectado:', reason);
        isClientReady = false;
        client = null;
        
        // Reintentar conexión después de 5 segundos
        setTimeout(() => {
            console.log('🔄 Reintentando conexión...');
            initializeWhatsAppClient();
        }, 5000);
    });

    // Inicializar el cliente
    client.initialize().catch(err => {
        console.error('❌ Error inicializando cliente:', err);
    });
};

// Función para verificar si un número tiene WhatsApp
const checkWhatsAppNumber = async (phoneNumber) => {
    if (!isClientReady || !client) {
        throw new Error('Cliente de WhatsApp no está listo');
    }

    try {
        // Formatear el número (agregar @c.us para WhatsApp Web)
        const formattedNumber = phoneNumber.includes('@c.us') 
            ? phoneNumber 
            : `${phoneNumber}@c.us`;

        console.log(`🔍 Verificando número: ${formattedNumber}`);

        // Verificar si el número existe en WhatsApp
        const isRegistered = await client.isRegisteredUser(formattedNumber);
        
        console.log(`📱 Número ${phoneNumber} ${isRegistered ? 'tiene' : 'no tiene'} WhatsApp`);
        
        return isRegistered;
        
    } catch (error) {
        console.error(`❌ Error verificando número ${phoneNumber}:`, error);
        throw error;
    }
};

// Endpoint principal para verificar números
app.get('/check-whatsapp/:numero', async (req, res) => {
    try {
        const { numero } = req.params;
        
        // Validar formato del número
        if (!numero || numero.length < 10) {
            return res.status(400).json({
                error: 'Número inválido',
                numero: numero,
                tieneWhatsapp: false
            });
        }

        // Limpiar el número (remover caracteres no numéricos)
        const cleanNumber = numero.replace(/\D/g, '');
        
        // Verificar si el cliente está listo
        if (!isClientReady) {
            return res.status(503).json({
                error: 'Servicio de WhatsApp no está listo',
                numero: cleanNumber,
                tieneWhatsapp: false,
                message: 'Esperando autenticación de WhatsApp'
            });
        }

        // Verificar el número
        const tieneWhatsapp = await checkWhatsAppNumber(cleanNumber);
        
        res.json({
            numero: cleanNumber,
            tieneWhatsapp: tieneWhatsapp,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error en endpoint /check-whatsapp:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            numero: req.params.numero,
            tieneWhatsapp: false,
            message: error.message
        });
    }
});

// Endpoint para verificar el estado del servicio
app.get('/status', (req, res) => {
    res.json({
        status: 'running',
        whatsappReady: isClientReady,
        qrGenerated: qrCodeGenerated,
        timestamp: new Date().toISOString()
    });
});

// Endpoint para obtener el código QR (si está disponible)
app.get('/qr', (req, res) => {
    if (!qrCodeGenerated) {
        return res.status(404).json({
            error: 'No hay código QR disponible',
            message: 'El cliente ya está autenticado o no se ha generado QR'
        });
    }
    
    const qrPath = path.join(__dirname, 'public', 'qr-code.txt');
    if (fs.existsSync(qrPath)) {
        const qrCode = fs.readFileSync(qrPath, 'utf8');
        res.json({
            qr: qrCode,
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(404).json({
            error: 'Código QR no encontrado'
        });
    }
});

// Endpoint para reiniciar el cliente
app.post('/restart', async (req, res) => {
    try {
        console.log('🔄 Reiniciando cliente de WhatsApp...');
        
        if (client) {
            await client.destroy();
        }
        
        client = null;
        isClientReady = false;
        qrCodeGenerated = false;
        
        // Reinicializar después de un breve delay
        setTimeout(() => {
            initializeWhatsAppClient();
        }, 2000);
        
        res.json({
            message: 'Cliente reiniciado',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error reiniciando cliente:', error);
        res.status(500).json({
            error: 'Error reiniciando cliente',
            message: error.message
        });
    }
});

// Endpoint de prueba
app.get('/test', (req, res) => {
    res.json({
        message: 'Microservicio de validación de WhatsApp funcionando',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Crear directorio público si no existe
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// Servir archivos estáticos
app.use('/public', express.static(publicDir));

// Página de estado simple
app.get('/', (req, res) => {
    const statusHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WhatsApp Validator Service - Pietra Fina CRM</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .status { padding: 15px; border-radius: 5px; margin: 20px 0; }
            .status.ready { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .status.waiting { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
            .status.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            .endpoint { background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0; font-family: monospace; }
            .qr-container { text-align: center; margin: 20px 0; }
            button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
            button:hover { background: #0056b3; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📱 WhatsApp Validator Service</h1>
            <p><strong>CRM Pietra Fina</strong> - Microservicio para verificación de números de WhatsApp</p>
            
            <div id="status" class="status waiting">
                <strong>Estado:</strong> <span id="statusText">Verificando...</span>
            </div>
            
            <div id="qrContainer" class="qr-container" style="display: none;">
                <h3>📱 Escanea el código QR con WhatsApp</h3>
                <div id="qrCode"></div>
                <p><small>Este código es necesario para autenticar el servicio con WhatsApp</small></p>
            </div>
            
            <h3>🔗 Endpoints disponibles:</h3>
            <div class="endpoint">GET /check-whatsapp/:numero</div>
            <div class="endpoint">GET /status</div>
            <div class="endpoint">GET /qr</div>
            <div class="endpoint">POST /restart</div>
            
            <h3>🧪 Prueba el servicio:</h3>
            <p>Ejemplo: <code>GET /check-whatsapp/521332261234</code></p>
            
            <button onclick="checkStatus()">🔄 Actualizar Estado</button>
            <button onclick="restartService()">🔄 Reiniciar Servicio</button>
            
            <div id="testResult" style="margin-top: 20px;"></div>
        </div>
        
        <script>
            async function checkStatus() {
                try {
                    const response = await fetch('/status');
                    const data = await response.json();
                    
                    const statusDiv = document.getElementById('status');
                    const statusText = document.getElementById('statusText');
                    
                    if (data.whatsappReady) {
                        statusDiv.className = 'status ready';
                        statusText.textContent = '✅ WhatsApp conectado y listo';
                        document.getElementById('qrContainer').style.display = 'none';
                    } else if (data.qrGenerated) {
                        statusDiv.className = 'status waiting';
                        statusText.textContent = '⏳ Esperando escaneo de QR';
                        showQR();
                    } else {
                        statusDiv.className = 'status error';
                        statusText.textContent = '❌ WhatsApp no conectado';
                        document.getElementById('qrContainer').style.display = 'none';
                    }
                } catch (error) {
                    console.error('Error checking status:', error);
                }
            }
            
            async function showQR() {
                try {
                    const response = await fetch('/qr');
                    if (response.ok) {
                        const data = await response.json();
                        document.getElementById('qrContainer').style.display = 'block';
                        // Aquí podrías generar el QR visualmente
                        document.getElementById('qrCode').innerHTML = '<p>QR disponible en /qr</p>';
                    }
                } catch (error) {
                    console.error('Error getting QR:', error);
                }
            }
            
            async function restartService() {
                try {
                    const response = await fetch('/restart', { method: 'POST' });
                    const data = await response.json();
                    alert('Servicio reiniciado: ' + data.message);
                    setTimeout(checkStatus, 3000);
                } catch (error) {
                    console.error('Error restarting service:', error);
                    alert('Error reiniciando el servicio');
                }
            }
            
            // Verificar estado al cargar la página
            checkStatus();
            
            // Verificar estado cada 10 segundos
            setInterval(checkStatus, 10000);
        </script>
    </body>
    </html>
    `;
    
    res.send(statusHtml);
});

// Manejo de errores global
app.use((error, req, res, next) => {
    console.error('❌ Error no manejado:', error);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: error.message
    });
});

// Inicializar el cliente de WhatsApp al arrancar
console.log('🚀 Iniciando microservicio de validación de WhatsApp...');
initializeWhatsAppClient();

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📱 Endpoint de verificación: http://localhost:${PORT}/check-whatsapp/:numero`);
    console.log(`📊 Estado del servicio: http://localhost:${PORT}/status`);
    console.log(`🔍 Página de estado: http://localhost:${PORT}/`);
});

// Manejo de señales para cerrar limpiamente
process.on('SIGINT', async () => {
    console.log('\n🛑 Cerrando servidor...');
    if (client) {
        await client.destroy();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Cerrando servidor...');
    if (client) {
        await client.destroy();
    }
    process.exit(0);
}); 