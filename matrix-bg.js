// Matrix background effect for global background on #interactive-bg
function startMatrix() {
  const canvas = document.getElementById('interactive-bg');
  if (!canvas) return;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.style.opacity = '0.18';
  canvas.style.pointerEvents = 'none';
  canvas.style.userSelect = 'none';
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  //
  let width = window.innerWidth;
  let height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  const fontSize = 18;
  let columns = Math.floor(width / fontSize);
  let drops = Array(columns).fill(1);
  const letters = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズヅブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  function draw() {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, width, height);
    ctx.font = fontSize + 'px monospace';
    ctx.fillStyle = '#00FF41';
    for (let i = 0; i < drops.length; i++) {
      const text = letters.charAt(Math.floor(Math.random() * letters.length));
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  setInterval(draw, 40);

  window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    columns = Math.floor(width / fontSize);
    drops = Array(columns).fill(1);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startMatrix);
} else {
  startMatrix();
}
