const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const paddle = { w: 140, h: 14, x: canvas.width / 2 - 70, y: canvas.height - 30, speed: 8 };
const ball = { x: canvas.width / 2, y: canvas.height - 60, r: 9, dx: 4, dy: -4 };

const keys = { left: false, right: false };
const drops = [];

const photoUrls = {
  bruno: '', // ex: 'https://.../bruno.jpg'
  chahra: '', // ex: 'https://.../chahra.jpg'
};

const photoCache = {};
for (const [name, url] of Object.entries(photoUrls)) {
  if (url) {
    const img = new Image();
    img.src = url;
    photoCache[name] = img;
  }
}

function createBricksFromText(text) {
  const off = document.createElement('canvas');
  off.width = 960;
  off.height = 180;
  const octx = off.getContext('2d');

  octx.fillStyle = '#000';
  octx.fillRect(0, 0, off.width, off.height);
  octx.fillStyle = '#fff';
  octx.font = 'bold 92px Arial';
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';
  octx.fillText(text, off.width / 2, off.height / 2);

  const data = octx.getImageData(0, 0, off.width, off.height).data;
  const bw = 30, bh = 14, gap = 4;
  const bricks = [];

  for (let y = 0; y < 180; y += (bh + gap)) {
    for (let x = 80; x < 880; x += (bw + gap)) {
      const cx = x + Math.floor(bw / 2);
      const cy = y + Math.floor(bh / 2);
      const idx = (cy * off.width + cx) * 4;
      if (data[idx] > 200) {
        bricks.push({ x, y: y + 40, w: bw, h: bh, alive: true });
      }
    }
  }

  return bricks;
}

const bricks = createBricksFromText('GÉROME BILLOIS');

function spawnDrop(x, y) {
  const person = Math.random() > 0.5 ? 'bruno' : 'chahra';
  drops.push({ x, y, r: 20, vy: 2 + Math.random() * 1.5, person });
}

function drawDrop(d) {
  const img = photoCache[d.person];
  if (img && img.complete) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, d.x - d.r, d.y - d.r, d.r * 2, d.r * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = d.person === 'bruno' ? '#22d3ee' : '#f472b6';
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(d.person, d.x, d.y + 3);
  }
}

function collideRectCircle(rect, c) {
  const tx = Math.max(rect.x, Math.min(c.x, rect.x + rect.w));
  const ty = Math.max(rect.y, Math.min(c.y, rect.y + rect.h));
  const dx = c.x - tx;
  const dy = c.y - ty;
  return dx * dx + dy * dy < c.r * c.r;
}

function update() {
  if (keys.left) paddle.x -= paddle.speed;
  if (keys.right) paddle.x += paddle.speed;
  paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, paddle.x));

  ball.x += ball.dx;
  ball.y += ball.dy;

  if (ball.x < ball.r || ball.x > canvas.width - ball.r) ball.dx *= -1;
  if (ball.y < ball.r) ball.dy *= -1;
  if (ball.y > canvas.height + 30) {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 60;
    ball.dx = 4;
    ball.dy = -4;
  }

  if (collideRectCircle(paddle, ball) && ball.dy > 0) {
    ball.dy *= -1;
    const offset = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
    ball.dx = offset * 5;
  }

  bricks.forEach((b) => {
    if (b.alive && collideRectCircle(b, ball)) {
      b.alive = false;
      spawnDrop(b.x + b.w / 2, b.y + b.h / 2);
      ball.dy *= -1;
    }
  });

  drops.forEach((d) => d.y += d.vy);
  for (let i = drops.length - 1; i >= 0; i -= 1) {
    if (drops[i].y - drops[i].r > canvas.height) drops.splice(i, 1);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

  ctx.fillStyle = '#e5e7eb';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();

  bricks.forEach((b) => {
    if (!b.alive) return;
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(b.x, b.y, b.w, b.h);
  });

  drops.forEach(drawDrop);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'ArrowRight') keys.right = true;
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'ArrowRight') keys.right = false;
});

loop();
