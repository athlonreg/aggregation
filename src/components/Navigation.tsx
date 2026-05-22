import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { navCategories, type NavItem, type NavCategory } from '../navData'
import { Search, ExternalLink, ArrowLeft, Sun, Moon, Compass } from 'lucide-react'
import AdBanner from './AdBanner'

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return ''
  }
}

function LinkCard({ item }: { item: NavItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-gray-200/60 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
    >
      <img
        src={getFaviconUrl(item.url)}
        alt=""
        className="w-8 h-8 rounded-lg shrink-0 bg-gray-100 dark:bg-gray-800"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {item.name}
          </span>
          <ExternalLink size={10} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.desc}</div>
      </div>
    </a>
  )
}

function CategorySection({ category }: { category: NavCategory }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center text-white text-sm shadow-sm`}>
          {category.icon}
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white">{category.title}</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 dark:from-gray-700 to-transparent ml-2" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {category.items.map((item) => (
          <LinkCard key={item.url} item={item} />
        ))}
      </div>
    </div>
  )
}

interface NavigationProps {
  dark: boolean
  onToggleTheme: () => void
}

export default function Navigation({ dark, onToggleTheme }: NavigationProps) {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    if (!search.trim()) return navCategories
    const q = search.toLowerCase()
    return navCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.desc.toLowerCase().includes(q) ||
            item.url.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.items.length > 0)
  }, [search])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Standalone header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              title="返回首页"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-sm">
                <Compass size={16} className="text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                精选导航
              </span>
            </div>
          </div>
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6">
        {/* Search */}
        <div className="relative max-w-xl mx-auto mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索网站名称、描述或域名..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              清除
            </button>
          )}
        </div>

        {/* Category tabs */}
        {!search.trim() && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {navCategories.map((cat) => (
              <a
                key={cat.title}
                href={`#${cat.title}`}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(cat.title)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm"
              >
                <span>{cat.icon}</span>
                {cat.title}
              </a>
            ))}
          </div>
        )}

        {/* Categories */}
        <div>
          {filtered.map((cat, i) => (
            <div key={cat.title} id={cat.title}>
              <CategorySection category={cat} />
              {(i + 1) % 4 === 0 && i < filtered.length - 1 && (
                <AdBanner adSlot="NAV_INFEED_SLOT" className="mb-6" />
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Search size={48} className="mx-auto mb-4 opacity-30" />
            <div className="text-sm">没有找到匹配的网站</div>
          </div>
        )}
      </div>
    </div>
  )
}
