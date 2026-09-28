// Card readability is driven by the upload response's sniffedFormat, not the
// extension. text is AI-readable and the badge letters follow the filename;
// null stays 「格式待确认」 so a disguised binary is not painted as a document.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { badgeStyle, readyLabel } from '../src/client/status.ts'

test('sniffed text markdown is AI-readable, not 格式待确认', () => {
  const meta = { sniffed: 'text' as const }
  assert.equal(readyLabel(meta), 'AI 可读取')
  assert.deepEqual(badgeStyle('豆包工作伙伴安全说明书.md', meta.sniffed), { bg: '#757575', ext: 'MD' })
  assert.equal(readyLabel({ ...meta, deduplicated: true }), 'AI 可读取 · 已去重')
  assert.equal(readyLabel({ sniffed: 'text', readHint: { cost: 'expensive' } }), 'AI 可读取 · 大文件')
})

test('confirmed text badges use the filename extension', () => {
  assert.equal(badgeStyle('foo.md', 'text').ext, 'MD')
  assert.equal(badgeStyle('foo.MD', 'text').ext, 'MD')
  assert.equal(badgeStyle('foo.txt', 'text').ext, 'TXT')
  assert.equal(badgeStyle('data.csv', 'text').ext, 'CSV')
  assert.equal(badgeStyle('data.json', 'text').ext, 'JSON')
  assert.equal(badgeStyle('app.log', 'text').ext, 'LOG')
  assert.equal(badgeStyle('config.yml', 'text').ext, 'YML')
  assert.equal(badgeStyle('config.yaml', 'text').ext, 'YAML')
  assert.equal(badgeStyle('notes.toml', 'text').ext, 'TOML')
  assert.equal(badgeStyle('app.ini', 'text').ext, 'INI')
  assert.equal(badgeStyle('src/guide.md', 'text').ext, 'MD')
  assert.equal(badgeStyle('README', 'text').ext, 'TXT')
  assert.equal(badgeStyle('notes.markdown', 'text').ext, 'TXT')
  // 文本被改名为文档扩展名时，不借用 PDF/DOC 徽章。
  assert.deepEqual(badgeStyle('notes.pdf', 'text'), { bg: '#757575', ext: 'TXT' })
  assert.equal(badgeStyle('notes.docx', 'text').ext, 'TXT')
})

test('office and PDF sniffed badges ignore the filename', () => {
  assert.deepEqual(badgeStyle('notes.md', 'pdf'), { bg: '#C93B2E', ext: 'PDF' })
  assert.deepEqual(badgeStyle('notes.txt', 'docx'), { bg: '#2B579A', ext: 'DOC' })
  assert.deepEqual(badgeStyle('notes.txt', 'xlsx'), { bg: '#217346', ext: 'XLS' })
  assert.deepEqual(badgeStyle('notes.txt', 'pptx'), { bg: '#D24726', ext: 'PPT' })
})

test('sniffed null stays 格式待确认 and does not trust a .md name', () => {
  assert.equal(readyLabel({ sniffed: null }), '格式待确认')
  assert.deepEqual(badgeStyle('notes.md', null), { bg: '#5B7DB1', ext: 'FILE' })
  // 旧 host 没返回 sniffedFormat：不显示「格式待确认」，按扩展名回退。
  assert.equal(readyLabel(undefined), '已就绪')
  assert.equal(badgeStyle('notes.md', undefined).ext, 'MD')
  assert.equal(badgeStyle('notes.txt', undefined).ext, 'TXT')
})
