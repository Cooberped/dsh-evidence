// Upload-card status derived from the server's sniffedFormat field.
// null means the bytes were not a recognized document (the card must not
// trust the extension). text/pdf/docx/xlsx/pptx are AI-readable.
// Confirmed text keeps the gray badge; the letters follow the filename's
// own short extension (md → MD) instead of a generic TXT.

export interface CardStatusMeta {
  sniffed?: string | null
  readHint?: { cost: 'cheap' | 'moderate' | 'expensive' }
  deduplicated?: boolean
}

const TEXT_BADGE_BG = '#757575'
// These labels mean "the bytes sniffed as this document". A text file
// renamed to one of them must not borrow that badge.
const NON_TEXT_BADGE = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip'])

/** Short uppercase extension for a confirmed-text card, or TXT when there is none. */
function textBadgeExt(name: string): string {
  const slash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'))
  const base = slash >= 0 ? name.slice(slash + 1) : name
  const dot = base.lastIndexOf('.')
  // dot <= 0 skips dotfiles (`.gitignore`) and names with no extension.
  if (dot <= 0 || dot === base.length - 1) return 'TXT'
  const lower = base.slice(dot + 1).toLowerCase()
  // The badge is 34px; four letters is the existing cap. Longer names
  // (markdown) stay TXT rather than a clipped fragment (MARK).
  if (!/^[a-z0-9]{1,4}$/.test(lower) || NON_TEXT_BADGE.has(lower)) return 'TXT'
  return lower.toUpperCase()
}

export function badgeStyle(name: string, sniffed?: string | null): { bg: string; ext: string } {
  // 真实格式优先于扩展名：伪装文件（exe 改 .pdf）按真实内容着色。
  if (sniffed === 'pdf') return { bg: '#C93B2E', ext: 'PDF' }
  if (sniffed === 'docx') return { bg: '#2B579A', ext: 'DOC' }
  if (sniffed === 'xlsx') return { bg: '#217346', ext: 'XLS' }
  if (sniffed === 'pptx') return { bg: '#D24726', ext: 'PPT' }
  // 内容已确认是文本：徽章字母跟文件自己的扩展名，颜色仍是文本灰。
  if (sniffed === 'text') return { bg: TEXT_BADGE_BG, ext: textBadgeExt(name) }
  // sniffed 字段存在但为 null（未知/二进制）：拒绝按扩展名伪装显示。
  if (sniffed === null) return { bg: '#5B7DB1', ext: 'FILE' }
  const ext = name.slice(name.lastIndexOf('.') + 1).toUpperCase().slice(0, 4)
  const lower = ext.toLowerCase()
  if (lower === 'pdf') return { bg: '#C93B2E', ext: 'PDF' }
  if (lower === 'docx' || lower === 'doc') return { bg: '#2B579A', ext: 'DOC' }
  if (lower === 'xlsx' || lower === 'xls' || lower === 'csv') return { bg: '#217346', ext: 'XLS' }
  if (lower === 'pptx' || lower === 'ppt') return { bg: '#D24726', ext: 'PPT' }
  if (lower === 'txt') return { bg: TEXT_BADGE_BG, ext: 'TXT' }
  if (lower === 'md') return { bg: TEXT_BADGE_BG, ext: 'MD' }
  if (lower === 'zip') return { bg: '#7A5BB0', ext: 'ZIP' }
  return { bg: '#5B7DB1', ext: ext === '' ? 'FILE' : ext }
}

export function readyLabel(meta?: CardStatusMeta): string {
  if (meta?.sniffed === 'pdf' || meta?.sniffed === 'docx' || meta?.sniffed === 'xlsx' || meta?.sniffed === 'pptx' || meta?.sniffed === 'text') {
    const size = meta.readHint?.cost === 'expensive' ? ' · 大文件' : ''
    return `AI 可读取${size}${meta.deduplicated === true ? ' · 已去重' : ''}`
  }
  if (meta?.sniffed === null) return '格式待确认'
  return '已就绪'
}
