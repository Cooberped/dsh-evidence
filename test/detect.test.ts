// Content-sniffing tests: real signatures win, spoofed extensions cannot
// redirect parsing, binary garbage is rejected.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import { sniffFormat, sniffHead, zipMemberNames, zipMembers, formatFromExtension, SUPPORTED_FORMATS } from '../src/detect.ts'
import { decodeText } from '../src/parse/text.ts'

async function makeZip(files: Record<string, string>): Promise<Uint8Array> {
  const zip = new JSZip()
  for (const [name, content] of Object.entries(files)) zip.file(name, content)
  return new Uint8Array(await zip.generateAsync({ type: 'nodebuffer' }))
}

const DOCX_FILES = {
  '[Content_Types].xml': '<Types/>',
  'word/document.xml': '<w:document/>',
  'word/styles.xml': '<w:styles/>'
}

const XLSX_FILES = {
  '[Content_Types].xml': '<Types/>',
  'xl/workbook.xml': '<workbook/>',
  'xl/worksheets/sheet1.xml': '<worksheet/>'
}

const PPTX_FILES = {
  '[Content_Types].xml': '<Types/>',
  'ppt/presentation.xml': '<p:presentation/>',
  'ppt/slides/slide1.xml': '<p:sld/>'
}

test('pdf signature wins over a spoofed .docx hint', async () => {
  const bytes = new TextEncoder().encode('%PDF-1.7\n1 0 obj\n%%EOF')
  assert.equal(sniffFormat(bytes, 'docx'), 'pdf')
})

test('zip with word/ members is docx', async () => {
  const bytes = await makeZip(DOCX_FILES)
  assert.equal(sniffFormat(bytes), 'docx')
})

test('zip with xl/ members is xlsx', async () => {
  const bytes = await makeZip(XLSX_FILES)
  assert.equal(sniffFormat(bytes), 'xlsx')
})

test('zip with ppt/ members is pptx', async () => {
  const bytes = await makeZip(PPTX_FILES)
  assert.equal(sniffFormat(bytes), 'pptx')
})

test('zip with neither word/ nor xl/ members is rejected', async () => {
  const bytes = await makeZip({ 'random.txt': 'hello' })
  assert.equal(sniffFormat(bytes), null)
})

test('a .pdf extension cannot make an executable parse as pdf', async () => {
  // MZ header with valid UTF-8-ish text after it: no signature, hint says pdf
  const bytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, ...new TextEncoder().encode('This program cannot be run in DOS mode')])
  assert.equal(sniffFormat(bytes, 'pdf'), null)
})

test('utf-8 text is detected', () => {
  const bytes = new TextEncoder().encode('hello 世界\nsecond line')
  assert.equal(sniffFormat(bytes), 'text')
})

test('utf-16le with BOM is detected as text', () => {
  const bytes = new Uint8Array([0xff, 0xfe, 0x68, 0x00, 0x69, 0x00])
  assert.equal(sniffFormat(bytes), 'text')
})

test('utf-16be with BOM is detected as text', () => {
  const bytes = new Uint8Array([0xfe, 0xff, 0x00, 0x68, 0x00, 0x69])
  assert.equal(sniffFormat(bytes), 'text')
})

test('binary with NUL bytes is rejected', () => {
  const bytes = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0xff, 0xfe])
  assert.equal(sniffFormat(bytes), null)
})

test('empty input is a valid empty text document', () => {
  // 空文件是合法空文本：read_document 应能读（返回 0 行），而不是报
  // "unrecognized file content"。短纯 ASCII 同理。
  assert.equal(sniffFormat(new Uint8Array(0)), 'text')
  assert.equal(sniffFormat(new Uint8Array([0x25, 0x50])), 'text')
})

test('hint is honored only when bytes are ambiguous', () => {
  const bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07])
  assert.equal(sniffFormat(bytes, 'text'), 'text')
})

test('zipMemberNames returns member list and rejects truncated archives', async () => {
  const bytes = await makeZip(DOCX_FILES)
  const names = zipMemberNames(bytes)
  assert.ok(names !== null)
  assert.ok(names.includes('word/document.xml'))
  assert.equal(zipMemberNames(new Uint8Array([0x50, 0x4b, 0x03, 0x04])), null)
})

test('zipMembers exposes bounded central-directory size metadata', async () => {
  const bytes = await makeZip({ 'xl/workbook.xml': '<workbook/>' })
  const members = zipMembers(bytes)
  assert.ok(members !== null)
  const workbook = members.find((member) => member.name === 'xl/workbook.xml')
  assert.ok(workbook !== undefined)
  assert.equal(workbook.nameBytes, 'xl/workbook.xml'.length)
  assert.equal(workbook.originalSize, new TextEncoder().encode('<workbook/>').length)
  assert.ok(workbook.compressedSize > 0)
})

test('zipMembers rejects declared member counts above the metadata bound', async () => {
  const bytes = Uint8Array.from(await makeZip({ 'xl/workbook.xml': '<workbook/>' }))
  let eocd = -1
  for (let offset = bytes.length - 22; offset >= 0; offset -= 1) {
    if (bytes[offset] === 0x50 && bytes[offset + 1] === 0x4b && bytes[offset + 2] === 0x05 && bytes[offset + 3] === 0x06) {
      eocd = offset
      break
    }
  }
  assert.ok(eocd >= 0)
  for (const offset of [eocd + 8, eocd + 10]) {
    bytes[offset] = 0x01
    bytes[offset + 1] = 0x10 // 4097, one above the supported bound.
  }
  assert.equal(zipMembers(bytes), null)
})

test('formatFromExtension covers the supported set', () => {
  assert.equal(formatFromExtension('report.pdf'), 'pdf')
  assert.equal(formatFromExtension('a.DOCX'), 'docx')
  assert.equal(formatFromExtension('data.xlsx'), 'xlsx')
  assert.equal(formatFromExtension('slides.PPTX'), 'pptx')
  assert.equal(formatFromExtension('notes.md'), 'text')
  assert.equal(formatFromExtension('noextension'), null)
  assert.equal(formatFromExtension('evil.exe'), null)
})

test('SUPPORTED_FORMATS matches the enum union', () => {
  assert.deepEqual([...SUPPORTED_FORMATS].sort(), ['docx', 'pdf', 'pptx', 'text', 'xlsx'])
})

test('utf-16 without BOM is detected as text', () => {
  // 'hi' UTF-16LE 无 BOM：68 00 69 00
  const le = new Uint8Array([0x68, 0x00, 0x69, 0x00])
  assert.equal(sniffFormat(le), 'text')
  // UTF-16BE 无 BOM：00 68 00 69
  const be = new Uint8Array([0x00, 0x68, 0x00, 0x69])
  assert.equal(sniffFormat(be), 'text')
})

/** Repeat a Chinese markdown unit past the 8192-byte sniff window. */
function chineseMarkdown(minBytes: number): Uint8Array {
  const unit = '# 豆包工作伙伴安全说明书\n\n本文说明工作伙伴在处理企业文档时的安全边界，不得外传劳动合同与个人信息。\n'
  let text = ''
  const encode = new TextEncoder()
  while (encode.encode(text).length < minBytes) text += unit
  return encode.encode(text)
}

test('markdown longer than the sniff window stays text at every alignment', () => {
  // 中文 UTF-8 是 3 字节。8192 窗口经常切在字符中间；只检查窗口会把
  // 合法 .md 判成 null，上传卡片因此显示「格式待确认」。
  const body = chineseMarkdown(20_000)
  assert.ok(body.length > 8192)
  for (let pad = 0; pad < 6; pad++) {
    const bytes = new Uint8Array(pad + body.length)
    bytes.fill(0x61, 0, pad)
    bytes.set(body, pad)
    assert.equal(sniffFormat(bytes), 'text', `pad ${pad}`)
    assert.equal(sniffHead(bytes), 'text', `head pad ${pad}`)
  }
  const bom = new Uint8Array(3 + body.length)
  bom[0] = 0xef
  bom[1] = 0xbb
  bom[2] = 0xbf
  bom.set(body, 3)
  assert.equal(sniffFormat(bom), 'text')
  assert.equal(decodeText(bom)?.includes('豆包工作伙伴安全说明书'), true)
})

test('gb18030 text longer than the sniff window stays text when a character is split', () => {
  // 「中」的 GBK 编码是 D6 D0。奇数偏移会让 8192 窗口停在双字节中间。
  const pairs = 5000
  for (const lead of [0, 1]) {
    const bytes = new Uint8Array(lead + pairs * 2)
    bytes.fill(0x61, 0, lead)
    for (let i = 0; i < pairs; i++) {
      const offset = lead + i * 2
      bytes[offset] = 0xd6
      bytes[offset + 1] = 0xd0
    }
    assert.equal(sniffFormat(bytes), 'text', `lead ${lead}`)
    assert.equal(sniffHead(bytes), 'text', `head lead ${lead}`)
  }
})

test('a sniff window does not turn trailing binary into text', () => {
  const bytes = new Uint8Array(9000)
  bytes.fill(0xff)
  assert.equal(sniffFormat(bytes), null)
  assert.equal(sniffHead(bytes), null)
  // 文件本身在 UTF-8 字符中途结束，不能靠“窗口之后还有字节”这条规则放行。
  const truncated = new Uint8Array([0xe4, 0xbd])
  assert.equal(sniffFormat(truncated), null)
})
