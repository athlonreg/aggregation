import { useEffect, useRef } from 'react'

declare global {
  interface Window { adsbygoogle: unknown[] }
}

interface AdBannerProps {
  adSlot: string
  className?: string
  style?: React.CSSProperties
}

export default function AdBanner({ adSlot, className = '', style }: AdBannerProps) {
  const ref = useRef<HTMLModElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch {}
  }, [])

  // Dev environment: show placeholder instead of real ad
  if (import.meta.env.DEV) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-gray-400 dark:text-gray-600 text-xs ${className}`}
        style={{ minHeight: 90, ...style }}
      >
        Ad Placeholder ({adSlot})
      </div>
    )
  }

  return (
    <div className={`text-center overflow-hidden ${className}`}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client="ca-pub-7406269002228687"
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
