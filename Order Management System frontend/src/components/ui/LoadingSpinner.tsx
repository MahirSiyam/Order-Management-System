export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`loading loading-spinner loading-md text-primary ${className}`}
      aria-label="Loading"
    />
  )
}

export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div
      className="flex min-h-[40vh] w-full items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{label}</span>
      <LoadingSpinner className="loading-lg" />
    </div>
  )
}
