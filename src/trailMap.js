import { canvas, ctx } from "./dom.js";

export function startTrailMap({ landmarks, getState, nextLandmark, clamp, randomInt }) {
  let animationFrame = 0;
  let canvasWidth = 1100;
  let canvasHeight = 520;

  function drawTrail() {
    resizeCanvas();
    const state = getState();
    const width = canvasWidth;
    const height = canvasHeight;
    animationFrame += 0.008;

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#89b5ae");
    sky.addColorStop(0.45, "#e5c77a");
    sky.addColorStop(1, "#4d684a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    drawSun(width * 0.82, height * 0.18, 54);
    drawMountains(width, height);
    drawGround(width, height);
    drawPath(width, height);
    drawLandmarkMarkers(width, height, state);
    drawWagon(width, height, state);

    requestAnimationFrame(drawTrail);
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const nextWidth = Math.max(320, Math.round(rect.width));
    const nextHeight = Math.max(220, Math.round(rect.height));
    const pixelWidth = Math.round(nextWidth * ratio);
    const pixelHeight = Math.round(nextHeight * ratio);

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    canvasWidth = nextWidth;
    canvasHeight = nextHeight;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function pathPoint(progress, width, height) {
    const x = 80 + progress * (width - 160);
    const y = height * 0.75 - Math.sin(progress * Math.PI * 2.1) * 76 - progress * 105;
    return { x, y };
  }

  function drawSun(x, y, radius) {
    ctx.fillStyle = "rgba(255, 231, 158, 0.86)";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMountains(width, height) {
    const layers = [
      { color: "#365349", y: 0.47, amp: 130 },
      { color: "#273d36", y: 0.58, amp: 98 }
    ];

    layers.forEach((layer, index) => {
      ctx.fillStyle = layer.color;
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let i = -1; i <= 7; i += 1) {
        const x = (i / 6) * width;
        const y = height * layer.y - Math.sin(i + animationFrame + index) * 18;
        ctx.lineTo(x + width / 12, y - layer.amp);
        ctx.lineTo(x + width / 6, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    });
  }

  function drawGround(width, height) {
    const ground = ctx.createLinearGradient(0, height * 0.52, 0, height);
    ground.addColorStop(0, "#5f7f4f");
    ground.addColorStop(1, "#223026");
    ctx.fillStyle = ground;
    ctx.fillRect(0, height * 0.52, width, height * 0.48);

    ctx.fillStyle = "rgba(12, 16, 14, 0.2)";
    for (let i = 0; i < 40; i += 1) {
      const x = (i * 97 + Math.sin(i) * 22) % width;
      const y = height * 0.56 + ((i * 53) % (height * 0.35));
      ctx.fillRect(x, y, randomInt(18, 42), 2);
    }
  }

  function drawPath(width, height) {
    ctx.lineWidth = 44;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(238, 202, 133, 0.42)";
    ctx.beginPath();
    for (let i = 0; i <= 100; i += 1) {
      const point = pathPoint(i / 100, width, height);
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();

    ctx.lineWidth = 4;
    ctx.setLineDash([10, 14]);
    ctx.strokeStyle = "rgba(255, 249, 218, 0.72)";
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawLandmarkMarkers(width, height, state) {
    landmarks.forEach((landmark) => {
      const progress = landmark.miles / 2000;
      const point = pathPoint(progress, width, height);
      ctx.fillStyle = landmark.miles <= state.miles ? "#f1bd61" : "rgba(244, 241, 233, 0.62)";
      ctx.beginPath();
      ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
      ctx.fill();
    });

    const next = nextLandmark();
    const point = pathPoint(next.miles / 2000, width, height);
    ctx.fillStyle = "rgba(12, 16, 14, 0.66)";
    ctx.fillRect(point.x - 78, point.y - 46, 156, 28);
    ctx.fillStyle = "#f4f1e9";
    ctx.font = "700 15px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(next.name, point.x, point.y - 27);
  }

  function drawWagon(width, height, state) {
    const progress = clamp(state.miles / 2000, 0, 1);
    const point = pathPoint(progress, width, height);
    const bob = Math.sin(animationFrame * 18) * 2;

    ctx.save();
    ctx.translate(point.x, point.y + bob);
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(0, 30, 42, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f4f1e9";
    ctx.beginPath();
    ctx.moveTo(-34, -4);
    ctx.quadraticCurveTo(-18, -38, 2, -38);
    ctx.quadraticCurveTo(28, -38, 40, -4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#8d5b36";
    ctx.fillRect(-42, -6, 86, 28);
    ctx.fillStyle = "#5b3826";
    ctx.fillRect(-48, 10, 98, 10);

    ctx.fillStyle = "#151915";
    [-27, 27].forEach((x) => {
      ctx.beginPath();
      ctx.arc(x, 25, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f1bd61";
      ctx.lineWidth = 3;
      ctx.stroke();
    });
    ctx.restore();
  }

  drawTrail();
}
