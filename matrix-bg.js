// Matrix background effect for role selection
const canvas = document.createElement('canvas');
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.display = 'block';
canvas.style.opacity = '0.18';
canvas.style.pointerEvents = 'none';
canvas.style.userSelect = 'none';
canvas.style.position = 'absolute';
canvas.style.inset = '0';
canvas.id = 'matrix-canvas';

function startMatrix() {
  const container = document.getElementById('matrix-bg');
  if (!container) return;
  container.innerHTML = '';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let width = container.offsetWidth;
  let height = container.offsetHeight;
  canvas.width = width;
  canvas.height = height;

  const fontSize = 22;
  const columns = Math.floor(width / fontSize);
  const drops = Array(columns).fill(1);
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  function draw() {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, 0, width, height);
    ctx.font = fontSize + 'px monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i < columns; i++) {
      const text = letters[Math.floor(Math.random() * letters.length)];
      ctx.fillStyle = 'rgba(220,38,38,0.85)'; // rojo
      ctx.fillText(text, i * fontSize + fontSize/2, drops[i] * fontSize);
      if (Math.random() > 0.975 || drops[i] * fontSize > height * (0.7 + 0.3 * Math.random())) {
        drops[i] = 0;
      }
      drops[i]++;
    }
    // Desvanecer hacia abajo
    const gradient = ctx.createLinearGradient(0, height * 0.6, 0, height);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(1, 'rgba(255,255,255,1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height * 0.6, width, height * 0.4);
  }

  let animationId;
  function animate() {
    draw();
    animationId = requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener('resize', () => {
    width = container.offsetWidth;
    height = container.offsetHeight;
    canvas.width = width;
    canvas.height = height;
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startMatrix);
} else {
  startMatrix();
}
