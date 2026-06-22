import { motion } from "framer-motion";
import ParallaxBackground from "../components/ui/ParallaxBackground.jsx";
import TopNav from "../components/landing/TopNav.jsx";
import Hero from "../components/landing/Hero.jsx";
import ProblemSolution from "../components/landing/ProblemSolution.jsx";
import FeaturesBento from "../components/landing/FeaturesBento.jsx";
import DashboardPreview from "../components/landing/DashboardPreview.jsx";
import AnalyticsPreview from "../components/landing/AnalyticsPreview.jsx";
import ImpactMetrics from "../components/landing/ImpactMetrics.jsx";
import CTA from "../components/landing/CTA.jsx";

export default function Landing() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative"
    >
      <ParallaxBackground />
      <TopNav />
      <Hero />
      <ProblemSolution />
      <FeaturesBento />
      <div id="preview">
        <DashboardPreview />
        <AnalyticsPreview />
      </div>
      <div id="impact">
        <ImpactMetrics />
      </div>
      <CTA />
      <Footer />
    </motion.div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-subtle px-5 py-8 text-center">
      <p className="text-xs text-ink-faint">
        🅿️ <span className="font-semibold text-violet">SmartPark AI</span> · Transform congestion
        into actionable intelligence · Bengaluru · Built with React · TailwindCSS · Framer Motion ·
        Recharts · Leaflet
      </p>
    </footer>
  );
}
