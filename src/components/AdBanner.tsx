import { useEffect, useRef } from 'react'

declare global {
  interface Window { adsbygoogle: unknown[] }
}

// Set to true to enable AdSense ads
const ADS_ENABLED = true

interface AdBannerProps {
  adSlot: string
  className?: string
  style?: React.CSSProperties
}

export default function AdBanner({ adSlot, className = '', style }: AdBannerProps) {
  const ref = useRef<HTMLModElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (!ADS_ENABLED || pushed.current) return
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch {}
  }, [])

  if (!ADS_ENABLED) return null

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
