// ── Detected field from generic analysis ─────────────────────────

export interface DetectedField {
  id: string
  offset: number
  length: number
  dataType: 'uint8' | 'uint16le' | 'uint24le' | 'bcd2' | 'bcd3'
  label: string
  group: string
  value: number
  editable: boolean
}

// ── Read value ───────────────────────────────────────────────────

export function readValue(buf: Uint8Array, offset: number, dataType: DetectedField['dataType']): number {
  switch (dataType) {
    case 'uint8': return buf[offset] ?? 0
    case 'uint16le': return (buf[offset] ?? 0) | ((buf[offset + 1] ?? 0) << 8)
    case 'uint24le': return (buf[offset] ?? 0) | ((buf[offset + 1] ?? 0) << 8) | ((buf[offset + 2] ?? 0) << 16)
    case 'bcd2': {
      const b0 = buf[offset] ?? 0, b1 = buf[offset + 1] ?? 0
      return ((b1 >> 4) * 10 + (b1 & 0xF)) * 100 + ((b0 >> 4) * 10 + (b0 & 0xF))
    }
    case 'bcd3': {
      const b0 = buf[offset] ?? 0, b1 = buf[offset + 1] ?? 0, b2 = buf[offset + 2] ?? 0
      return ((b2 >> 4) * 10 + (b2 & 0xF)) * 10000 + ((b1 >> 4) * 10 + (b1 & 0xF)) * 100 + ((b0 >> 4) * 10 + (b0 & 0xF))
    }
  }
}

// ── Write value ──────────────────────────────────────────────────

export function writeValue(buf: Uint8Array, offset: number, dataType: DetectedField['dataType'], value: number): void {
  let v = Math.max(0, Math.floor(value))
  switch (dataType) {
    case 'uint8':
      buf[offset] = Math.min(v, 255)
      break
    case 'uint16le':
      v = Math.min(v, 65535)
      buf[offset] = v & 0xFF
      buf[offset + 1] = (v >> 8) & 0xFF
      break
    case 'uint24le':
      v = Math.min(v, 16777215)
      buf[offset] = v & 0xFF
      buf[offset + 1] = (v >> 8) & 0xFF
      buf[offset + 2] = (v >> 16) & 0xFF
      break
    case 'bcd2':
      v = Math.min(v, 9999)
      buf[offset] = ((Math.floor(v / 1) % 10) | ((Math.floor(v / 10) % 10) << 4))
      buf[offset + 1] = ((Math.floor(v / 100) % 10) | ((Math.floor(v / 1000) % 10) << 4))
      break
    case 'bcd3':
      v = Math.min(v, 999999)
      buf[offset] = ((Math.floor(v / 1) % 10) | ((Math.floor(v / 10) % 10) << 4))
      buf[offset + 1] = ((Math.floor(v / 100) % 10) | ((Math.floor(v / 1000) % 10) << 4))
      buf[offset + 2] = ((Math.floor(v / 10000) % 10) | ((Math.floor(v / 100000) % 10) << 4))
      break
  }
}

// ── Check if byte is valid BCD (both nibbles 0-9) ───────────────

function isBcdByte(b: number): boolean {
  return (b & 0x0F) <= 9 && ((b >> 4) & 0x0F) <= 9
}

// ── Find non-zero regions ────────────────────────────────────────

interface Region { start: number; end: number }

function findNonZeroRegions(buf: Uint8Array, minLen = 16): Region[] {
  const regions: Region[] = []
  let i = 0
  while (i < buf.length) {
    while (i < buf.length && buf[i] === 0) i++
    const start = i
    let lastNonZero = i
    while (i < buf.length) {
      if (buf[i] !== 0) lastNonZero = i
      if (i - lastNonZero > 2) break
      i++
    }
    const end = lastNonZero + 1
    if (end - start >= minLen) regions.push({ start, end })
  }
  return regions
}

// ── Detect repeating structures ──────────────────────────────────

interface RepeatingPattern {
  blockSize: number
  count: number
  offsets: number[]
}

function detectRepeatingPatterns(buf: Uint8Array, region: Region): RepeatingPattern[] {
  const patterns: RepeatingPattern[] = []
  const len = region.end - region.start

  for (let bs = 8; bs <= 64; bs += 2) {
    if (len < bs * 3) continue // need at least 3 blocks
    let matchCount = 0
    const offsets: number[] = []

    for (let off = region.start; off + bs <= region.end; off += bs) {
      let hasContent = false
      for (let j = 0; j < bs; j++) {
        if (buf[off + j] !== 0) { hasContent = true; break }
      }
      if (hasContent) { matchCount++; offsets.push(off) }
    }

    if (matchCount >= 3 && matchCount <= 20) {
      const firstBlock = offsets[0]
      const pattern = new Uint8Array(bs)
      for (let j = 0; j < bs; j++) pattern[j] = buf[firstBlock + j] !== 0 ? 1 : 0

      let similarCount = 0
      for (const off of offsets) {
        let matches = 0
        for (let j = 0; j < bs; j++) {
          if ((buf[off + j] !== 0 ? 1 : 0) === pattern[j]) matches++
        }
        if (matches / bs > 0.7) similarCount++ // stricter similarity
      }

      if (similarCount >= 3) patterns.push({ blockSize: bs, count: similarCount, offsets })
    }
  }

  patterns.sort((a, b) => {
    const scoreA = a.count * (a.blockSize >= 16 && a.blockSize <= 48 ? 2 : 1)
    const scoreB = b.count * (b.blockSize >= 16 && b.blockSize <= 48 ? 2 : 1)
    return scoreB - scoreA
  })

  return patterns.slice(0, 2)
}

// ── Score a block — does it look like RPG stat data? ─────────────

function scoreBlockAsStats(buf: Uint8Array, blockStart: number, blockSize: number): number {
  let score = 0
  // Check uint16le pairs in typical stat ranges
  for (let off = 0; off < blockSize - 1; off += 2) {
    const v = (buf[blockStart + off] ?? 0) | ((buf[blockStart + off + 1] ?? 0) << 8)
    if (v >= 100 && v <= 9999) score += 3 // strong stat signal
    else if (v >= 10 && v <= 99) score += 1
  }
  // Check for level-like uint8 (10-99)
  for (let j = 0; j < blockSize; j++) {
    const b = buf[blockStart + j] ?? 0
    if (b >= 10 && b <= 99) score += 1
  }
  return score
}

// ── Main analysis function ───────────────────────────────────────

export function analyzeBuffer(buf: Uint8Array): DetectedField[] {
  const fields: DetectedField[] = []
  const usedOffsets = new Set<number>()
  let fieldIdx = 0

  const regions = findNonZeroRegions(buf, 16)

  // Only detect repeating structures (characters, inventory, etc.)
  for (const region of regions) {
    const patterns = detectRepeatingPatterns(buf, region)
    if (patterns.length === 0) continue

    const best = patterns[0]
    // Require the block to actually look like stat data
    const avgScore = best.offsets.reduce((sum, off) => sum + scoreBlockAsStats(buf, off, best.blockSize), 0) / best.count
    if (avgScore < 6) continue

    const blockLabel = best.blockSize <= 16 ? '角色' : best.blockSize <= 32 ? '数据块' : '大块'

    for (let blockIdx = 0; blockIdx < Math.min(best.count, 20); blockIdx++) {
      const blockStart = best.offsets[blockIdx]
      const group = `${blockLabel}${blockIdx + 1} (0x${blockStart.toString(16).toUpperCase().padStart(4, '0')})`

      let off = 0
      while (off < best.blockSize) {
        const absOff = blockStart + off
        if (usedOffsets.has(absOff)) { off++; continue }

        const b0 = buf[absOff] ?? 0
        const b1 = buf[absOff + 1] ?? 0

        // uint16le — must have high byte set (≥256) and be in stat range
        if (off + 1 < best.blockSize && b1 > 0) {
          const v16 = b0 | (b1 << 8)
          if (v16 >= 256 && v16 <= 9999) {
            fields.push({
              id: `f${fieldIdx++}`, offset: absOff, length: 2,
              dataType: 'uint16le', label: `+0x${off.toString(16)} (uint16)`,
              group, value: v16, editable: true,
            })
            usedOffsets.add(absOff); usedOffsets.add(absOff + 1)
            off += 2
            continue
          }
        }

        // uint8 — only 10-99 (level/attack/defense-like)
        if (b0 >= 10 && b0 <= 99) {
          fields.push({
            id: `f${fieldIdx++}`, offset: absOff, length: 1,
            dataType: 'uint8', label: `+0x${off.toString(16)} (uint8)`,
            group, value: b0, editable: true,
          })
          usedOffsets.add(absOff)
        }
        off++
      }
    }
  }

  // Scan for standalone BCD3 values (gold/money only — high confidence)
  for (const region of regions) {
    let off = region.start
    while (off < region.end - 2) {
      if (usedOffsets.has(off)) { off++; continue }

      const b0 = buf[off] ?? 0
      const b1 = buf[off + 1] ?? 0
      const b2 = buf[off + 2] ?? 0

      if (isBcdByte(b0) && isBcdByte(b1) && isBcdByte(b2)) {
        const bcdVal = ((b2 >> 4) * 10 + (b2 & 0xF)) * 10000 + ((b1 >> 4) * 10 + (b1 & 0xF)) * 100 + ((b0 >> 4) * 10 + (b0 & 0xF))
        // Only large BCD values (likely gold/money), min 1000
        if (bcdVal >= 1000 && bcdVal <= 999999) {
          const group = `区域 0x${region.start.toString(16).toUpperCase().padStart(4, '0')}`
          fields.push({
            id: `f${fieldIdx++}`, offset: off, length: 3,
            dataType: 'bcd3', label: `0x${off.toString(16).toUpperCase().padStart(4, '0')} (BCD)`,
            group, value: bcdVal, editable: true,
          })
          usedOffsets.add(off); usedOffsets.add(off + 1); usedOffsets.add(off + 2)
          off += 3
          continue
        }
      }
      off++
    }
  }

  return fields
}

// ── Serialize edits back to buffer ───────────────────────────────

export function applyEdits(original: Uint8Array, fields: DetectedField[], edits: Record<string, number>): Uint8Array {
  const buf = new Uint8Array(original)
  const fieldMap = new Map(fields.map(f => [f.id, f]))
  for (const [id, value] of Object.entries(edits)) {
    const field = fieldMap.get(id)
    if (field) writeValue(buf, field.offset, field.dataType, value)
  }
  return buf
}
