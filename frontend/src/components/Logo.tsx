interface LogoProps {
  size?: number
  className?: string
}

export default function Logo({ size = 28, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="GambIA logo"
    >
      {/* Canopy - organic tree crown */}
      <circle cx="60" cy="48" r="30" fill="#059669" />
      <circle cx="42" cy="54" r="20" fill="#059669" />
      <circle cx="78" cy="54" r="20" fill="#059669" />

      {/* Canopy highlight layers */}
      <circle cx="60" cy="42" r="22" fill="#10b981" />
      <circle cx="48" cy="48" r="14" fill="#34d399" />

      {/* G letter cutout in white */}
      <path
        d="M50 38 C50 34 55 32 62 32 C68 32 72 35 72 40 L72 46 L56 46 L56 62 L70 62 L70 55 L63 55"
        stroke="white"
        strokeWidth="4.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Trunk */}
      <rect x="56" y="76" width="8" height="24" rx="3" fill="#047857" />

      {/* Root detail */}
      <path d="M56 98 L50 104" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
      <path d="M64 98 L70 104" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function logoFaviconSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <circle cx="60" cy="48" r="30" fill="#059669"/>
    <circle cx="42" cy="54" r="20" fill="#059669"/>
    <circle cx="78" cy="54" r="20" fill="#059669"/>
    <circle cx="60" cy="42" r="22" fill="#10b981"/>
    <circle cx="48" cy="48" r="14" fill="#34d399"/>
    <path d="M50 38 C50 34 55 32 62 32 C68 32 72 35 72 40 L72 46 L56 46 L56 62 L70 62 L70 55 L63 55" stroke="white" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="56" y="76" width="8" height="24" rx="3" fill="#047857"/>
    <path d="M56 98 L50 104" stroke="#047857" stroke-width="3" stroke-linecap="round"/>
    <path d="M64 98 L70 104" stroke="#047857" stroke-width="3" stroke-linecap="round"/>
  </svg>`
}
