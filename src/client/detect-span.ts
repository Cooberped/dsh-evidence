// Clipboard → detect coordinates for Harness `slash/input-insert-reference`.
// InputState.draft expands each chip to its clipboardText. The insert span
// is in detect coordinates, where that same chip is one U+FFFC. Using
// draft.length after the first chip walks past the detect document and
// selectSpan refuses the edit.

/** One chip as published on InputState.occurrences (clipboard coordinates). */
export interface ClipboardChip {
  readonly offset: number
  readonly length: number
}

interface DetectSegment {
  readonly kind: 'text' | 'chip'
  readonly clipboardStart: number
  readonly clipboardLength: number
  readonly detectStart: number
  readonly detectLength: number
}

/**
 * Map a clipboard-projection offset onto detect coordinates.
 * Mirrors Harness `detectOffsetOfClipboardOffset`: an offset inside a chip
 * snaps to that chip's trailing detect edge, and an offset sitting on a
 * segment boundary belongs to the segment that ends there.
 */
export function detectOffsetOfClipboardOffset(
  occurrences: readonly ClipboardChip[],
  clipboardOffset: number,
): number {
  if (!Number.isFinite(clipboardOffset)) return 0
  const target = Math.max(0, clipboardOffset)
  const chips = [...occurrences]
    .filter((chip) => Number.isFinite(chip.offset) && Number.isFinite(chip.length) && chip.offset >= 0 && chip.length >= 0)
    .sort((left, right) => left.offset - right.offset || left.length - right.length)

  const segments: DetectSegment[] = []
  let clipboard = 0
  let detect = 0
  const push = (kind: DetectSegment['kind'], clipboardLength: number, detectLength: number): void => {
    if (kind === 'text' && clipboardLength === 0) return
    segments.push({
      kind,
      clipboardStart: clipboard,
      clipboardLength,
      detectStart: detect,
      detectLength,
    })
    clipboard += clipboardLength
    detect += detectLength
  }

  for (const chip of chips) {
    if (chip.offset < clipboard) continue
    const plain = chip.offset - clipboard
    if (plain > 0) push('text', plain, plain)
    push('chip', chip.length, 1)
    if (clipboard >= target) break
  }
  if (clipboard < target) push('text', target - clipboard, target - clipboard)

  for (const segment of segments) {
    const end = segment.clipboardStart + segment.clipboardLength
    if (target > end) continue
    if (target === end) return segment.detectStart + segment.detectLength
    if (segment.kind === 'chip') return segment.detectStart + segment.detectLength
    return segment.detectStart + (target - segment.clipboardStart)
  }
  return detect
}

/** Draft fields needed to place one appended reference chip. */
export interface ReferenceDraftSnapshot {
  /** Clipboard projection. Chips are expanded to their clipboard text. */
  readonly draft: string
  readonly occurrences: readonly ClipboardChip[]
  /** Detect projection, when a host publishes it. Each chip is one U+FFFC. */
  readonly detectText?: string
  /** Detect-projection length, when a host publishes it. */
  readonly detectLength?: number
}

/**
 * Collapsed caret at the end of the draft, in detect coordinates.
 * A published detect length or detect text wins; otherwise the clipboard
 * draft is folded the same way Harness folds it.
 */
export function referenceInsertionOffset(state: ReferenceDraftSnapshot): number {
  if (typeof state.detectLength === 'number' && Number.isFinite(state.detectLength) && state.detectLength >= 0) {
    return state.detectLength
  }
  if (typeof state.detectText === 'string') return state.detectText.length
  return detectOffsetOfClipboardOffset(state.occurrences, state.draft.length)
}
