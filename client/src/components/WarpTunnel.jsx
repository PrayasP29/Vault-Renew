import { useEffect, useRef } from "react";

// ln-dev7/warp-tunnel adapted: star-streak hyperspace via 2D canvas
// ponytail: 2D canvas instead of three/R3F — 80% look, 5% bundle
export default function WarpTunnel({ className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0, dpr = 1;
    const stars = [];
    const COUNT = 760;

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
      stars.length = 0;
      for (let i = 0; i < COUNT; i++) {
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

    const draw = () => {
      t += 0.016;
      // subtle breathing speed
      speed = 0.45 + Math.sin(t * 0.35) * 0.08;

      // background
      const g = ctx.createRadialGradient(w * 0.52, h * 0.55, 0, w * 0.52, h * 0.55, Math.max(w, h) * 0.95);
      g.addColorStop(0, "#0b0b12");
      g.addColorStop(0.45, "#0a0a0f");
      g.addColorStop(1, "#050508");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // vignette - lighter so rays reach edges
      const vg = ctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.55, w * 0.5, h * 0.5, h * 1.35);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.28)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.52;

      ctx.lineCap = "round";
      for (const s of stars) {
        // perspective streak toward center
        const dx = s.x - cx;
        const dy = s.y - cy;
        // move outward from center
        s.z += speed * 0.016 * (0.9 + s.z * 0.6);
        if (s.z > 1) {
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

        const alpha = Math.min(0.95, 0.15 + s.z * 0.85);
        // subtle indigo tint on brighter streaks
        const tint = s.z > 0.65 ? `rgba(165,180,255,${alpha})` : `rgba(255,255,255,${alpha * 0.92})`;
        ctx.strokeStyle = tint;
        ctx.lineWidth = s.z > 0.6 ? 1.4 : 1;
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
    draw();
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
