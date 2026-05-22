import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronDown, Wrench, Compass, Rss } from 'lucide-react'
import AdBanner from './AdBanner'

// ── Quote fetcher (hitokoto.cn API) ─────────────────────
function useQuote() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchQuote = useCallback(async () => {
    setLoading(true)
    try {
      const types = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']
      const typeParam = types[Math.floor(Math.random() * types.length)]
      const res = await fetch(`https://v1.hitokoto.cn/?c=${typeParam}&encode=json`, { signal: AbortSignal.timeout(3000) })
      if (res.ok) {
        const data = await res.json()
        const hitokoto = data.hitokoto as string
        const from = data.from as string
        setText(from ? `${hitokoto} —— ${from}` : hitokoto)
      } else {
        throw new Error('API failed')
      }
    } catch {
      const fallback = [
        '万物皆有裂痕，那是光照进来的地方。',
        '醉后不知天在水，满船清梦压星河。',
        '山川是不卷收的文章，日月为你掌灯伴读。',
        '你是我半截的诗，不许别人更改一个字。',
        '追风赶月莫停留，平芜尽处是春山。',
        '玻璃晴朗，橘子辉煌。',
        '总之岁月漫长，然而值得等待。',
        '心有猛虎，细嗅蔷薇。',
        '吹灭读书灯，一身都是月。',
        '浮世三千，吾爱有三：日月与卿。',
      ]
      setText(fallback[Math.floor(Math.random() * fallback.length)])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchQuote() }, [fetchQuote])
  return { text, loading, refresh: fetchQuote }
}

// ── Search Engines ──────────────────────────────────────
interface SearchEngine {
  id: string
  name: string
  url: (q: string) => string
  icon: string
}

const engines: SearchEngine[] = [
  { id: 'google', name: 'Google', url: q => `https://www.google.com/search?q=${encodeURIComponent(q)}`, icon: '🔍' },
  { id: 'bing', name: 'Bing', url: q => `https://www.bing.com/search?q=${encodeURIComponent(q)}`, icon: '🔎' },
  { id: 'baidu', name: '百度', url: q => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`, icon: '🐻' },
  { id: 'zhihu', name: '知乎', url: q => `https://www.zhihu.com/search?q=${encodeURIComponent(q)}&type=content`, icon: '💡' },
  { id: 'xiaohongshu', name: '小红书', url: q => `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(q)}`, icon: '📕' },
  { id: 'github', name: 'GitHub', url: q => `https://github.com/search?q=${encodeURIComponent(q)}`, icon: '🐙' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: q => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`, icon: '🦆' },
  { id: 'perplexity', name: 'Perplexity', url: q => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}`, icon: '✨' },
]

// ── Clock Hook ──────────────────────────────────────────
function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

// ── Typewriter (type once, no loop) ─────────────────────
function useTypewriter(text: string, speed = 65) {
  const [display, setDisplay] = useState('')
  const [done, setDone] = useState(false)
  const idxRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    idxRef.current = 0
    setDisplay('')
    setDone(false)
  }, [text])

  useEffect(() => {
    if (!text || done) return
    const tick = () => {
      if (idxRef.current < text.length) {
        idxRef.current++
        setDisplay(text.slice(0, idxRef.current))
        timeoutRef.current = setTimeout(tick, speed + Math.random() * 30)
      } else {
        setDone(true)
      }
    }
    timeoutRef.current = setTimeout(tick, 200)
    return () => clearTimeout(timeoutRef.current)
  }, [text, speed, done])

  return { display, done }
}

// ── World Clocks ────────────────────────────────────────
const timezones = [
  { city: '北京', tz: 'Asia/Shanghai' },
  { city: '东京', tz: 'Asia/Tokyo' },
  { city: '伦敦', tz: 'Europe/London' },
  { city: '纽约', tz: 'America/New_York' },
  { city: '巴黎', tz: 'Europe/Paris' },
  { city: '悉尼', tz: 'Australia/Sydney' },
]

function WorldClocks({ now }: { now: Date }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-1">
      {timezones.map(({ city, tz }) => {
        const time = now.toLocaleTimeString('zh-CN', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false })
        return (
          <span key={tz} className="text-xs text-white/40 font-mono">
            {city} {time}
          </span>
        )
      })}
    </div>
  )
}

// ── Particle Background ─────────────────────────────────
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let raf: number
    let w = 0, h = 0
    interface Dot { x: number; y: number; vx: number; vy: number; r: number }
    let dots: Dot[] = []
    const COUNT = 80
    const DIST = 120

    const resize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }

    const init = () => {
      resize()
      dots = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x
          const dy = dots[i].y - dots[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < DIST) {
            ctx.beginPath()
            ctx.moveTo(dots[i].x, dots[i].y)
            ctx.lineTo(dots[j].x, dots[j].y)
            ctx.strokeStyle = `rgba(120, 140, 255, ${0.15 * (1 - d / DIST)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      for (const d of dots) {
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(140, 160, 255, 0.5)'
        ctx.fill()
        d.x += d.vx; d.y += d.vy
        if (d.x < 0 || d.x > w) d.vx *= -1
        if (d.y < 0 || d.y > h) d.vy *= -1
      }
      raf = requestAnimationFrame(draw)
    }

    init(); draw()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

// ── Entry Button ────────────────────────────────────────
function EntryCard({ icon, title, desc, gradient, onClick }: {
  icon: React.ReactNode; title: string; desc: string; gradient: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 text-left flex-1 basis-[280px] min-w-0"
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg shrink-0 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">{title}</div>
        <div className="text-[11px] text-white/40 mt-0.5 truncate">{desc}</div>
      </div>
    </button>
  )
}

// ── Main Component ──────────────────────────────────────
export default function Home() {
  const { text: quote, loading: quoteLoading, refresh: refreshQuote } = useQuote()
  const { display: typed, done: typedDone } = useTypewriter(quote, 60)
  const now = useClock()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [engineId, setEngineId] = useState('google')
  const [selectorOpen, setSelectorOpen] = useState(false)
  const selectorRef = useRef<HTMLDivElement>(null)

  const engine = engines.find(e => e.id === engineId)!

  const handleSearch = useCallback(() => {
    const q = query.trim()
    if (!q) return
    window.open(engine.url(q), '_blank')
  }, [query, engineId, engine])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setSelectorOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      <Particles />

      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl px-6 text-center">
        {/* System name */}
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent tracking-widest">
            套陆的聚合站
          </h1>
        </div>

        {/* Time */}
        <div className="mb-2">
          <div className="text-6xl sm:text-7xl font-extralight text-white/90 font-mono tracking-wider">
            {now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </div>
          <div className="text-sm text-white/30 mt-1 font-mono">
            {now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
        </div>

        {/* World clocks */}
        <div className="mb-6">
          <WorldClocks now={now} />
        </div>

        {/* Quote — type once, stop */}
        <div className="mb-8 h-8 flex items-center justify-center px-4">
          {quoteLoading ? (
            <div className="w-32 h-4 rounded bg-white/10 animate-pulse" />
          ) : (
            <p
              className="text-base sm:text-lg text-white/50 font-light tracking-wide cursor-pointer hover:text-white/60 transition-colors"
              onClick={refreshQuote}
              title="点击换一句"
            >
              {typed}
              {!typedDone && <span className="inline-block w-0.5 h-5 bg-white/40 ml-0.5 animate-pulse align-middle" />}
            </p>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative z-20 mx-auto max-w-xl mb-8">
          <div className="flex items-center rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 focus-within:border-white/30 focus-within:ring-2 focus-within:ring-blue-500/30 transition-all shadow-2xl shadow-black/20">
            {/* Engine selector */}
            <div ref={selectorRef} className="relative">
              <button
                onClick={() => setSelectorOpen(o => !o)}
                className="flex items-center gap-1 pl-4 pr-2 py-3 text-sm text-white/70 hover:text-white transition-colors"
              >
                <span className="text-base">{engine.icon}</span>
                <ChevronDown size={14} className={`transition-transform ${selectorOpen ? 'rotate-180' : ''}`} />
              </button>

              {selectorOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 py-1.5 rounded-xl bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl z-[100]">
                  {engines.map(e => (
                    <button
                      key={e.id}
                      onClick={() => { setEngineId(e.id); setSelectorOpen(false) }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                        e.id === engineId
                          ? 'text-white bg-white/10'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="text-base">{e.icon}</span>
                      {e.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`在 ${engine.name} 中搜索...`}
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm py-3 px-2 outline-none min-w-0"
            />

            {/* Search button */}
            <button
              onClick={handleSearch}
              className="mr-1.5 p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600 transition-all shadow-lg shadow-blue-500/20"
            >
              <Search size={16} />
            </button>
          </div>

          {/* Quick engines */}
          <div className="flex justify-center gap-2 mt-3">
            {engines.slice(0, 5).map(e => (
              <button
                key={e.id}
                onClick={() => { setEngineId(e.id); if (query.trim()) window.open(e.url(query.trim()), '_blank') }}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                  engineId === e.id
                    ? 'border-blue-400/50 bg-blue-500/20 text-blue-300'
                    : 'border-white/10 text-white/30 hover:text-white/60 hover:border-white/20'
                }`}
              >
                {e.name}
              </button>
            ))}
          </div>
        </div>

        {/* Ad */}
        <div className="mb-6 max-w-xl mx-auto">
          <AdBanner adSlot="7464461589" />
        </div>

        {/* Entry buttons — single row, auto-wrap */}
        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          <EntryCard
            icon={<Wrench size={20} />}
            title="开发者工具箱"
            desc="进制计算、编码转换、加解密、格式化等 16+ 工具"
            gradient="from-blue-500 to-violet-500"
            onClick={() => navigate('/datetime')}
          />
          <EntryCard
            icon={<Compass size={20} />}
            title="精选导航"
            desc="搜索引擎、影视、AI、素材、社区等 146+ 精选站点"
            gradient="from-orange-500 to-pink-500"
            onClick={() => navigate('/nav')}
          />
          <EntryCard
            icon={<Rss size={20} />}
            title="我的博客"
            desc="blog.tlhub.cn"
            gradient="from-emerald-500 to-teal-500"
            onClick={() => window.open('https://blog.tlhub.cn', '_blank')}
          />
          <EntryCard
            icon={
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            }
            title="GitHub"
            desc="github.com/athlonreg"
            gradient="from-gray-600 to-gray-400"
            onClick={() => window.open('https://github.com/athlonreg', '_blank')}
          />
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none" />
    </div>
  )
}
