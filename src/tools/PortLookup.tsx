import { useState, useMemo } from 'react'
import ToolShell, { Section, TextInput } from '../components/ToolShell'

interface PortEntry {
  port: number
  protocol: string
  service: string
  description: string
}

const PORTS: PortEntry[] = [
  { port: 20, protocol: 'TCP', service: 'FTP-Data', description: 'FTP 数据传输端口' },
  { port: 21, protocol: 'TCP', service: 'FTP', description: 'FTP 控制端口' },
  { port: 22, protocol: 'TCP', service: 'SSH', description: '安全远程登录' },
  { port: 23, protocol: 'TCP', service: 'Telnet', description: '远程登录（不安全）' },
  { port: 25, protocol: 'TCP', service: 'SMTP', description: '邮件发送协议' },
  { port: 53, protocol: 'TCP/UDP', service: 'DNS', description: '域名解析服务' },
  { port: 80, protocol: 'TCP', service: 'HTTP', description: '超文本传输协议' },
  { port: 110, protocol: 'TCP', service: 'POP3', description: '邮件接收协议' },
  { port: 143, protocol: 'TCP', service: 'IMAP', description: '互联网消息访问协议' },
  { port: 443, protocol: 'TCP', service: 'HTTPS', description: '加密 HTTP 传输' },
  { port: 465, protocol: 'TCP', service: 'SMTPS', description: '加密 SMTP' },
  { port: 587, protocol: 'TCP', service: 'SMTP', description: '邮件提交端口' },
  { port: 993, protocol: 'TCP', service: 'IMAPS', description: '加密 IMAP' },
  { port: 995, protocol: 'TCP', service: 'POP3S', description: '加密 POP3' },
  { port: 1433, protocol: 'TCP', service: 'MSSQL', description: 'Microsoft SQL Server' },
  { port: 1521, protocol: 'TCP', service: 'Oracle', description: 'Oracle 数据库' },
  { port: 3306, protocol: 'TCP', service: 'MySQL', description: 'MySQL 数据库' },
  { port: 3389, protocol: 'TCP', service: 'RDP', description: '远程桌面协议' },
  { port: 5432, protocol: 'TCP', service: 'PostgreSQL', description: 'PostgreSQL 数据库' },
  { port: 5672, protocol: 'TCP', service: 'RabbitMQ', description: '消息队列服务' },
  { port: 6379, protocol: 'TCP', service: 'Redis', description: '内存数据库/缓存' },
  { port: 6443, protocol: 'TCP', service: 'K8s API', description: 'Kubernetes API Server' },
  { port: 8080, protocol: 'TCP', service: 'HTTP-Alt', description: 'HTTP 备用端口' },
  { port: 8443, protocol: 'TCP', service: 'HTTPS-Alt', description: 'HTTPS 备用端口' },
  { port: 8500, protocol: 'TCP', service: 'Consul', description: '服务发现与配置管理' },
  { port: 8848, protocol: 'TCP', service: 'Nacos', description: '服务注册与配置中心' },
  { port: 9090, protocol: 'TCP', service: 'Prometheus', description: '监控与告警系统' },
  { port: 9200, protocol: 'TCP', service: 'Elasticsearch', description: '搜索引擎/全文检索' },
  { port: 2181, protocol: 'TCP', service: 'ZooKeeper', description: '分布式协调服务' },
  { port: 2379, protocol: 'TCP', service: 'etcd', description: '分布式键值存储' },
  { port: 27017, protocol: 'TCP', service: 'MongoDB', description: '文档数据库' },
]

export default function PortLookup() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return PORTS
    return PORTS.filter(p =>
      String(p.port).includes(q) ||
      p.service.toLowerCase().includes(q) ||
      p.description.includes(q) ||
      p.protocol.toLowerCase().includes(q)
    )
  }, [search])

  return (
    <ToolShell title="端口查询" description="常用网络端口及服务速查，支持按端口号或服务名搜索">
      <Section>
        <TextInput value={search} onChange={setSearch} placeholder="搜索端口号、协议或服务名..." />
      </Section>

      <Section>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400 w-20">端口</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400 w-24">协议</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400 w-32">服务</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">说明</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-8">未找到匹配的端口</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.port} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-2 px-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 font-mono font-bold text-sm">
                        {p.port}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{p.protocol}</td>
                    <td className="py-2 px-3 font-medium text-gray-900 dark:text-gray-100">{p.service}</td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{p.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-xs text-gray-400">共 {filtered.length} 个端口</div>
      </Section>
    </ToolShell>
  )
}
