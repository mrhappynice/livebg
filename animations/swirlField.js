// animations/swirlField.js
// A simpler "swirl" animation to demonstrate multiple options

export function createAnimation({ canvas, initialState, onStats }) {
  const ctx = canvas.getContext('2d', { alpha: true });

  let W = 0;
  let H = 0;
  let DPR = 1;

  let speed =
    typeof initialState.speed === 'number' ? initialState.speed : 0.5;
  let zoom =
    typeof initialState.zoom === 'number' ? initialState.zoom : 1.0;
  let running = false;
  let rafId = null;
  let last = performance.now();
  let fpsEMA = 60;
  let t = 0;

  function fitCanvas() {
    DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    W = Math.floor(window.innerWidth);
    H = Math.floor(window.innerHeight);
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.max(0.0001, (now - last) / 1000);
    last = now;

    const fps = 1 / dt;
    fpsEMA = fpsEMA * 0.9 + fps * 0.1;
    onStats?.({ fps: fpsEMA, speed, zoom });

    t += dt * speed * 2;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2;

    const rings = 50;
    const ptsPerRing = 80;

    ctx.fillStyle = 'rgba(255,255,255,0.3)';

    let count = 0;

    for (let r = 0; r < rings; r++) {
      const radius = (Math.min(W, H) * 0.015 * (r + 2)) * zoom;
      for (let i = 0; i < ptsPerRing; i++) {
        const ang = (i / ptsPerRing) * Math.PI * 2;
        const wobble = Math.sin(t + r * 0.3 + i * 0.1) * 0.3;
        const a = ang + wobble;

        const x = cx + Math.cos(a + t * 0.2) * radius;
        const y = cy + Math.sin(a - t * 0.18) * radius;

        ctx.fillRect(x, y, 1, 1);
        count++;
      }
    }

    onStats?.({ points: count });

    rafId = requestAnimationFrame(loop);
  }

  function play() {
    if (running) return;
    running = true;
    last = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  function pause() {
    running = false;
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function reset() {
    t = 0;
  }

  function setParams(params) {
    if (params.speed != null) {
      speed = params.speed;
      onStats?.({ speed });
    }
    if (params.zoom != null) {
      zoom = params.zoom;
      onStats?.({ zoom });
    }
    // density / zoomAuto are ignored here, but it's fine.
  }

  function destroy() {
    pause();
    window.removeEventListener('resize', fitCanvas);
  }

  window.addEventListener('resize', fitCanvas);
  fitCanvas();
  setParams(initialState || {});
  if (initialState?.running !== false) {
    play();
  }

  return { play, pause, reset, setParams, destroy };
}
