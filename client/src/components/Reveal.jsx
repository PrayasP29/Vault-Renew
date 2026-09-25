import { useEffect, useRef, useState } from "react";

// ponytail: lightweight IO reveal (subtle 16px + opacity); one-shot calm, no heavy lib. upgrade to view() timeline if needed
// ponytail: one observer per element, transform/opacity only (no will-change — a permanent
//   layer per hidden element costs more than it saves). share a single observer past ~100 reveals
// repeat=true re-plays on every enter (hero / long sections); one-shot stays latched and
// unobserves so the browser drops it. repeat uses threshold 0 + inset rootMargin because a
// ratio threshold on a section taller than the viewport can never be met -> permanently hidden
export default function Reveal({ children, from = "bottom", delay = 0, repeat = false, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (repeat) setVisible(e.isIntersecting);
          else if (e.isIntersecting) {
            setVisible(true);
            obs.unobserve(e.target);
          }
        });
      },
      repeat
        ? { rootMargin: "-10% 0px -10% 0px", threshold: 0 }
        : { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [repeat]);

  const tx = visible
    ? "translate(0,0)"
    : from === "left"
      ? "translateX(-16px)"
      : from === "right"
        ? "translateX(16px)"
        : from === "scale"
          ? "scale(0.95)"
          : "translateY(16px)";

  return (
    <div
      ref={ref}
      // hidden content stays out of the tab order and unclickable until it reveals
      inert={!visible}
      data-reveal={visible ? "in" : "out"}
      data-from={from}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: tx,
        transition: `opacity 560ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 560ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
