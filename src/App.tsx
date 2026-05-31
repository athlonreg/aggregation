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

const routeTitles: Record<string, string> = {
  '/': '套陆聚合站',
  '/nav': '精选导航',
  '/calculator': '进制计算器',
  '/encoding': '编码转换',
  '/crypto': '哈希 / 加解密',
  '/json': 'JSON 格式化',
  '/yaml': 'YAML 格式化',
  '/subnet': '子网掩码计算',
  '/datetime': '日期时间',
  '/uuid': 'UUID 生成',
  '/guid': 'GUID 生成',
  '/url': 'URL 编解码',
  '/rmb': '人民币大写',
  '/armhex': 'ARM HEX 转换',
  '/ip': 'IP 查询',
  '/api': 'API 测试',
  '/base64': 'Base64 编解码',
  '/hex': 'Hex 编解码',
  '/unicode': 'Unicode 编解码',
  '/diff': '文本对比',
  '/charcount': '字符统计',
  '/case': '大小写转换',
  '/dedup': '文本去重',
  '/textreplace': '文本替换',
  '/summary': '文本摘要',
  '/password': '密码生成',
  '/hash': '哈希生成',
  '/lorem': 'Lorem 生成',
  '/serial': '序列号生成',
  '/xml': 'XML 格式化',
  '/sql': 'SQL 格式化',
  '/codeformat': '代码格式化',
  '/jsonconvert': 'JSON 转换',
  '/timestamp': '时间戳转换',
  '/unit': '单位转换',
  '/color': '颜色转换',
  '/regex': '正则测试',
  '/cron': 'Cron 解析',
  '/scientific': '科学计算器',
  '/programmer': '程序员计算器',
  '/datecalc': '日期计算器',
  '/httpstatus': 'HTTP 状态码',
  '/port': '端口查询',
  '/mqtt': 'MQTT 客户端',
  '/websocket': 'WebSocket 测试',
  '/servertest': '服务器测试',
  '/cert': '自签证书生成',
  '/imageconvert': '图片转换',
  '/qrcode': '二维码 & 条码生成',
  '/redirect': '安全跳转',
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
    const title = routeTitles[location.pathname] || '套陆聚合站'
    document.title = title
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
