import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clipboardOffsetToDetect, referenceInsertionSpan } from '../src/client/span.ts'

const CHIP = '\uFFFC'

test('an empty draft inserts at detect offset 0', () => {
  assert.deepEqual(
    referenceInsertionSpan({ draft: '', draftRev: 4, occurrences: [] }),
    { start: 0, end: 0, draftRev: 4 },
  )
})

test('plain text is the same length in both projections', () => {
  const draft = '请看附件'
  assert.equal(clipboardOffsetToDetect(draft, [], draft.length), draft.length)
  assert.deepEqual(
    referenceInsertionSpan({ draft, draftRev: 1, occurrences: [] }),
    { start: draft.length, end: draft.length, draftRev: 1 },
  )
})

test('the second file appends after one chip, not at clipboard length', () => {
  const mention = '@.dsh-filess/session-a/report.xlsx'
  // Harness stores the chip as clipboardText and then a separating space.
  const draft = `${mention} `
  const occurrences = [{ offset: 0, length: mention.length }]
  const span = referenceInsertionSpan({ draft, draftRev: 2, occurrences })

  assert.equal(span.start, `${CHIP} `.length)
  assert.equal(span.end, span.start)
  assert.equal(span.draftRev, 2)
  assert.ok(draft.length > span.end)
})

test('each later chip still counts as one detect character', () => {
  const first = '@.dsh-filess/session-a/a.xlsx'
  const second = '@".dsh-filess/session-a/季度 复盘.xlsx"'
  const draft = `${first} ${second} `
  const occurrences = [
    { offset: first.length + 1, length: second.length },
    { offset: 0, length: first.length },
  ]
  const span = referenceInsertionSpan({ draft, draftRev: 8, occurrences })

  assert.equal(span.end, `${CHIP} ${CHIP} `.length)
  // Offset 0 sits on the leading chip, so Harness snaps it to that chip's
  // trailing detect edge rather than the document start.
  assert.equal(clipboardOffsetToDetect(draft, occurrences, 0), 1)
})

test('offsets inside a chip snap to its trailing detect edge', () => {
  const draft = 'see @file tail'
  const chip = { offset: 4, length: 5 }
  assert.equal(clipboardOffsetToDetect(draft, [chip], 3), 3)
  assert.equal(clipboardOffsetToDetect(draft, [chip], 4), 5)
  assert.equal(clipboardOffsetToDetect(draft, [chip], 6), 5)
  assert.equal(clipboardOffsetToDetect(draft, [chip], 9), 5)
  assert.equal(clipboardOffsetToDetect(draft, [chip], draft.length), 'see \uFFFC tail'.length)
})

test('a published detect projection wins over clipboard length', () => {
  const mention = '@.dsh-filess/session-a/report.xlsx'
  const draft = `${mention} `
  const occurrences = [{ offset: 0, length: mention.length }]
  const fromText = referenceInsertionSpan({
    draft,
    draftRev: 1,
    occurrences,
    detectText: `${CHIP} `,
  })
  const fromLength = referenceInsertionSpan({
    draft,
    draftRev: 1,
    occurrences,
    detectText: 'ignored',
    detectLength: 2,
  })

  assert.equal(fromText.end, 2)
  assert.equal(fromLength.end, 2)
})
