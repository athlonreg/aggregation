import {
  Calculator, Binary, Lock, Braces, FileText, Network,
  Calendar, Hash, Fingerprint, Link, Banknote, Cpu,
  Globe, Zap
} from 'lucide-react'

interface SidebarProps {
  currentPath: string
  onNavigate: (path: string) => void
}

interface ToolItem {
  label: string
  path: string
  icon: React.ReactNode
}

interface ToolCategory {
  title: string
  items: ToolItem[]
}

const categories: ToolCategory[] = [
  {
    title: '编码转换',
    items: [
      { label: '进制计算器', path: '/calculator', icon: <Calculator size={16} /> },
      { label: '编码转换', path: '/encoding', icon: <Binary size={16} /> },
      { label: 'URL 编解码', path: '/url', icon: <Link size={16} /> },
    ],
  },
  {
    title: '加密解密',
    items: [
      { label: '哈希 / 加解密', path: '/crypto', icon: <Lock size={16} /> },
    ],
  },
  {
    title: '格式化',
    items: [
      { label: 'JSON 格式化', path: '/json', icon: <Braces size={16} /> },
      { label: 'YAML 格式化', path: '/yaml', icon: <FileText size={16} /> },
    ],
  },
  {
    title: '生成器',
    items: [
      { label: 'UUID 生成', path: '/uuid', icon: <Hash size={16} /> },
      { label: 'GUID 生成', path: '/guid', icon: <Fingerprint size={16} /> },
    ],
  },
  {
    title: '网络工具',
    items: [
      { label: '子网掩码计算', path: '/subnet', icon: <Network size={16} /> },
      { label: 'IP 查询', path: '/ip', icon: <Globe size={16} /> },
    ],
  },
  {
    title: '其他工具',
    items: [
      { label: '日期时间', path: '/datetime', icon: <Calendar size={16} /> },
      { label: '人民币大写', path: '/rmb', icon: <Banknote size={16} /> },
      { label: 'ARM HEX 转换', path: '/armhex', icon: <Cpu size={16} /> },
      { label: 'API 测试', path: '/api', icon: <Zap size={16} /> },
    ],
  },
]

export default function Sidebar({ currentPath, onNavigate }: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-5 h-14 border-b border-gray-200 dark:border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
            <circle cx="8" cy="7" r="1.5" fill="white" />
            <circle cx="14" cy="12" r="1.5" fill="white" />
            <circle cx="10" cy="17" r="1.5" fill="white" />
          </svg>
        </div>
        <span className="font-semibold text-gray-900 dark:text-white">DevToolbox</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {categories.map((cat) => (
          <div key={cat.title} className="mb-4">
            <div className="px-2 mb-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {cat.title}
            </div>
            {cat.items.map((item) => {
              const active = currentPath === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`sidebar-link w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm mb-0.5 text-left ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
    </div>
  )
}
