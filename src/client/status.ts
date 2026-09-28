// Upload-card status derived from the server's sniffedFormat field.
// null means the bytes were not a recognized document (the card must not
// trust the extension). text/pdf/docx/xlsx/pptx are AI-readable.

export interface CardStatusMeta {
  sniffed?: string | null
  readHint?: { cost: 'cheap' | 'moderate' | 'expensive' }
  deduplicated?: boolean
}

export function badgeStyle(name: string, sniffed?: string | null): { bg: string; ext: string } {
  // 真实格式优先于扩展名：伪装文件（exe 改 .pdf）按真实内容着色。
  if (sniffed === 'pdf') return { bg: '#C93B2E', ext: 'PDF' }
  if (sniffed === 'docx') return { bg: '#2B579A', ext: 'DOC' }
  if (sniffed === 'xlsx') return { bg: '#217346', ext: 'XLS' }
  if (sniffed === 'pptx') return { bg: '#D24726', ext: 'PPT' }
  if (sniffed === 'text') return { bg: '#757575', ext: 'TXT' }
  // sniffed 字段存在但为 null（未知/二进制）：拒绝按扩展名伪装显示。
  if (sniffed === null) return { bg: '#5B7DB1', ext: 'FILE' }
  const ext = name.slice(name.lastIndexOf('.') + 1).toUpperCase().slice(0, 4)
  const lower = ext.toLowerCase()
  if (lower === 'pdf') return { bg: '#C93B2E', ext: 'PDF' }
  if (lower === 'docx' || lower === 'doc') return { bg: '#2B579A', ext: 'DOC' }
  if (lower === 'xlsx' || lower === 'xls' || lower === 'csv') return { bg: '#217346', ext: 'XLS' }
  if (lower === 'pptx' || lower === 'ppt') return { bg: '#D24726', ext: 'PPT' }
  if (lower === 'txt' || lower === 'md') return { bg: '#757575', ext: 'TXT' }
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
