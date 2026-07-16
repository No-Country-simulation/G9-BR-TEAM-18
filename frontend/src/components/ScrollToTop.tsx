import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export default function ScrollToTop() {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    function aoRolar() {
      setVisivel(window.scrollY > 400)
    }
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])

  function rolarAoTopo() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!visivel) return null

  return (
    <button
      className="scroll-to-top"
      onClick={rolarAoTopo}
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
    >
      <ArrowUp size={22} />
    </button>
  )
}
