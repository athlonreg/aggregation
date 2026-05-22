import { Routes, Route, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Home from './components/Home'
import Navigation from './components/Navigation'
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
  }

  useEffect(() => {
    const title = routeTitles[location.pathname] || '套陆聚合站'
    document.title = title
  }, [location.pathname])

  // Standalone pages: no sidebar/topbar
  if (isHome || location.pathname === '/nav') {
    return (
      <>
        {isHome && <Home />}
        {location.pathname === '/nav' && <Navigation dark={dark} onToggleTheme={() => setDark(d => !d)} />}
      </>
    )
  }

  return (
    <Layout dark={dark} onToggleTheme={() => setDark(d => !d)}>
      <Routes>
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
      </Routes>
    </Layout>
  )
}
