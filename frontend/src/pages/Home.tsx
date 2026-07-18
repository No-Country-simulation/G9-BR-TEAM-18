import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import TechStack from "../components/TechStack";
import FeatureCards from "../components/FeatureCards";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <div className="section-divider section-divider--flip" />
      <FeatureCards />
      <div className="section-divider" />
      <TechStack />
      <div className="section-divider section-divider--flip" />
      <Footer />
    </>
  );
}
