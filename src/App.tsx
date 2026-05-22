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
import WhoisLookup from './tools/WhoisLookup'
import IcpLookup from './tools/IcpLookup'
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
        <Route path="/whois" element={<WhoisLookup />} />
        <Route path="/icp" element={<IcpLookup />} />
        <Route path="/api" element={<ApiTester />} />
      </Routes>
    </Layout>
  )
}
