import Hero from "../components/Hero.jsx";
import WhySection from "../components/WhySection.jsx";
import HowItWorks from "../components/HowItWorks.jsx";
import UploadExplain from "../components/UploadExplain.jsx";
import FAQ from "../components/FAQ.jsx";
import Footer from "../components/Footer.jsx";
import WarpTunnel from "../components/WarpTunnel.jsx";
import { cn } from "../lib/utils.js";

// one glass card per section — content components stay untouched
function Glass({ children, className }) {
  return (
    <div
      className={cn(
        "relative rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-lg",
        "shadow-2xl shadow-black/50 overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="relative isolate bg-[#050508] overflow-hidden">
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 52%, #0b0b12 0%, #0a0a0f 45%, #050508 100%)" }}
        aria-hidden
      >
        <WarpTunnel className="h-full w-full pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/35" />
      </div>
      <div className="relative mx-auto w-[calc(100%-2rem)] max-w-[1160px] flex flex-col gap-8 sm:gap-12 py-8 sm:py-12">
        <Hero />
        <Glass>
          <WhySection />
        </Glass>
        <Glass>
          <HowItWorks />
        </Glass>
        <Glass>
          <UploadExplain />
        </Glass>
        <Glass>
          <FAQ />
        </Glass>
        <Glass>
          <Footer />
        </Glass>
      </div>
    </div>
  );
}
