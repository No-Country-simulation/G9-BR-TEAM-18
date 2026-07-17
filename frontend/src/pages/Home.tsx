import Hero from '../components/Hero'
import DemoTool from '../components/DemoTool'
import FeatureCards from '../components/FeatureCards'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <>
      <Hero />
      <DemoTool />
      <div className="section-divider section-divider--flip" />
      <FeatureCards />
      <div className="section-divider" />
      <Footer />
    </>
  )
}
