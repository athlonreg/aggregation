import { useState, useCallback } from 'react'
import ToolShell, { Section, ActionButton, TextareaWithCopy } from '../components/ToolShell'
import { Wand2, RotateCcw, Loader2 } from 'lucide-react'
import { format as sqlFormat, type SqlLanguage } from 'sql-formatter'

// ── Language configs ───────────────────────────────────────────────

interface LangOption {
  value: string
  label: string
  group: string
  engine: string
  sample: string
}

const LANGUAGES: LangOption[] = [
  // Prettier
  { value: 'javascript', label: 'JavaScript', group: 'Web', engine: 'prettier', sample: `const greeting="Hello World";function sayHello(name){if(name){console.log(greeting+", "+name+"!")}else{console.log(greeting)}}sayHello("Developer");` },
  { value: 'typescript', label: 'TypeScript', group: 'Web', engine: 'prettier', sample: `interface User{name:string;age:number;email:string}const users:User[]=[{name:"Alice",age:30,email:"alice@example.com"},{name:"Bob",age:25,email:"bob@example.com"}];function findUser(name:string):User|undefined{return users.find(u=>u.name===name)}` },
  { value: 'json', label: 'JSON', group: 'Web', engine: 'prettier', sample: `{"name":"DevToolbox","version":"1.0.0","dependencies":{"react":"18.2.0","typescript":"5.3.0"},"scripts":{"build":"vite build","dev":"vite dev"}}` },
  { value: 'html', label: 'HTML', group: 'Web', engine: 'prettier', sample: `<!DOCTYPE html><html><head><title>Test</title></head><body><div class="container"><h1>Hello</h1><p>This is a test paragraph.</p><ul><li>Item 1</li><li>Item 2</li></ul></div></body></html>` },
  { value: 'css', label: 'CSS', group: 'Web', engine: 'prettier', sample: `body{margin:0;padding:0;font-family:sans-serif;background:#f5f5f5}.container{max-width:1200px;margin:0 auto;padding:20px}.header{background:#333;color:white;padding:10px 20px;display:flex;justify-content:space-between;align-items:center}` },
  { value: 'vue', label: 'Vue SFC', group: 'Web', engine: 'prettier', sample: `<template><div class="app"><h1>{{ title }}</h1><p>{{ message }}</p></div></template>\n<script setup lang="ts">\nimport { ref } from 'vue'\nconst title = ref('Hello')\nconst message = ref('Welcome')\n</script>\n<style scoped>\n.app { padding: 20px; }\n</style>` },
  { value: 'markdown', label: 'Markdown', group: 'Web', engine: 'prettier', sample: `# Title\n## Subtitle\nThis is **bold** and *italic*.\n- Item 1\n- Item 2\n\n\`\`\`js\nconsole.log("hello");\n\`\`\`` },
  { value: 'yaml', label: 'YAML', group: 'Web', engine: 'prettier', sample: `name: DevToolbox\nversion: "1.0.0"\ndependencies:\n  react: "18.2.0"\nscripts:\n  build: vite build` },
  { value: 'graphql', label: 'GraphQL', group: 'Web', engine: 'prettier', sample: `type User{id:ID!name:String!email:String!posts:[Post!]!}type Post{id:ID!title:String!author:User!}type Query{users:[User!]!user(id:ID!):User}` },
  // clang-format (C/C++/C#/Java)
  { value: 'c', label: 'C', group: '系统语言', engine: 'clang-format', sample: `#include <stdio.h>\nint main(){int a=1;int b=2;int c=a+b;printf("Result: %d\\n",c);if(c>2){printf("Greater\\n");}else{printf("Not\\n");}return 0;}` },
  { value: 'cpp', label: 'C++', group: '系统语言', engine: 'clang-format', sample: `#include <iostream>\n#include <vector>\nusing namespace std;\nclass Student{public:string name;int age;Student(string n,int a):name(n),age(a){}void display(){cout<<name<<" is "<<age<<" years old."<<endl;}};\nint main(){vector<Student> students;students.push_back(Student("Alice",20));for(auto&s:students){s.display();}return 0;}` },
  { value: 'csharp', label: 'C#', group: '系统语言', engine: 'clang-format', sample: `using System;using System.Collections.Generic;\nnamespace App{class Program{static void Main(string[] args){var list=new List<string>{"Hello","World"};foreach(var item in list){Console.WriteLine(item);}if(list.Count>0){Console.WriteLine("List not empty");}}}}` },
  { value: 'java', label: 'Java', group: '系统语言', engine: 'clang-format', sample: `import java.util.*;\npublic class Main{public static void main(String[] args){List<String> list=Arrays.asList("Hello","World","Java");for(String s:list){System.out.println(s);}if(!list.isEmpty()){System.out.println("List has "+list.size()+" elements");}}}` },
  // Rust (generic - no WASM formatter available)
  { value: 'rust', label: 'Rust', group: '系统语言', engine: 'generic', sample: `use std::collections::HashMap;\n#[derive(Debug)]\nstruct Student{name:String,age:u32}\nimpl Student{fn new(name:&str,age:u32)->Self{Student{name:name.to_string(),age}}fn greet(&self)->String{format!("Hi, I'm {}, {} years old",self.name,self.age)}}\nfn main(){let mut map=HashMap::new();map.insert("Alice",20);for(name,age)in&map{let s=Student::new(name,*age);println!("{}",s.greet());}}` },
  // Go
  { value: 'go', label: 'Go', group: '脚本/工具', engine: 'gofmt', sample: `package main\nimport("fmt";"strings")\ntype User struct{Name string;Age int}\nfunc(u User)Greet()string{return fmt.Sprintf("Hi, I'm %s, %d years old",u.Name,u.Age)}\nfunc main(){users:=[]User{{"Alice",20},{"Bob",22}}\nfor _,u:=range users{fmt.Println(u.Greet())}}` },
  // Python
  { value: 'python', label: 'Python', group: '脚本/工具', engine: 'ruff', sample: `import os, sys\ndef greet(name):\n    if name:\n        print(f"Hello, {name}!")\n    else:\n        print("Hello, World!")\n\nclass Student:\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age\n    def display(self):\n        print(f"{self.name} is {self.age} years old")\n\nstudents = [Student("Alice", 20), Student("Bob", 22)]\nfor s in students:\n    s.display()` },
  // Lua
  { value: 'lua', label: 'Lua', group: '脚本/工具', engine: 'lua-fmt', sample: `local function greet(name)\nif name then\nprint("Hello, "..name.."!")\nelse\nprint("Hello, World!")\nend\nend\nlocal students = {{name="Alice",age=20},{name="Bob",age=22}}\nfor i,s in ipairs(students) do\nprint(s.name.." is "..s.age.." years old")\nend` },
  // SQL
  { value: 'sql', label: 'SQL', group: 'SQL', engine: 'sql-formatter', sample: `SELECT u.name,u.email,COUNT(o.id) AS order_count,SUM(o.amount) AS total FROM users u LEFT JOIN orders o ON u.id=o.user_id WHERE u.age>20 AND u.status='active' GROUP BY u.id,u.name,u.email HAVING COUNT(o.id)>0 ORDER BY total DESC LIMIT 10;` },
  { value: 'mysql', label: 'MySQL', group: 'SQL', engine: 'sql-formatter', sample: `CREATE TABLE users(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100) NOT NULL,email VARCHAR(255) UNIQUE,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);\nINSERT INTO users(name,email)VALUES('Alice','alice@example.com'),('Bob','bob@example.com');\nSELECT u.*,COUNT(o.id) AS order_count FROM users u LEFT JOIN orders o ON u.id=o.user_id GROUP BY u.id;` },
  { value: 'postgresql', label: 'PostgreSQL', group: 'SQL', engine: 'sql-formatter', sample: `CREATE TABLE users(id SERIAL PRIMARY KEY,name VARCHAR(100) NOT NULL,email VARCHAR(255) UNIQUE,data JSONB DEFAULT '{}');\nINSERT INTO users(name,email,data)VALUES('Alice','alice@example.com','{"role":"admin"}');\nSELECT u.name,u.email,u.data->>'role' AS role FROM users u WHERE u.data @>'{"role":"admin"}';` },
]

// ── WASM formatter singletons ──────────────────────────────────────

const wasmModules: Record<string, unknown> = {}
const wasmInit: Record<string, Promise<void>> = {}

async function ensureWasm(engine: string): Promise<void> {
  if (engine in wasmModules) return
  if (engine in wasmInit) { await wasmInit[engine]; return }

  wasmInit[engine] = (async () => {
    const base = import.meta.env.BASE_URL
    switch (engine) {
      case 'ruff': {
        // @ts-ignore — wasm-bindgen generated, no types
        const bg = await import('@wasm-fmt/ruff_fmt/ruff_fmt_bg.js')
        const { __wbg_set_wasm, format, format_range, ...wasmImports } = bg
        const res = await fetch(`${base}ruff_fmt_bg.wasm`)
        const { instance } = await WebAssembly.instantiate(await res.arrayBuffer(), { './ruff_fmt_bg.js': wasmImports })
        __wbg_set_wasm(instance.exports)
        wasmModules[engine] = { format, format_range }
        break
      }
      case 'clang-format': {
        // @ts-ignore — subpath not in package exports
        const mod = await import('@wasm-fmt/clang-format/clang-format-web.js')
        await mod.default(`${base}clang-format.wasm`)
        wasmModules[engine] = mod
        break
      }
      case 'gofmt': {
        // @ts-ignore — wasm-bindgen generated, no types
        const { format: _format } = await import('@wasm-fmt/gofmt/gofmt_binding.js')
        const res = await fetch(`${base}gofmt.wasm`)
        const { instance } = await WebAssembly.instantiate(await res.arrayBuffer())
        // @ts-ignore — WASM exports not typed
        instance.exports._initialize()
        wasmModules[engine] = { format: (code: string) => (_format as (wasm: unknown, code: string) => string)(instance.exports, code) }
        break
      }
      case 'lua-fmt': {
        // @ts-ignore — wasm-bindgen generated, no types
        const bg = await import('@wasm-fmt/lua_fmt/lua_fmt_bg.js')
        const { __wbg_set_wasm, format, format_range, ...wasmImports } = bg
        const res = await fetch(`${base}lua_fmt_bg.wasm`)
        const { instance } = await WebAssembly.instantiate(await res.arrayBuffer(), { './lua_fmt_bg.js': wasmImports })
        __wbg_set_wasm(instance.exports)
        wasmModules[engine] = { format, format_range }
        break
      }
    }
  })()

  await wasmInit[engine]
}

// ── Prettier format ────────────────────────────────────────────────

async function prettierFormat(code: string, lang: string): Promise<string> {
  const prettier = await import('prettier/standalone')

  const parserMap: Record<string, { parser: string; plugins: Promise<unknown>[] }> = {
    javascript: { parser: 'babel', plugins: [import('prettier/plugins/babel'), import('prettier/plugins/estree')] },
    typescript: { parser: 'typescript', plugins: [import('prettier/plugins/typescript'), import('prettier/plugins/estree')] },
    json: { parser: 'json', plugins: [import('prettier/plugins/estree')] },
    html: { parser: 'html', plugins: [import('prettier/plugins/html')] },
    css: { parser: 'css', plugins: [import('prettier/plugins/postcss')] },
    vue: { parser: 'html', plugins: [import('prettier/plugins/html')] },
    markdown: { parser: 'markdown', plugins: [import('prettier/plugins/markdown')] },
    yaml: { parser: 'yaml', plugins: [import('prettier/plugins/yaml')] },
    graphql: { parser: 'graphql', plugins: [import('prettier/plugins/graphql')] },
  }

  const cfg = parserMap[lang]
  if (!cfg) throw new Error(`不支持的语言: ${lang}`)
  const plugins = await Promise.all(cfg.plugins)
  const opts: Record<string, unknown> = { parser: cfg.parser, plugins }
  if (cfg.parser === 'babel' || cfg.parser === 'typescript') { opts.semi = true; opts.singleQuote = true }
  return (await prettier.format(code, opts)).trimEnd()
}

// ── Generic C-style formatter (for Rust fallback) ──────────────────

function formatCStyle(code: string): string {
  const strings: string[] = []
  let work = code.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g, (m) => { strings.push(m); return `__STR${strings.length - 1}__` })
  work = work.replace(/\s+/g, ' ').trim()

  const result: string[] = []
  let indent = 0
  let line = ''

  const flushLine = () => {
    const trimmed = line.trim().replace(/\s{2,}/g, ' ')
    if (trimmed) result.push('  '.repeat(indent) + trimmed)
    line = ''
  }

  for (let i = 0; i < work.length; i++) {
    const ch = work[i]
    if (ch === '{') { flushLine(); result.push('  '.repeat(indent) + '{'); indent++; continue }
    if (ch === '}') { flushLine(); indent = Math.max(0, indent - 1); let c = '}'; if (work[i + 1] === ';') { c += ';'; i++ } result.push('  '.repeat(indent) + c); continue }
    if (ch === ';') { line += ';'; flushLine(); continue }
    if (ch === '#' && i === 0) { flushLine(); let d = '#'; i++; while (i < work.length && work[i] !== ';') { d += work[i]; i++ } result.push(d.trim()); continue }
    line += ch
  }
  flushLine()

  const final: string[] = []
  for (let j = 0; j < result.length; j++) {
    const cur = result[j].trim()
    const prev = j > 0 ? result[j - 1].trim() : ''
    const isDecl = /^(#include|#define|using\s+|package\s+|import\s+|use\s+|pub\s+|fn\s+|func\s+|class\s+|struct\s+|impl\s+|trait\s+|enum\s+|mod\s+|namespace\s+)/.test(cur)
    if (isDecl && prev && prev !== '{' && prev !== '}' && prev !== '') final.push('')
    final.push(result[j])
  }

  return final.join('\n').replace(/__STR(\d+)__/g, (_, i) => strings[parseInt(i)])
}

// ── Dispatch ───────────────────────────────────────────────────────

async function formatCode(code: string, lang: string): Promise<string> {
  const langCfg = LANGUAGES.find(l => l.value === lang)
  if (!langCfg) throw new Error(`未知语言: ${lang}`)

  switch (langCfg.engine) {
    case 'prettier':
      return prettierFormat(code, lang)

    case 'sql-formatter':
      return sqlFormat(code, { language: lang as SqlLanguage, indentStyle: 'standard', keywordCase: 'upper', linesBetweenQueries: 2 })

    case 'ruff': {
      await ensureWasm('ruff')
      const mod = wasmModules['ruff'] as { format: (code: string) => string }
      return mod.format(code)
    }

    case 'clang-format': {
      await ensureWasm('clang-format')
      const mod = wasmModules['clang-format'] as { format: (code: string, file: string, style: string) => string }
      const extMap: Record<string, string> = { c: 'main.c', cpp: 'main.cpp', csharp: 'main.cs', java: 'Main.java' }
      return mod.format(code, extMap[lang] || 'main.cc', 'LLVM')
    }

    case 'gofmt': {
      await ensureWasm('gofmt')
      const mod = wasmModules['gofmt'] as { format: (code: string) => string }
      return mod.format(code)
    }

    case 'lua-fmt': {
      await ensureWasm('lua-fmt')
      const mod = wasmModules['lua-fmt'] as { format: (code: string) => string }
      return mod.format(code)
    }

    case 'generic':
      return formatCStyle(code)

    default:
      return code
  }
}

// ── Component ──────────────────────────────────────────────────────

export default function CodeFormatter() {
  const [lang, setLang] = useState('javascript')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [formatting, setFormatting] = useState(false)

  const currentLang = LANGUAGES.find(l => l.value === lang)!

  const handleFormat = useCallback(async () => {
    if (!input.trim()) return
    setFormatting(true)
    setError('')
    setOutput('')
    try {
      const result = await formatCode(input, lang)
      setOutput(result)
    } catch (err) {
      setError((err as Error).message || '格式化失败')
    } finally {
      setFormatting(false)
    }
  }, [input, lang])

  const handleLoadSample = useCallback(() => {
    if (currentLang.sample) { setInput(currentLang.sample); setOutput(''); setError('') }
  }, [currentLang])

  // Pre-init WASM when switching language
  const handleLangChange = useCallback((v: string) => {
    setLang(v); setOutput(''); setError('')
    const cfg = LANGUAGES.find(l => l.value === v)
    if (cfg && !['prettier', 'sql-formatter', 'generic'].includes(cfg.engine)) {
      ensureWasm(cfg.engine)
    }
  }, [])

  const groups = [...new Set(LANGUAGES.map(l => l.group))]

  return (
    <ToolShell title="代码格式化" description="支持 20 种语言的精确格式化（WASM / Prettier / sql-formatter）">
      <Section title="语言选择">
        {groups.map(group => (
          <div key={group} className="mb-3">
            <div className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1.5">{group}</div>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGES.filter(l => l.group === group).map(l => (
                <button
                  key={l.value}
                  onClick={() => handleLangChange(l.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    lang === l.value
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                  }`}
                >
                  {l.label}
                  <span className="ml-1 text-[10px] text-gray-400">
                    {l.engine === 'prettier' ? 'P' : l.engine === 'sql-formatter' ? 'S' : l.engine === 'generic' ? '~' : 'W'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="mt-1 text-xs text-gray-400 space-x-3">
          <span><strong className="text-green-500">P</strong> Prettier</span>
          <span><strong className="text-blue-500">W</strong> WASM</span>
          <span><strong className="text-purple-500">S</strong> sql-formatter</span>
          <span><strong className="text-gray-500">~</strong> 通用</span>
        </div>
      </Section>

      <Section title="输入代码">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={handleLoadSample} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors">
            <RotateCcw size={12} /> 加载示例
          </button>
          <button onClick={() => { setInput(output); setOutput('') }} disabled={!output} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            结果 → 输入
          </button>
        </div>
        <TextareaWithCopy value={input} onChange={setInput} placeholder={`粘贴 ${currentLang.label} 代码...`} rows={12} />
        <div className="mt-3">
          <ActionButton onClick={handleFormat} disabled={formatting || !input.trim()}>
            <span className="inline-flex items-center gap-1.5">
              {formatting ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
              {formatting ? '格式化中...' : '格式化'}
            </span>
          </ActionButton>
        </div>
      </Section>

      {error && (
        <Section>
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 font-mono">{error}</div>
        </Section>
      )}

      {output && (
        <Section title="格式化结果">
          <TextareaWithCopy value={output} readOnly rows={12} />
        </Section>
      )}
    </ToolShell>
  )
}
