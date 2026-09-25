import { useEffect, useRef } from "react";

// ln-dev7/warp-tunnel adapted: star-streak hyperspace via 2D canvas
// ponytail: 2D canvas instead of three/R3F — 80% look, 5% bundle
// ponytail: canvas paints lines only, gradient lives in CSS (no full-screen fill per frame) —
//   move back into the canvas if the tunnel ever needs to render over video/other layers
export default function WarpTunnel({ className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0, dpr = 1;
    let last = 0;
    const stars = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.8);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const rand = (a, b) => a + Math.random() * (b - a);

    const init = () => {
      // ponytail: density scales linearly with viewport area — tune the divisor/caps if
      // ultra-wide monitors read sparse or phones read busy
      const count = Math.round(Math.min(260, Math.max(110, (w * h) / 6500)));
      stars.length = 0;
      for (let i = 0; i < count; i++) {
        stars.push({
          x: rand(-w * 0.9, w * 1.9),
          y: rand(-h * 0.55, h * 1.55),
          z: rand(0.05, 1),
          len: rand(90, 360),
          rot: rand(-0.14, 0.14),
        });
      }
    };

    let speed = 0.55;
    let t = 0;

    const draw = (now) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      t += dt;
      // subtle breathing speed
      speed = 0.45 + Math.sin(t * 0.35) * 0.08;

      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.52;

      ctx.lineCap = "round";
      for (const s of stars) {
        const dx = s.x - cx;
        const dy = s.y - cy;
        // move outward from center
        s.z += speed * dt * (0.9 + s.z * 0.6);
        if (s.z > 1) {
          // invisible at both ends (alpha 0) so the recycle can't pop
          s.z = 0.05;
          const ang = Math.atan2(dy, dx) + s.rot;
          const r = rand(h * 0.06, Math.max(w, h) * 0.38);
          s.x = cx + Math.cos(ang) * r;
          s.y = cy + Math.sin(ang) * r;
          s.len = rand(90, 360);
        }
        const scale = 1 + s.z * 2.8;
        const x1 = s.x + dx * s.z * 0.62;
        const y1 = s.y + dy * s.z * 0.62;
        const x2 = s.x + dx * s.z * 0.62 + (dx * 0.018 * s.len) / scale;
        const y2 = s.y + dy * s.z * 0.62 + (dy * 0.018 * s.len) / scale;

        // fade in from the centre, fade out at the rim -> seamless recycle
        const fadeIn = Math.min(1, (s.z - 0.05) / 0.2);
        const fadeOut = 1 - Math.max(0, (s.z - 0.55) / 0.45);
        // full-strength colour + globalAlpha for the fade. alpha used to be baked into the
        // rgba() *and* globalAlpha, which squared it and made every streak read as a grey smudge
        const alpha = Math.min(1, 0.35 + s.z * 0.65) * fadeIn * fadeOut;
        if (alpha <= 0.005) continue;
        // white up close, neon cyan once it's streaked out
        ctx.strokeStyle = s.z > 0.6 ? "rgb(125,225,255)" : "rgb(255,255,255)";
        ctx.lineWidth = s.z > 0.6 ? 1.8 : 1;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => { resize(); init(); };
    resize();
    init();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      // ponytail: one CSS drop-shadow glows the whole line layer on the GPU. per-line
      // ctx.shadowBlur is a blur per draw call (~230/frame) — only go there for individual glow
      style={{ width: "100%", height: "100%", display: "block", filter: "drop-shadow(0 0 6px rgba(120,200,255,0.35))" }}
    />
  );
}
