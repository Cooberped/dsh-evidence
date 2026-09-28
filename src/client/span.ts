// Harness TokenSpan coordinates are the detect projection: every reference
// chip is one U+FFFC. InputState.draft is the clipboard projection, where
// the same chip expands to its clipboardText (for example `@path` plus the
// separating space Harness appends). selectSpan rejects an end past
// detectLength, so an append measured with draft.length works only while
// the draft is still empty.

/** One chip's range in clipboard-projection coordinates. */
export interface ClipboardChipSpan {
  offset: number
  length: number
}

/** Draft fields needed to place an append in detect coordinates. */
export interface ReferenceDraftSnapshot {
  draft: string
  draftRev: number
  occurrences: readonly ClipboardChipSpan[]
  /** Detect projection when the host publishes it (chip = one U+FFFC). */
  detectText?: string
  /** Detect-projection length. selectSpan rejects offsets past this. */
  detectLength?: number
}

export interface ReferenceTokenSpan {
  start: number
  end: number
  draftRev: number
}

/**
 * Fold one clipboard-projection offset onto detect coordinates.
 * Plain text keeps its length. A chip contributes one detect character, and
 * an offset inside that chip snaps to the chip's trailing detect edge — the
 * same rule as Harness `detectOffsetOfClipboardOffset`.
 */
export function clipboardOffsetToDetect(
  draft: string,
  occurrences: readonly ClipboardChipSpan[],
  clipboardOffset: number,
): number {
  const end = Math.max(0, Math.min(clipboardOffset, draft.length))
  const chips = occurrences
    .filter((chip) => chip.length > 0 && chip.offset >= 0 && chip.offset < draft.length)
    .map((chip) => ({
      offset: chip.offset,
      length: Math.min(chip.length, draft.length - chip.offset),
    }))
    .sort((a, b) => a.offset - b.offset || a.length - b.length)

  let detect = 0
  let cursor = 0
  for (const chip of chips) {
    if (chip.offset < cursor) continue
    const chipEnd = chip.offset + chip.length
    if (end < chip.offset) return detect + (end - cursor)
    detect += chip.offset - cursor
    if (end <= chipEnd) return detect + 1
    detect += 1
    cursor = chipEnd
  }
  return detect + (end - cursor)
}

function publishedDetectLength(state: ReferenceDraftSnapshot): number | null {
  if (typeof state.detectLength === 'number' && Number.isInteger(state.detectLength) && state.detectLength >= 0) {
    return state.detectLength
  }
  if (typeof state.detectText === 'string') return state.detectText.length
  return null
}

/** Collapsed TokenSpan at the end of the detect projection. */
export function referenceInsertionSpan(state: ReferenceDraftSnapshot): ReferenceTokenSpan {
  const at = publishedDetectLength(state)
    ?? clipboardOffsetToDetect(state.draft, state.occurrences, state.draft.length)
  return { start: at, end: at, draftRev: state.draftRev }
}
