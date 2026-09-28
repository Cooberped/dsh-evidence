import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectOffsetOfClipboardOffset, referenceInsertionOffset } from '../src/client/detect-span.ts'

const FIRST = '@.dsh-filess/s1/report.xlsx'
const SECOND = '@.dsh-filess/s1/notes.docx'

test('an empty draft inserts at detect offset 0', () => {
  assert.equal(referenceInsertionOffset({ draft: '', occurrences: [] }), 0)
  assert.equal(detectOffsetOfClipboardOffset([], 0), 0)
})

test('plain text keeps clipboard and detect offsets equal', () => {
  assert.equal(referenceInsertionOffset({ draft: 'hello', occurrences: [] }), 5)
  assert.equal(detectOffsetOfClipboardOffset([], 3), 3)
})

test('the second upload appends after the chip instead of at the expanded @path', () => {
  const draft = `${FIRST} `
  const occurrences = [{ offset: 0, length: FIRST.length }]
  assert.ok(draft.length > 2)
  // detect text is U+FFFC plus the separating space.
  assert.equal(detectOffsetOfClipboardOffset(occurrences, draft.length), 2)
  assert.equal(referenceInsertionOffset({ draft, occurrences }), 2)
})

test('a third upload counts every existing chip as one detect character', () => {
  const draft = `${FIRST} ${SECOND} `
  // Unsorted on purpose: the walk must order chips before folding.
  const occurrences = [
    { offset: FIRST.length + 1, length: SECOND.length },
    { offset: 0, length: FIRST.length },
  ]
  assert.notEqual(occurrences[0].offset, 0)
  assert.equal(draft.length, FIRST.length + 1 + SECOND.length + 1)
  assert.equal(referenceInsertionOffset({ draft, occurrences }), 4)
})

test('an offset inside a chip snaps to that chip trailing detect edge', () => {
  assert.equal(detectOffsetOfClipboardOffset([{ offset: 0, length: FIRST.length }], 4), 1)
})

test('a boundary after preceding text stays on the leading edge of the next chip', () => {
  assert.equal(detectOffsetOfClipboardOffset([{ offset: 2, length: 10 }], 2), 2)
})

test('a zero-length chip still occupies one detect character', () => {
  assert.equal(detectOffsetOfClipboardOffset([{ offset: 0, length: 0 }], 0), 1)
})

test('published detect coordinates win over the clipboard draft', () => {
  const draft = `${FIRST} ${SECOND} `
  const occurrences = [
    { offset: 0, length: FIRST.length },
    { offset: FIRST.length + 1, length: SECOND.length },
  ]
  assert.equal(referenceInsertionOffset({
    draft,
    occurrences,
    detectLength: 4,
  }), 4)
  assert.equal(referenceInsertionOffset({
    draft: 'clipboard text that must not be measured',
    occurrences: [],
    detectText: '\uFFFC \uFFFC ',
  }), 4)
  assert.equal(referenceInsertionOffset({
    draft: 'ab',
    occurrences: [],
    detectLength: Number.NaN,
  }), 2)
  assert.equal(referenceInsertionOffset({
    draft: 'ab',
    occurrences: [],
    detectLength: -1,
    detectText: '\uFFFC',
  }), 1)
})
