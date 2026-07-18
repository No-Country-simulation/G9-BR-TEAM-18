import Hero from "../components/Hero";
import FeatureCards from "../components/FeatureCards";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Hero />
      <div className="section-divider section-divider--flip" />
      <FeatureCards />
      <div className="section-divider" />
      <Footer />
    </>
  );
}
