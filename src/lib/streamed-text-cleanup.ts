/**
 * Streamed Text Cleanup
 *
 * Single source of truth for post-streaming cleanup of LLM response text.
 * Replaces:
 *   - Bug 1 fix: post-LLM conversational translation that was computed on
 *     the Python side but never delivered to the user (frontend now applies it).
 *   - Bug 3 fix: token-by-token JSON intent filter was fragile in Python;
 *     a robust single-pass cleanup runs here at render time.
 *
 * Transformation pipeline (canonical order):
 *   1. stripIntentJson   — remove leaked intent-classification JSON blocks
 *   2. removeEnglishMixing — English UI vocabulary → Indonesian
 *   3. convertToConversational — formal bureaucratic tone → conversational
 *   4. removeAiPatterns  — strip LLM artefacts like "Selanjutnya," / "Yuk"
 *
 * The first three (English removal → conversational → AI patterns) are a
 * faithful port of `ai-service/orchestrator/content_transformer.py` so that
 * client-side and server-side transformations stay in sync. All substitution
 * regexes use the `i` flag to mirror Python's `flags=re.IGNORECASE`.
 *
 * Re-capitalization note: Python's `remove_ai_patterns` re-capitalizes the
 * first letter of the output if the result is non-empty. We preserve that
 * behavior so the two implementations produce identical output.
 */

/**
 * English → Indonesian word mappings.
 * Mirror of ai-service/orchestrator/content_transformer.py _ENGLISH_TO_INDONESIAN.
 */
const ENGLISH_TO_INDONESIAN: Readonly<Record<string, string>> = {
  button: 'tombol',
  click: 'klik',
  submit: 'kirim',
  cancel: 'batal',
  close: 'tutup',
  open: 'buka',
  save: 'simpan',
  delete: 'hapus',
  edit: 'ubah',
  add: 'tambah',
  remove: 'hapus',
  filter: 'saring',
  search: 'cari',
  upload: 'unggah',
  download: 'unduh',
  next: 'lanjut',
  previous: 'sebelumnya',
  back: 'kembali',
  continue: 'lanjutkan',
  finish: 'selesai',
  start: 'mulai',
  stop: 'berhenti',
  loading: 'memuat',
  error: 'kesalahan',
  success: 'berhasil',
  warning: 'peringatan',
  info: 'informasi',
  marketplace: 'pasar program',
  dashboard: 'beranda',
  profile: 'profil',
  settings: 'pengaturan',
  login: 'masuk',
  logout: 'keluar',
  register: 'daftar',
  account: 'akun',
  password: 'kata sandi',
  email: 'surel',
  username: 'nama pengguna',
  document: 'dokumen',
  file: 'berkas',
  template: 'templat',
  form: 'formulir',
  field: 'kolom',
  required: 'wajib',
  optional: 'opsional',
  pending: 'menunggu',
  approved: 'disetujui',
  rejected: 'ditolak',
  completed: 'selesai',
  processing: 'diproses',
}

/**
 * Formal → conversational phrase mappings (regex → replacement).
 * Mirror of ai-service/orchestrator/content_transformer.py _FORMAL_TO_CONVERSATIONAL.
 * All patterns use the `i` flag to mirror Python's re.IGNORECASE.
 */
const FORMAL_TO_CONVERSATIONAL: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bBapak\/Ibu\b/gi, 'kamu'],
  [/\bSaudara\/i\b/gi, 'kamu'],
  [/\bAnda\b(?!\s+yang)/gi, 'kamu'],
  [/\bSilakan\s+(?:Bapak\/Ibu\s+)?/gi, ''],
  [/\bSilahkan\s+(?:Bapak\/Ibu\s+)?/gi, ''],
  [/\bMohon\s+untuk\s+/gi, 'Tolong '],
  [/\bDiharapkan\s+/gi, ''],
  [/\bDimohon\s+/gi, 'Tolong '],
  [/\bHarap\s+/gi, ''],
  [/\bPerlu\s+diperhatikan\s+bahwa\s+/gi, 'Perhatikan: '],
  [/\bPatut\s+dicatat\s+bahwa\s+/gi, 'Ingat: '],
  [/\bDengan\s+hormat,?\s*/gi, ''],
  [/\bHormat\s+kami,?\s*/gi, ''],
  [/\bTerima\s+kasih\s+atas\s+perhatian\s+(?:Bapak\/Ibu|Anda)\b/gi, 'Terima kasih'],
  [/\bharus\s+diisi\b/gi, 'harus isi'],
  [/\bakan\s+dikirim\b/gi, 'akan kirim'],
  [/\btelah\s+diterima\b/gi, 'sudah terima'],
  [/\bdapat\s+digunakan\b/gi, 'bisa pakai'],
  [/\bsesuai\s+dengan\s+/gi, 'sesuai '],
  [/\bberdasarkan\s+/gi, 'dari '],
  [/\bdalam\s+hal\s+ini\s+/gi, ''],
  [/\bpada\s+saat\s+ini\s+/gi, 'sekarang '],
  [/\bsaat\s+ini\s+/gi, 'sekarang '],
  [/\bpada\s+waktu\s+ini\s+/gi, 'sekarang '],
  [/\byang\s+terhormat\b/gi, ''],
  [/\byang\s+mulia\b/gi, ''],
  [/\bdengan\s+ini\s+/gi, ''],
  [/\bkami\s+informasikan\s+bahwa\s+/gi, ''],
]

/**
 * AI pattern removals (regex → replacement).
 * Mirror of ai-service/orchestrator/content_transformer.py _AI_PATTERNS.
 * All patterns use the `i` flag to mirror Python's re.IGNORECASE.
 */
const AI_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bYuk[,!]?\s+/gi, ''],
  [/\bAyo[,!]?\s+/gi, ''],
  [/\bYuk kita\b/gi, 'Mari kita'],
  [/\bAyo kita\b/gi, 'Mari kita'],
  [/!{2,}/g, '!'],
  [/\bSelanjutnya,\s+/gi, ''],
  [/\bKemudian,\s+/gi, ''],
  [/\bSetelah itu,\s+/gi, ''],
  [/\bLalu,\s+/gi, ''],
  [/\bBerikutnya,\s+/gi, ''],
  [/\bSangat\s+senang\s+/gi, ''],
  [/\bDengan\s+senang\s+hati\s+/gi, ''],
  [/\bSenang\s+sekali\s+/gi, ''],
  [/\bTentu\s+saja[,!]?\s+/gi, ''],
  [/\bPasti[,!]?\s+/gi, ''],
  [/\bDengan\s+pasti\s+/gi, ''],
  [/\bBaik,\s+saya\s+akan\s+/gi, ''],
  [/\bBaik,\s+mari\s+/gi, 'Mari '],
  [/\bOke,\s+/gi, ''],
  [/\bsangat\s+sangat\b/gi, 'sangat'],
  [/\bsekali\s+sekali\b/gi, 'sekali'],
  [/\bMaaf\s+sebelumnya,?\s+/gi, ''],
  [/\bPermisi,?\s+/gi, ''],
  [/\bSekedar\s+informasi,?\s+/gi, ''],
  [/\bPerlu\s+diketahui\s+bahwa\s+/gi, ''],
]

/**
 * Tagged-code-block JSON removers. Applied first because markdown fences
 * give us the cleanest boundaries. Order matters: most specific first.
 */
const INTENT_TAG_PATTERNS: ReadonlyArray<RegExp> = [
  // ```json\n{...}\n``` with multi-line content (allows nested braces by spanning
  // until the closing fence)
  /```json\s*\n[\s\S]*?\n```\s*/gi,
  // ```json{...}``` (single-line, no whitespace)
  /```json\s*[^\n]*```/gi,
  // ```\n{...}\n``` (LLM drops language tag, but content is JSON-shaped)
  /```\s*\n\s*\{\s*"intent_classification"[\s\S]*?\n```\s*/gi,
]

/**
 * Strip leaked intent-classification JSON blocks from LLM output.
 *
 * Robust single-pass replacement of the brittle Python token-by-token
 * state machine (chat.py in `in_json_block` / `brace_count`). Works
 * because it runs on the final accumulated text of each text part, not
 * on individual tokens.
 *
 * Two-phase strategy:
 *   1. Strip tagged code fences (clean boundaries).
 *   2. Strip naked JSON objects with brace-balanced matching that handles
 *      nested { "intent_classification": { ... } } correctly.
 *
 * Phase-3 cleanup is gated on whether any JSON was actually removed so we
 * don't accidentally strip the word "json" from legitimate prose that
 * happens to start with it (e.g. user-facing explanations of JSON).
 */
export function stripIntentJson(text: string): string {
  if (!text || !text.length) return text
  let result = text

  // Phase 1: tagged blocks (```json``` fences)
  for (const pattern of INTENT_TAG_PATTERNS) {
    result = result.replace(pattern, '')
  }

  // Phase 2: naked JSON (multi-line nested OR single-line). Capture
  // length AFTER phase 1 so the "jsonStripped" flag below only flips
  // when naked JSON was actually removed, not when a tagged fence was.
  // The "json\n" preamble pattern is exclusive to naked-JSON output.
  const phase2InputLength = result.length
  result = stripBraceBalancedNakedJson(result)
  const jsonStripped = result.length < phase2InputLength

  // Phase 3: cleanup leftover artifacts so the user-facing output is clean.
  // The "json" preamble strip is conditional on naked JSON having been
  // removed in phase 2, so tagged-fence stripping alone (phase 1) does not
  // trigger this — protecting prose where the assistant wrote the bare
  // word "json" after a ```json``` block was already stripped.
  if (jsonStripped) {
    result = result.replace(/^\s*json(?:\s|\n)+/i, '')
  }
  // Strip leading whitespace left after JSON removal so the next prose
  // paragraph starts cleanly. (Without this we'd emit " Halo, ..." with a
  // leading space or stray newline.)
  result = result.replace(/^\s+/, '')
  // Collapse runs of 3+ newlines left by removals.
  result = result.replace(/\n{3,}/g, '\n\n')
  // Orphan closing braces that may remain after partial stripping.
  result = result.replace(/\}\s*\n{2,}/g, '\n\n')
  result = result.replace(/^\}\s*/g, '')

  return result
}

/**
 * Bracket-balanced removal of naked (un-tagged) intent-classification JSON
 * objects. Walks each `"intent_classification"` occurrence, finds the
 * enclosing `{` and matching `}`, and deletes the whole object while
 * respecting JSON string escaping.
 */
function stripBraceBalancedNakedJson(text: string): string {
  // Conservative three-pass strategy. All replacements use empty string so
  // the result naturally starts/ends at the boundaries of the next prose.
  // Pass A: multi-line JSON where the closing `}` sits at the start of a line.
  //         This is the most common LLM output shape and avoids the lazy-brace bug.
  //         Trailing `\n?` consumes at most one trailing newline so we don't
  //         collapse the visual separator between the JSON block and the prose.
  // Pass B: single-line nested JSON (two levels of `{...}`).
  // Pass C: single-level fallback.
  let result = text
  result = result.replace(
    /\s*\{\s*"intent_classification"\s*:[\s\S]*?\n\}\n?/gi,
    '',
  )
  result = result.replace(
    /\s*\{\s*"intent_classification"\s*:\s*\{[^{}]*\}\s*\}\n?/gi,
    '',
  )
  result = result.replace(
    /\s*\{\s*"intent_classification"\s*:[^{}]*\}\n?/gi,
    '',
  )
  return result
}

/**
 * Replace English words with Indonesian equivalents, preserving
 * capitalization of the first letter.
 */
export function removeEnglishMixing(text: string): string {
  if (!text || !text.trim()) return text
  let result = text
  for (const [english, indonesian] of Object.entries(ENGLISH_TO_INDONESIAN)) {
    const regex = new RegExp(`\\b${english}\\b`, 'gi')
    result = result.replace(regex, (match) =>
      match[0] === match[0].toUpperCase()
        ? indonesian.charAt(0).toUpperCase() + indonesian.slice(1)
        : indonesian,
    )
  }
  return result
}

/**
 * Convert formal bureaucratic language to conversational tone.
 *
 * Important: only horizontal whitespace runs (spaces/tabs) are collapsed.
 * Newlines are preserved so the output retains its markdown structure
 * (tables, headers, ordered/unordered lists, code fences). The original
 * Python implementation used `re.sub(r"\s+", " ")` which collapsed newlines
 * too — the same bug here would have been visible all along, but Bug 1
 * meant the Python-side transform result was never delivered to the
 * frontend. Now that the transform runs at render time, the whitespace
 * collapse destroys markdown. The fix is to skip newlines.
 */
export function convertToConversational(text: string): string {
  if (!text || !text.trim()) return text
  let result = text
  for (const [pattern, replacement] of FORMAL_TO_CONVERSATIONAL) {
    result = result.replace(pattern, replacement)
  }
  // [^\S\n]+ matches runs of horizontal whitespace (spaces, tabs) but
  // explicitly excludes \n. Compare to the buggy /\s+/g which would also
  // collapse \n, breaking markdown tables/lists/headers.
  return result.replace(/[^\S\n]+/g, ' ').trim()
}

/**
 * Strip residual inline `[PROGRAM:id]` and `[ACTION:type]` markers that
 * may have leaked through to the user-facing text. Defense in depth:
 * the Python orchestrator normally catches these on its streaming
 * `text_buffer` (chat.py `program_match` / `action_match`) and emits
 * `inline-program` / `inline-action` events instead of passing the raw
 * marker through as text. But that match runs against accumulated
 * tokens, so partial matches (e.g. when the LLM tokenizer splits the
 * marker across boundaries) can flush the raw text-delta before the
 * full marker is detected. This function cleans up that residue so
 * users never see raw `[PROGRAM:pkh]` strings.
 *
 * Bug 2 fix: marker stripping moved to a single deterministic pass on
 * the final accumulated text, removing a class of edge cases where the
 * Python token-window detector missed an intact marker.
 */
export function stripInlineMarkers(text: string): string {
  if (!text || !text.length) return text
  return text
    .replace(/\[PROGRAM:[a-z0-9\-]+\]/gi, '')
    .replace(/\[ACTION:[a-z0-9\-]+\]/gi, '')
}

/**
 * Strip AI-generated language patterns and re-capitalize the first
 * letter if it became lowercase.
 */
export function removeAiPatterns(text: string): string {
  if (!text || !text.trim()) return text
  let result = text
  for (const [pattern, replacement] of AI_PATTERNS) {
    result = result.replace(pattern, replacement)
  }
  // [^\S\n]+ matches runs of horizontal whitespace but explicitly excludes
  // \n. Preserves markdown structure (tables, headers, lists, code fences).
  // See convertToConversational for the rationale.
  result = result.replace(/[^\S\n]+/g, ' ').trim()
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1)
  }
  return result
}

/**
 * Apply the full tone-transformation pipeline in canonical order:
 * English → conversational → AI pattern removal.
 */
export function transformContent(text: string): string {
  if (!text || !text.trim()) return text
  let result = removeEnglishMixing(text)
  result = convertToConversational(result)
  result = removeAiPatterns(result)
  return result
}

/**
 * Single entry point: strip leaked intent JSON + residual inline
 * markers, then apply tone transformation. Use this everywhere a
 * streamed assistant text part is about to be rendered to the user.
 *
 * Order matters:
 *   1. stripIntentJson    — remove leaked JSON intent blocks
 *   2. stripInlineMarkers  — strip residual `[PROGRAM:id]` / `[ACTION:type]`
 *                             that Python's token-buffer detector missed
 *   3. transformContent    — English → conversational → AI-pattern cleanup
 */
export function cleanupStreamedText(text: string): string {
  if (!text) return text
  let result = stripIntentJson(text)
  result = stripInlineMarkers(result)
  result = transformContent(result)
  return result
}
