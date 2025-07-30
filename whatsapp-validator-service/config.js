module.exports = {
    // Configuración del servidor
    server: {
        port: process.env.PORT || 3000,
        host: '0.0.0.0'
    },

    // Configuración de CORS
    cors: {
        origins: [
            'http://localhost:5000',
            'http://127.0.0.1:5000',
            'https://crm-pietrafina.web.app',
            'https://crm-pietrafina.firebaseapp.com'
        ],
        credentials: true
    },

    // Configuración de WhatsApp Web
    whatsapp: {
        clientId: 'pietrafina-crm',
        sessionDir: '.wwebjs_auth',
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
    },

    // Configuración de logs
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        enableConsole: true,
        enableFile: false
    },

    // Configuración de rate limiting
    rateLimit: {
        enabled: true,
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 100 // máximo 100 requests por ventana
    },

    // Configuración de timeouts
    timeouts: {
        whatsappCheck: 10000, // 10 segundos para verificar número
        reconnect: 5000, // 5 segundos para reconectar
        session: 24 * 60 * 60 * 1000 // 24 horas para sesión
    }
}; 