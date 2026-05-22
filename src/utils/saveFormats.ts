// ── Types ─────────────────────────────────────────────────────────

export type SaveDataType = 'uint8' | 'uint16le' | 'uint32le' | 'bcd' | 'flags' | 'string'
export type DisplayFormat = 'decimal' | 'hex' | 'lookup' | 'flag-list'

export interface SaveField {
  id: string
  name: string
  group: string
  offset: number
  length: number
  dataType: SaveDataType
  displayFormat: DisplayFormat
  min?: number
  max?: number
  lookupTable?: string[]
  unit?: string
  hidden?: boolean
}

export interface DetectionSignature {
  offset: number
  bytes: number[]
}

export interface BulkActionDef {
  id: string
  label: string
  group: string
}

export interface GameVersion {
  id: string
  gameId: string
  name: string
  gameName: string
  saveSize: number
  signatures: DetectionSignature[]
  fields: SaveField[]
  bulkActions?: BulkActionDef[]
}

// ── Lookup Tables ─────────────────────────────────────────────────

// 吞食天地 物品
const TSWD_ITEMS: string[] = [
  '无', '铜剑', '铁剑', '钢剑', '玄铁剑', '倚天剑', '青釭剑', '七星剑',
  '铜枪', '铁枪', '钢枪', '丈八蛇矛', '方天画戟', '青龙偃月刀',
  '铜刀', '铁刀', '钢刀', '古锭刀', '偃月刀',
  '皮甲', '锁子甲', '铁甲', '钢甲', '玄铁甲', '藤甲', '连环铠',
  '皮盾', '铁盾', '钢盾', '玄铁盾',
  '头盔', '铁盔', '钢盔', '玄铁盔',
  '皮靴', '铁靴', '钢靴',
  '赤兔马', '的卢马', '绝影马', '爪黄飞电',
  '回复药', '解毒药', '复活药', '智力果', '武力果', '速度果',
  '兵法书', '孙子兵法', '三略', '六韬', '孟德新书',
  '会心丹', '银仙丹', '金仙丹',
]

// 吞食天地 装备（与物品共用同一张表）

// 重装机兵 武器
const MM_WEAPONS: string[] = [
  '无', '主炮', '机枪', '导弹', '电击枪', '激光枪',
  'ATM发射器', '格林炮', '加农炮', '波坦炮', '风暴炮',
  '火焰枪', '冰冻枪', '雷电枪', '音波枪', '光束枪',
  '榴弹炮', '火箭炮', '等离子炮', '中子弹',
]

// 重装机兵 底盘
const MM_CHASSIS: string[] = [
  '无', '越野车', '装甲车', '战车', '重型战车', '导弹车',
  '高速战车', '巨型战车', '超重型战车',
]

// 重装机兵 引擎
const MM_ENGINES: string[] = [
  '无', '汽油引擎', '柴油引擎', '涡轮引擎', '核能引擎', '等离子引擎',
]

// 重装机兵 物品
const MM_ITEMS: string[] = [
  '无', '回复饮料', '急救包', '修理包', '解毒剂',
  '穿甲弹', '榴弹', '导弹', '特殊弹',
  '望远镜', '探测器', '地图', '钥匙',
  '防弹衣', '防火服', '防毒面具',
]

// ── Helper: generate character fields ────────────────────────────

function charFields(
  prefix: string,
  name: string,
  baseOffset: number,
): SaveField[] {
  return [
    { id: `${prefix}_hp`, name: 'HP', group: name, offset: baseOffset, length: 2, dataType: 'uint16le', displayFormat: 'decimal', min: 0, max: 9999 },
    { id: `${prefix}_maxhp`, name: '最大HP', group: name, offset: baseOffset + 2, length: 2, dataType: 'uint16le', displayFormat: 'decimal', min: 0, max: 9999 },
    { id: `${prefix}_mp`, name: 'MP', group: name, offset: baseOffset + 4, length: 2, dataType: 'uint16le', displayFormat: 'decimal', min: 0, max: 999 },
    { id: `${prefix}_maxmp`, name: '最大MP', group: name, offset: baseOffset + 6, length: 2, dataType: 'uint16le', displayFormat: 'decimal', min: 0, max: 999 },
    { id: `${prefix}_atk`, name: '攻击力', group: name, offset: baseOffset + 8, length: 2, dataType: 'uint16le', displayFormat: 'decimal', min: 0, max: 999 },
    { id: `${prefix}_def`, name: '防御力', group: name, offset: baseOffset + 10, length: 2, dataType: 'uint16le', displayFormat: 'decimal', min: 0, max: 999 },
    { id: `${prefix}_spd`, name: '速度', group: name, offset: baseOffset + 12, length: 1, dataType: 'uint8', displayFormat: 'decimal', min: 0, max: 255 },
    { id: `${prefix}_level`, name: '等级', group: name, offset: baseOffset + 14, length: 1, dataType: 'uint8', displayFormat: 'decimal', min: 1, max: 99 },
    { id: `${prefix}_exp`, name: '经验值', group: name, offset: baseOffset + 16, length: 2, dataType: 'uint16le', displayFormat: 'decimal', min: 0, max: 9999, unit: 'EXP' },
  ]
}

// ── 吞食天地 角色名 ──────────────────────────────────────────────

const TSWD_CHARS = ['刘备', '关羽', '张飞', '赵云', '诸葛亮', '黄忠', '马超']

// ── 吞食天地 原版 ────────────────────────────────────────────────

function makeTswdFields(): SaveField[] {
  const fields: SaveField[] = []
  // 角色数据: 7 个角色，每个 32 字节，起始 0x0100
  TSWD_CHARS.forEach((name, i) => {
    fields.push(...charFields(`c${i + 1}`, `角色${i + 1} - ${name}`, 0x0100 + i * 0x20))
  })
  // 全局
  fields.push(
    { id: 'gold', name: '金币', group: '全局数据', offset: 0x0030, length: 3, dataType: 'bcd', displayFormat: 'decimal', min: 0, max: 999999, unit: 'G' },
    { id: 'food', name: '粮草', group: '全局数据', offset: 0x0034, length: 2, dataType: 'uint16le', displayFormat: 'decimal', min: 0, max: 9999 },
    { id: 'story', name: '剧情进度', group: '全局数据', offset: 0x0020, length: 1, dataType: 'uint8', displayFormat: 'hex' },
  )
  // 物品栏 20 格
  for (let i = 0; i < 20; i++) {
    fields.push({ id: `inv${i}`, name: `物品${i + 1}`, group: '物品栏', offset: 0x0300 + i, length: 1, dataType: 'uint8', displayFormat: 'lookup', lookupTable: TSWD_ITEMS })
  }
  return fields
}

function makeTswd1p1Fields(): SaveField[] {
  const fields = makeTswdFields()
  // 1+1 改版最大值可能更高
  return fields.map(f => {
    if (f.dataType === 'uint16le' && f.max && f.max < 9999) return { ...f, max: 9999 }
    return f
  })
}

// ── 重装机兵 角色名 ──────────────────────────────────────────────

const MM_CHARS = ['主角', '机械师', '战士', '猎人']

function makeMmFields(): SaveField[] {
  const fields: SaveField[] = []
  // 角色数据: 4 个角色
  MM_CHARS.forEach((name, i) => {
    fields.push(...charFields(`c${i + 1}`, `角色${i + 1} - ${name}`, 0x0100 + i * 0x20))
  })
  // 战车: 3 辆
  for (let t = 0; t < 3; t++) {
    const base = 0x0200 + t * 0x40
    const g = `战车${t + 1}`
    fields.push(
      { id: `t${t + 1}_hp`, name: '装甲', group: g, offset: base, length: 2, dataType: 'uint16le', displayFormat: 'decimal', min: 0, max: 9999 },
      { id: `t${t + 1}_maxhp`, name: '最大装甲', group: g, offset: base + 2, length: 2, dataType: 'uint16le', displayFormat: 'decimal', min: 0, max: 9999 },
      { id: `t${t + 1}_weight`, name: '载重', group: g, offset: base + 4, length: 2, dataType: 'uint16le', displayFormat: 'decimal', min: 0, max: 999 },
      { id: `t${t + 1}_w1`, name: '武器1', group: g, offset: base + 0x10, length: 1, dataType: 'uint8', displayFormat: 'lookup', lookupTable: MM_WEAPONS },
      { id: `t${t + 1}_w2`, name: '武器2', group: g, offset: base + 0x11, length: 1, dataType: 'uint8', displayFormat: 'lookup', lookupTable: MM_WEAPONS },
      { id: `t${t + 1}_w3`, name: '武器3', group: g, offset: base + 0x12, length: 1, dataType: 'uint8', displayFormat: 'lookup', lookupTable: MM_WEAPONS },
      { id: `t${t + 1}_chassis`, name: '底盘', group: g, offset: base + 0x14, length: 1, dataType: 'uint8', displayFormat: 'lookup', lookupTable: MM_CHASSIS },
      { id: `t${t + 1}_engine`, name: '引擎', group: g, offset: base + 0x15, length: 1, dataType: 'uint8', displayFormat: 'lookup', lookupTable: MM_ENGINES },
    )
  }
  // 全局
  fields.push(
    { id: 'gold', name: '金币', group: '全局数据', offset: 0x0030, length: 3, dataType: 'bcd', displayFormat: 'decimal', min: 0, max: 999999, unit: 'G' },
    { id: 'special_ammo', name: '特殊弹', group: '全局数据', offset: 0x0038, length: 2, dataType: 'uint16le', displayFormat: 'decimal', min: 0, max: 999 },
  )
  // 物品栏 20 格
  for (let i = 0; i < 20; i++) {
    fields.push({ id: `inv${i}`, name: `物品${i + 1}`, group: '物品栏', offset: 0x0400 + i, length: 1, dataType: 'uint8', displayFormat: 'lookup', lookupTable: MM_ITEMS })
  }
  return fields
}

// ── Bulk Actions ─────────────────────────────────────────────────

const charBulkActions = (chars: string[]): BulkActionDef[] =>
  chars.map((_, i) => ({ id: `max_c${i + 1}`, label: '全部最大', group: `角色${i + 1}` }))

const tankBulkActions = (count: number): BulkActionDef[] =>
  Array.from({ length: count }, (_, i) => ({ id: `max_t${i + 1}`, label: '全部最大', group: `战车${i + 1}` }))

// ── All Game Versions ────────────────────────────────────────────

export const allGameVersions: GameVersion[] = [
  // 吞食天地 原版
  {
    id: 'tswd_original',
    gameId: 'tswd',
    name: '吞食天地 - 原版',
    gameName: '吞食天地',
    saveSize: 8192,
    signatures: [{ offset: 0x0000, bytes: [0x00] }],
    fields: makeTswdFields(),
    bulkActions: charBulkActions(TSWD_CHARS),
  },
  // 吞食天地 1+1
  {
    id: 'tswd_1p1',
    gameId: 'tswd',
    name: '吞食天地 - 1+1',
    gameName: '吞食天地',
    saveSize: 8192,
    signatures: [],
    fields: makeTswd1p1Fields(),
    bulkActions: charBulkActions(TSWD_CHARS),
  },
  // 吞食天地 卫道
  {
    id: 'tswd_weidao',
    gameId: 'tswd',
    name: '吞食天地 - 卫道',
    gameName: '吞食天地',
    saveSize: 8192,
    signatures: [],
    fields: makeTswdFields(),
    bulkActions: charBulkActions(TSWD_CHARS),
  },
  // 吞食天地 英杰传
  {
    id: 'tswd_yingjie',
    gameId: 'tswd',
    name: '吞食天地 - 英杰传',
    gameName: '吞食天地',
    saveSize: 8192,
    signatures: [],
    fields: makeTswdFields(),
    bulkActions: charBulkActions(TSWD_CHARS),
  },
  // 重装机兵 原版
  {
    id: 'mm_original',
    gameId: 'mm',
    name: '重装机兵 - 原版',
    gameName: '重装机兵',
    saveSize: 8192,
    signatures: [{ offset: 0x0000, bytes: [0x00] }],
    fields: makeMmFields(),
    bulkActions: [...charBulkActions(MM_CHARS), ...tankBulkActions(3)],
  },
  // 重装机兵 改版
  {
    id: 'mm_hack',
    gameId: 'mm',
    name: '重装机兵 - 改版',
    gameName: '重装机兵',
    saveSize: 8192,
    signatures: [],
    fields: makeMmFields(),
    bulkActions: [...charBulkActions(MM_CHARS), ...tankBulkActions(3)],
  },
]

// ── Apply bulk action ────────────────────────────────────────────

export function applyBulkAction(
  action: BulkActionDef,
  fields: SaveField[],
): Record<string, number> {
  const result: Record<string, number> = {}
  const groupFields = fields.filter(f => f.group.startsWith(action.group))
  for (const f of groupFields) {
    if (f.max !== undefined) result[f.id] = f.max
  }
  return result
}
