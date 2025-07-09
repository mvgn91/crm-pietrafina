// Fondo Empresarial Elegante - Figuras Geométricas en Rojo sobre Blanco
function startMatrix() {
    const canvas = document.getElementById('interactive-bg');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;

    // Configuración del fondo empresarial
    const config = {
        backgroundColor: '#ffffff', // Fondo blanco
        primaryColor: '#ef4444',   // Rojo Pietra Fina
        secondaryColor: '#fecaca', // Rojo claro para efectos sutiles
        accentColor: '#dc2626',    // Rojo más oscuro para detalles
        opacity: 0.15,             // Opacidad sutil
        maxShapes: 8,              // Número máximo de figuras
        animationSpeed: 0.002      // Velocidad de animación
    };

    // Clase para figuras geométricas
    class GeometricShape {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type; // 'triangle', 'square', 'circle', 'diamond'
            this.size = Math.random() * 80 + 40;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.02;
            this.opacity = Math.random() * 0.3 + 0.1;
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.pulseSpeed = Math.random() * 0.01 + 0.005;
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);

            // Efecto de pulso sutil
            const pulse = Math.sin(this.pulsePhase) * 0.1 + 1;
            const currentSize = this.size * pulse;

            switch (this.type) {
                case 'triangle':
                    this.drawTriangle(currentSize);
                    break;
                case 'square':
                    this.drawSquare(currentSize);
                    break;
                case 'circle':
                    this.drawCircle(currentSize);
                    break;
                case 'diamond':
                    this.drawDiamond(currentSize);
                    break;
            }

            ctx.restore();
        }

        drawTriangle(size) {
            ctx.fillStyle = config.primaryColor;
            ctx.beginPath();
            ctx.moveTo(0, -size / 2);
            ctx.lineTo(size / 2, size / 2);
            ctx.lineTo(-size / 2, size / 2);
            ctx.closePath();
            ctx.fill();
        }

        drawSquare(size) {
            ctx.fillStyle = config.secondaryColor;
            ctx.fillRect(-size / 2, -size / 2, size, size);
        }

        drawCircle(size) {
            ctx.fillStyle = config.accentColor;
            ctx.beginPath();
            ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        drawDiamond(size) {
            ctx.fillStyle = config.primaryColor;
            ctx.beginPath();
            ctx.moveTo(0, -size / 2);
            ctx.lineTo(size / 2, 0);
            ctx.lineTo(0, size / 2);
            ctx.lineTo(-size / 2, 0);
            ctx.closePath();
            ctx.fill();
        }

        update() {
            this.rotation += this.rotationSpeed;
            this.pulsePhase += this.pulseSpeed;
        }
    }

    // Array de figuras
    let shapes = [];

    // Inicializar figuras
    function initShapes() {
        shapes = [];
        const types = ['triangle', 'square', 'circle', 'diamond'];
        
        for (let i = 0; i < config.maxShapes; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const type = types[Math.floor(Math.random() * types.length)];
            shapes.push(new GeometricShape(x, y, type));
        }
    }

    // Función de resize
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initShapes();
    }

    // Función de animación
    function animate() {
        // Limpiar canvas con fondo blanco
        ctx.fillStyle = config.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dibujar y actualizar figuras
        shapes.forEach(shape => {
            shape.draw();
            shape.update();
        });

        // Efecto de desvanecimiento sutil en los bordes
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
        );
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.02)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        animationId = requestAnimationFrame(animate);
    }

    // Event listeners
    window.addEventListener('resize', resizeCanvas);

    // Inicializar
    resizeCanvas();
    animate();

    // Función para limpiar animación
    function stopMatrix() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    }

    // Exponer función de limpieza
    window.stopMatrix = stopMatrix;
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startMatrix);
} else {
    startMatrix();
}
