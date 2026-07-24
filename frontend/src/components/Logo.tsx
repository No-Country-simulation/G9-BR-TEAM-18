interface LogoProps {
  size?: number
  className?: string
}

export default function Logo({ size = 40, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="EnergiIA logo"
    >
      {/* Outer energy ring */}
      <path
        d="M16,58 A44,44 0 1,1 104,58"
        stroke="#0A0A0A"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M22,58 A38,38 0 1,1 98,58"
        stroke="#29E7CD"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Lightning bolt */}
      <path
        d="M80,15 L45,55 L55,55 L35,100 L60,68 L50,68 Z"
        fill="#C6FF3D"
        stroke="#0A0A0A"
        strokeWidth="5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Inner bolt highlight */}
      <path
        d="M72,24 L46,55 L54,55 L40,85 L57,64 L50,64 Z"
        fill="rgba(255,255,255,0.25)"
      />

      {/* Energy spark at strike point */}
      <circle cx="95" cy="72" r="5" fill="#FF4FA3" stroke="#0A0A0A" strokeWidth="3" />
    </svg>
  )
}


