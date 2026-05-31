import { Routes, Route, useLocation } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import Layout from './components/Layout'
import Home from './components/Home'
import Navigation from './components/Navigation'

// Existing tools
import Calculator from './tools/Calculator'
import Encoding from './tools/Encoding'
import CryptoTool from './tools/Crypto'
import JsonFormatter from './tools/JsonFormatter'
import YamlFormatter from './tools/YamlFormatter'
import SubnetCalc from './tools/SubnetCalc'
import DateTime from './tools/DateTime'
import UuidGen from './tools/UuidGen'
import GuidGen from './tools/GuidGen'
import UrlCodec from './tools/UrlCodec'
import RmbConvert from './tools/RmbConvert'
import ArmHex from './tools/ArmHex'
import IpLookup from './tools/IpLookup'
import ApiTester from './tools/ApiTester'

// New encoding tools
const Base64Codec = lazy(() => import('./tools/Base64Codec'))
const HexCodec = lazy(() => import('./tools/HexCodec'))
const UnicodeCodec = lazy(() => import('./tools/UnicodeCodec'))

// Text tools
const TextDiff = lazy(() => import('./tools/TextDiff'))
const CharCount = lazy(() => import('./tools/CharCount'))
const CaseConvert = lazy(() => import('./tools/CaseConvert'))
const TextDedup = lazy(() => import('./tools/TextDedup'))
const TextReplace = lazy(() => import('./tools/TextReplace'))
const TextSummary = lazy(() => import('./tools/TextSummary'))

// Generators
const PasswordGen = lazy(() => import('./tools/PasswordGen'))
const HashGen = lazy(() => import('./tools/HashGen'))
const LoremGen = lazy(() => import('./tools/LoremGen'))
const SerialGen = lazy(() => import('./tools/SerialGen'))

// Formatters
const XmlFormatter = lazy(() => import('./tools/XmlFormatter'))
const SqlFormatter = lazy(() => import('./tools/SqlFormatter'))
const CodeFormatter = lazy(() => import('./tools/CodeFormatter'))

// Converters
const JsonConvert = lazy(() => import('./tools/JsonConvert'))
const TimestampConv = lazy(() => import('./tools/TimestampConv'))
const UnitConvert = lazy(() => import('./tools/UnitConvert'))
const ColorConvert = lazy(() => import('./tools/ColorConvert'))

// Calculators
const RegexTester = lazy(() => import('./tools/RegexTester'))
const CronParser = lazy(() => import('./tools/CronParser'))
const ScientificCalc = lazy(() => import('./tools/ScientificCalc'))
const ProgrammerCalc = lazy(() => import('./tools/ProgrammerCalc'))
const DateCalc = lazy(() => import('./tools/DateCalc'))

// Network tools
const HttpStatus = lazy(() => import('./tools/HttpStatus'))
const PortLookup = lazy(() => import('./tools/PortLookup'))
const MqttClient = lazy(() => import('./tools/MqttClient'))
const WebSocketTester = lazy(() => import('./tools/WebSocketTester'))
const ServerTest = lazy(() => import('./tools/ServerTest'))
const SelfSignedCert = lazy(() => import('./tools/SelfSignedCert'))
const ImageConverter = lazy(() => import('./tools/ImageConverter'))
const QRCodeGenerator = lazy(() => import('./tools/QRCodeGenerator'))
const RedirectPage = lazy(() => import('./tools/RedirectPage'))

function Loading() {
  return <div className="flex items-center justify-center py-12 text-gray-400 text-sm">加载中...</div>
}

const SITE = '套陆聚合站'

const routeMeta: Record<string, { title: string; desc: string }> = {
  '/': { title: SITE, desc: '免费在线开发工具箱，40+ 开发者常用工具' },
  '/nav': { title: '精选导航', desc: '精选开发者常用网站和资源导航' },
  '/calculator': { title: '进制计算器', desc: '在线进制转换计算器，支持二进制、八进制、十进制、十六进制互转' },
  '/encoding': { title: '编码转换', desc: '在线编码转换工具，支持 ASCII、UTF-8、GBK 等多种编码' },
  '/crypto': { title: '哈希 / 加解密', desc: '在线哈希计算和加解密工具，支持 MD5、SHA、AES、DES 等' },
  '/json': { title: 'JSON 格式化', desc: '在线 JSON 格式化、压缩、校验工具，支持 JSON 转 YAML' },
  '/yaml': { title: 'YAML 格式化', desc: '在线 YAML 格式化和校验工具' },
  '/subnet': { title: '子网掩码计算', desc: '在线子网掩码计算器，支持 CIDR 表示法' },
  '/datetime': { title: '日期时间', desc: '在线日期时间工具，时区转换、日期格式化' },
  '/uuid': { title: 'UUID 生成', desc: '在线 UUID v4 随机生成器' },
  '/guid': { title: 'GUID 生成', desc: '在线 GUID 生成器' },
  '/url': { title: 'URL 编解码', desc: '在线 URL 编码解码工具，支持 encodeURIComponent' },
  '/rmb': { title: '人民币大写', desc: '在线人民币金额大写转换工具' },
  '/armhex': { title: 'ARM HEX 转换', desc: 'ARM HEX 文件格式转换工具' },
  '/ip': { title: 'IP 查询', desc: '在线 IP 地址查询，查看本机 IP 和归属地' },
  '/api': { title: 'API 测试', desc: '在线 API 接口测试工具，支持 GET/POST/PUT/DELETE' },
  '/base64': { title: 'Base64 编解码', desc: '在线 Base64 编码解码工具，支持文本和图片' },
  '/hex': { title: 'Hex 编解码', desc: '在线十六进制编解码工具' },
  '/unicode': { title: 'Unicode 编解码', desc: '在线 Unicode 编码解码工具' },
  '/diff': { title: '文本对比', desc: '在线文本对比工具，高亮显示差异内容' },
  '/charcount': { title: '字符统计', desc: '在线字符统计工具，统计字数、行数、字符数' },
  '/case': { title: '大小写转换', desc: '在线英文大小写转换工具' },
  '/dedup': { title: '文本去重', desc: '在线文本去重工具，去除重复行' },
  '/textreplace': { title: '文本替换', desc: '在线文本批量替换工具，支持正则表达式' },
  '/summary': { title: '文本摘要', desc: '在线文本摘要提取工具' },
  '/password': { title: '密码生成', desc: '在线随机密码生成器，支持自定义长度和字符类型' },
  '/hash': { title: '哈希生成', desc: '在线哈希生成工具，支持 MD5、SHA-1、SHA-256、SHA-512' },
  '/lorem': { title: 'Lorem 生成', desc: '在线 Lorem Ipsum 占位文本生成器' },
  '/serial': { title: '序列号生成', desc: '在线序列号批量生成工具' },
  '/xml': { title: 'XML 格式化', desc: '在线 XML 格式化、压缩、校验工具' },
  '/sql': { title: 'SQL 格式化', desc: '在线 SQL 语句格式化美化工具' },
  '/codeformat': { title: '代码格式化', desc: '在线代码格式化工具，支持 JS/TS/Python/Go/C/Lua/SQL' },
  '/jsonconvert': { title: 'JSON 转换', desc: '在线 JSON 转换工具，JSON 转 CSV/XML/YAML' },
  '/timestamp': { title: '时间戳转换', desc: '在线 Unix 时间戳转换工具，秒和毫秒互转' },
  '/unit': { title: '单位转换', desc: '在线单位换算工具，长度、重量、温度、面积等' },
  '/color': { title: '颜色转换', desc: '在线颜色转换工具，HEX/RGB/HSL 互转，颜色选择器' },
  '/regex': { title: '正则测试', desc: '在线正则表达式测试工具，实时匹配高亮' },
  '/cron': { title: 'Cron 解析', desc: '在线 Cron 表达式解析工具，查看下次执行时间' },
  '/scientific': { title: '科学计算器', desc: '在线科学计算器，支持三角函数、对数、幂运算' },
  '/programmer': { title: '程序员计算器', desc: '在线程序员计算器，支持位运算和进制转换' },
  '/datecalc': { title: '日期计算器', desc: '在线日期计算器，计算两个日期之间的天数' },
  '/httpstatus': { title: 'HTTP 状态码', desc: 'HTTP 状态码速查表，200/301/404/500 等含义' },
  '/port': { title: '端口查询', desc: '常用网络端口号查询表' },
  '/mqtt': { title: 'MQTT 客户端', desc: '在线 MQTT 客户端测试工具' },
  '/websocket': { title: 'WebSocket 测试', desc: '在线 WebSocket 连接测试工具' },
  '/servertest': { title: '服务器测试', desc: '在线服务器连通性测试工具' },
  '/cert': { title: '自签证书生成', desc: '在线自签名 SSL/TLS 证书生成工具' },
  '/imageconvert': { title: '图片转换', desc: '在线图片格式转换工具，HEIC 转 JPG、WebP 转 PNG、图片压缩、PDF 拆分合并' },
  '/qrcode': { title: '二维码 & 条码生成', desc: '在线二维码和条码生成器，支持 URL、Wi-Fi、vCard，可带 Logo，批量生成' },
}

export default function App() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  useEffect(() => {
    const meta = routeMeta[location.pathname]
    const title = meta?.title || SITE
    const desc = meta?.desc || ''
    document.title = location.pathname === '/' ? title : `${title} - ${SITE}`
    const descEl = document.querySelector('meta[name="description"]')
    if (descEl && desc) descEl.setAttribute('content', desc)
  }, [location.pathname])

  // Standalone pages: no sidebar/topbar
  if (isHome || location.pathname === '/nav' || location.pathname === '/redirect') {
    return (
      <Suspense fallback={<Loading />}>
        {isHome && <Home />}
        {location.pathname === '/nav' && <Navigation dark={dark} onToggleTheme={() => setDark(d => !d)} />}
        {location.pathname === '/redirect' && <RedirectPage />}
      </Suspense>
    )
  }

  return (
    <Layout dark={dark} onToggleTheme={() => setDark(d => !d)}>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Existing */}
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/encoding" element={<Encoding />} />
          <Route path="/crypto" element={<CryptoTool />} />
          <Route path="/json" element={<JsonFormatter />} />
          <Route path="/yaml" element={<YamlFormatter />} />
          <Route path="/subnet" element={<SubnetCalc />} />
          <Route path="/datetime" element={<DateTime />} />
          <Route path="/uuid" element={<UuidGen />} />
          <Route path="/guid" element={<GuidGen />} />
          <Route path="/url" element={<UrlCodec />} />
          <Route path="/rmb" element={<RmbConvert />} />
          <Route path="/armhex" element={<ArmHex />} />
          <Route path="/ip" element={<IpLookup />} />
          <Route path="/api" element={<ApiTester />} />

          {/* Encoding */}
          <Route path="/base64" element={<Base64Codec />} />
          <Route path="/hex" element={<HexCodec />} />
          <Route path="/unicode" element={<UnicodeCodec />} />

          {/* Text */}
          <Route path="/diff" element={<TextDiff />} />
          <Route path="/charcount" element={<CharCount />} />
          <Route path="/case" element={<CaseConvert />} />
          <Route path="/dedup" element={<TextDedup />} />
          <Route path="/textreplace" element={<TextReplace />} />
          <Route path="/summary" element={<TextSummary />} />

          {/* Generators */}
          <Route path="/password" element={<PasswordGen />} />
          <Route path="/hash" element={<HashGen />} />
          <Route path="/lorem" element={<LoremGen />} />
          <Route path="/serial" element={<SerialGen />} />

          {/* Formatters */}
          <Route path="/xml" element={<XmlFormatter />} />
          <Route path="/sql" element={<SqlFormatter />} />
          <Route path="/codeformat" element={<CodeFormatter />} />

          {/* Converters */}
          <Route path="/jsonconvert" element={<JsonConvert />} />
          <Route path="/timestamp" element={<TimestampConv />} />
          <Route path="/unit" element={<UnitConvert />} />
          <Route path="/color" element={<ColorConvert />} />

          {/* Calculators */}
          <Route path="/regex" element={<RegexTester />} />
          <Route path="/cron" element={<CronParser />} />
          <Route path="/scientific" element={<ScientificCalc />} />
          <Route path="/programmer" element={<ProgrammerCalc />} />
          <Route path="/datecalc" element={<DateCalc />} />

          {/* Network */}
          <Route path="/httpstatus" element={<HttpStatus />} />
          <Route path="/port" element={<PortLookup />} />
          <Route path="/mqtt" element={<MqttClient />} />
          <Route path="/websocket" element={<WebSocketTester />} />
          <Route path="/servertest" element={<ServerTest />} />
          <Route path="/cert" element={<SelfSignedCert />} />
          <Route path="/imageconvert" element={<ImageConverter />} />
          <Route path="/qrcode" element={<QRCodeGenerator />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
