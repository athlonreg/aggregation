import { useState } from 'react'
import ToolShell, { Section, ActionButton, TextareaWithCopy, TextInput, Select } from '../components/ToolShell'

const WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'vitae', 'elementum',
  'curabitur', 'sollicitudin', 'purus', 'viverra', 'accumsan', 'nisl', 'nunc',
  'faucibus', 'ornare', 'suspendisse', 'potenti', 'nullam', 'ac', 'tortor',
  'dignissim', 'convallis', 'aenean', 'pharetra', 'lacus', 'vel', 'facilisis',
  'volutpat', 'blandit', 'cursus', 'risus', 'pellentesque', 'habitant', 'morbi',
]

function pickRandom(arr: string[]): string {
  const idx = new Uint32Array(1)
  crypto.getRandomValues(idx)
  return arr[idx[0] % arr.length]
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function generateWords(count: number): string {
  return Array.from({ length: count }, () => pickRandom(WORDS)).join(' ')
}

function generateSentence(): string {
  const len = 8 + Math.floor(Math.random() * 12)
  const words = Array.from({ length: len }, () => pickRandom(WORDS))
  words[0] = capitalize(words[0])
  return words.join(' ') + '.'
}

function generateSentences(count: number): string {
  return Array.from({ length: count }, () => generateSentence()).join(' ')
}

function generateParagraph(): string {
  const sentenceCount = 4 + Math.floor(Math.random() * 5)
  return generateSentences(sentenceCount)
}

function generateParagraphs(count: number): string {
  return Array.from({ length: count }, () => generateParagraph()).join('\n\n')
}

type Mode = 'paragraphs' | 'sentences' | 'words'

export default function LoremGen() {
  const [mode, setMode] = useState<Mode>('paragraphs')
  const [count, setCount] = useState('3')
  const [output, setOutput] = useState('')

  const handleGenerate = () => {
    const n = Math.min(Math.max(parseInt(count) || 3, 1), 100)
    let result = ''
    if (mode === 'paragraphs') result = generateParagraphs(n)
    else if (mode === 'sentences') result = generateSentences(n)
    else result = generateWords(n)
    setOutput(result)
  }

  return (
    <ToolShell title="Lorem 生成" description="生成 Lorem Ipsum 占位文本">
      <Section>
        <div className="flex flex-wrap gap-3 items-end">
          <Select value={mode} onChange={v => setMode(v as Mode)} options={[
            { value: 'paragraphs', label: '段落' },
            { value: 'sentences', label: '句子' },
            { value: 'words', label: '单词' },
          ]} label="类型" />
          <div className="w-24">
            <TextInput value={count} onChange={setCount} placeholder="3" label="数量" />
          </div>
          <ActionButton onClick={handleGenerate}>生成</ActionButton>
        </div>
        {output && (
          <div className="mt-3">
            <TextareaWithCopy value={output} readOnly label="结果" rows={Math.min(parseInt(count) || 3, 15)} />
          </div>
        )}
      </Section>
    </ToolShell>
  )
}
