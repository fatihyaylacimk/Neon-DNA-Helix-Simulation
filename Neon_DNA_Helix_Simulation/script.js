const canvas = document.getElementById("dnaCanvas");
const ctx = canvas.getContext("2d");

let width, height, dpr;
let time = 0;
let stars = [];

const mouse = {
  x: 0,
  y: 0,
  tx: 0,
  ty: 0
};

const config = {
  nodes: 82,
  radius: 155,
  height: 640,
  camera: 820
};

function resize() {
  dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  width = window.innerWidth;
  height = window.innerHeight;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  createStars();
}

function createStars() {
  stars = [];
  const count = Math.floor((width * height) / 9000);

  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random(),
      r: Math.random() * 1.6 + 0.3,
      speed: Math.random() * 0.004 + 0.002,
      alpha: Math.random() * 0.55 + 0.15
    });
  }
}

function rotate3D(x, y, z, rx, ry) {
  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);

  let x1 = x * cosY - z * sinY;
  let z1 = x * sinY + z * cosY;

  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);

  let y1 = y * cosX - z1 * sinX;
  let z2 = y * sinX + z1 * cosX;

  return { x: x1, y: y1, z: z2 };
}

function project(p) {
  const scale = config.camera / (config.camera - p.z);
  return {
    x: width / 2 + p.x * scale,
    y: height / 2 + p.y * scale,
    scale,
    z: p.z
  };
}

function drawBackground() {
  ctx.fillStyle = "rgba(1, 3, 8, 0.34)";
  ctx.fillRect(0, 0, width, height);

  const g = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.min(width, height) * 0.52);
  g.addColorStop(0, "rgba(0,255,210,0.13)");
  g.addColorStop(0.38, "rgba(0,120,255,0.035)");
  g.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}

function drawStars() {
  ctx.save();
  ctx.shadowBlur = 8;
  ctx.shadowColor = "rgba(0,255,210,0.75)";

  for (const s of stars) {
    s.z -= s.speed;
    if (s.z <= 0.01) {
      s.z = 1;
      s.x = Math.random() * width;
      s.y = Math.random() * height;
    }

    const driftX = mouse.x * (1 - s.z) * 26;
    const driftY = mouse.y * (1 - s.z) * 18;
    const size = s.r * (1.4 - s.z);
    const alpha = s.alpha * (1.1 - s.z);

    ctx.beginPath();
    ctx.arc(s.x + driftX, s.y + driftY, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(135,255,235,${alpha})`;
    ctx.fill();
  }

  ctx.restore();
}

function getHelixPoints() {
  const points = [];

  const rx = -0.12 + mouse.y * 0.55;
  const ry = time * 0.65 + mouse.x * 0.9;

  for (let i = 0; i < config.nodes; i++) {
    const t = i / (config.nodes - 1);
    const y = (t - 0.5) * config.height;
    const angle = t * Math.PI * 10 + time * 1.7;

    const pulse = Math.sin(t * Math.PI * 8 - time * 3) * 18;
    const radius = config.radius + pulse;

    const x1 = Math.cos(angle) * radius;
    const z1 = Math.sin(angle) * radius;

    const x2 = Math.cos(angle + Math.PI) * radius;
    const z2 = Math.sin(angle + Math.PI) * radius;

    const p1 = project(rotate3D(x1, y, z1, rx, ry));
    const p2 = project(rotate3D(x2, y, z2, rx, ry));

    points.push({ p1, p2, t });
  }

  return points;
}

function drawLine(a, b, color, alpha, widthLine = 1) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineWidth = widthLine;
  ctx.strokeStyle = color.replace("ALPHA", alpha);
  ctx.stroke();
}

function drawDNA() {
  const points = getHelixPoints();

  ctx.save();
  ctx.shadowBlur = 14;
  ctx.shadowColor = "rgba(0,255,210,0.85)";

  for (let i = 0; i < points.length; i++) {
    const item = points[i];
    const alpha = 0.20 + Math.max(item.p1.scale, item.p2.scale) * 0.36;

    if (i % 2 === 0) {
      drawLine(item.p1, item.p2, "rgba(100,255,230,ALPHA)", alpha * 0.65, 1.15);
    }

    if (i < points.length - 1) {
      const next = points[i + 1];
      drawLine(item.p1, next.p1, "rgba(0,255,210,ALPHA)", alpha, 1.3);
      drawLine(item.p2, next.p2, "rgba(115,165,255,ALPHA)", alpha * 0.82, 1.3);
    }
  }

  const allNodes = [];

  for (const item of points) {
    allNodes.push({ ...item.p1, color: "cyan" });
    allNodes.push({ ...item.p2, color: "blue" });
  }

  allNodes.sort((a, b) => a.z - b.z);

  for (const p of allNodes) {
    const size = 2.2 * p.scale + 1.2;
    const alpha = Math.max(0.28, Math.min(1, p.scale * 0.72));
    const color = p.color === "cyan" ? `rgba(90,255,230,${alpha})` : `rgba(120,170,255,${alpha})`;

    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p.x, p.y, size * 3.2, 0, Math.PI * 2);
    ctx.fillStyle = p.color === "cyan" ? `rgba(0,255,210,${alpha * 0.08})` : `rgba(70,120,255,${alpha * 0.08})`;
    ctx.fill();
  }

  ctx.restore();
}

function drawEnergyCore() {
  const pulse = 0.65 + Math.sin(time * 3.2) * 0.35;
  const g = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, 280);

  g.addColorStop(0, `rgba(0,255,210,${0.18 * pulse})`);
  g.addColorStop(0.35, `rgba(80,160,255,${0.07 * pulse})`);
  g.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 300, 0, Math.PI * 2);
  ctx.fill();
}

function animate() {
  time += 0.016;
  mouse.x += (mouse.tx - mouse.x) * 0.06;
  mouse.y += (mouse.ty - mouse.y) * 0.06;

  drawBackground();
  drawStars();
  drawEnergyCore();
  drawDNA();

  requestAnimationFrame(animate);
}

window.addEventListener("resize", resize);

window.addEventListener("mousemove", (e) => {
  mouse.tx = (e.clientX / width - 0.5) * 1.4;
  mouse.ty = (e.clientY / height - 0.5) * 1.2;
});

window.addEventListener("touchmove", (e) => {
  const t = e.touches[0];
  mouse.tx = (t.clientX / width - 0.5) * 1.4;
  mouse.ty = (t.clientY / height - 0.5) * 1.2;
}, { passive: true });

resize();
ctx.fillStyle = "#010308";
ctx.fillRect(0, 0, width, height);
animate();
