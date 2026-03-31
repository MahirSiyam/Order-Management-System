type Props = {
  className?: string
  /** Larger wordmark for auth hero */
  size?: 'md' | 'lg'
  /** Match DaisyUI text (e.g. sidebar on base-100) */
  inheritText?: boolean
}

export function InventraXWordmark({
  className = '',
  size = 'md',
  inheritText = false,
}: Props) {
  const textSize = size === 'lg' ? 'text-3xl md:text-4xl' : 'text-2xl'
  const xSize = size === 'lg' ? 'text-[1.2em]' : 'text-[1.15em]'

  return (
    <p
      className={`flex items-baseline gap-0.5 font-bold tracking-tight ${textSize} ${className}`}
      aria-label="InventraX"
    >
      <span
        className={inheritText ? 'text-base-content' : 'text-slate-800'}
        aria-hidden="true"
      >
        Inventra
      </span>
      <span
        className={`bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 bg-clip-text font-black italic leading-none text-transparent ${xSize}`}
        aria-hidden="true"
      >
        X
      </span>
    </p>
  )
}
