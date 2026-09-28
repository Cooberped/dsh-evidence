// Card status is driven by the upload response's sniffedFormat, not the
// extension. text is AI-readable; null stays 「格式待确认」 so a disguised
// binary is not painted as a document.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { badgeStyle, readyLabel } from '../src/client/status.ts'

test('sniffed text markdown is AI-readable, not 格式待确认', () => {
  const meta = { sniffed: 'text' as const }
  assert.equal(readyLabel(meta), 'AI 可读取')
  assert.equal(badgeStyle('豆包工作伙伴安全说明书.md', meta.sniffed).ext, 'TXT')
  assert.equal(readyLabel({ ...meta, deduplicated: true }), 'AI 可读取 · 已去重')
  assert.equal(readyLabel({ sniffed: 'text', readHint: { cost: 'expensive' } }), 'AI 可读取 · 大文件')
})

test('sniffed null stays 格式待确认 and does not trust a .md name', () => {
  assert.equal(readyLabel({ sniffed: null }), '格式待确认')
  assert.deepEqual(badgeStyle('notes.md', null), { bg: '#5B7DB1', ext: 'FILE' })
  // 旧 host 没返回 sniffedFormat：不显示「格式待确认」，按扩展名回退。
  assert.equal(readyLabel(undefined), '已就绪')
  assert.equal(badgeStyle('notes.md', undefined).ext, 'TXT')
})
