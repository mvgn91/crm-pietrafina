const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testService() {
    console.log('🧪 Probando microservicio de WhatsApp...\n');

    try {
        // 1. Probar endpoint de estado
        console.log('1️⃣ Probando endpoint /status...');
        const statusResponse = await fetch(`${BASE_URL}/status`);
        const statusData = await statusResponse.json();
        console.log('✅ Estado del servicio:', statusData);
        console.log('');

        // 2. Probar endpoint de prueba
        console.log('2️⃣ Probando endpoint /test...');
        const testResponse = await fetch(`${BASE_URL}/test`);
        const testData = await testResponse.json();
        console.log('✅ Test del servicio:', testData);
        console.log('');

        // 3. Probar verificación de número (si WhatsApp está listo)
        if (statusData.whatsappReady) {
            console.log('3️⃣ Probando verificación de número...');
            const testNumber = '521332261234'; // Número de prueba
            const checkResponse = await fetch(`${BASE_URL}/check-whatsapp/${testNumber}`);
            const checkData = await checkResponse.json();
            console.log(`✅ Verificación de ${testNumber}:`, checkData);
        } else {
            console.log('3️⃣ ⏳ WhatsApp no está listo, saltando verificación de número');
            console.log('   💡 Escanea el código QR en http://localhost:3000');
        }

        console.log('\n🎉 Todas las pruebas completadas!');

    } catch (error) {
        console.error('❌ Error durante las pruebas:', error.message);
        console.log('\n💡 Asegúrate de que el servicio esté corriendo:');
        console.log('   npm start');
    }
}

// Ejecutar pruebas
testService(); 