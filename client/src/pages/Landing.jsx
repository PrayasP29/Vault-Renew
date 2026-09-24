import Hero from "../components/Hero.jsx";
import WhySection from "../components/WhySection.jsx";
import HowItWorks from "../components/HowItWorks.jsx";
import UploadExplain from "../components/UploadExplain.jsx";
import FAQ from "../components/FAQ.jsx";
import Footer from "../components/Footer.jsx";
import WarpTunnel from "../components/WarpTunnel.jsx";

export default function Landing() {
  return (
    <div className="relative isolate bg-[#050508] overflow-hidden">
      <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden>
        <WarpTunnel className="h-full w-full pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/35" />
      </div>
      <div className="relative">
        <Hero />
        <WhySection />
        <HowItWorks />
        <UploadExplain />
        <FAQ />
        <Footer />
      </div>
    </div>
  );
}
