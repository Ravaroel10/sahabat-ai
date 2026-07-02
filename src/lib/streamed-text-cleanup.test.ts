import {
  cleanupStreamedText,
  convertToConversational,
  removeAiPatterns,
  removeEnglishMixing,
  stripInlineMarkers,
  stripIntentJson,
  transformContent,
} from './streamed-text-cleanup'

describe('stripIntentJson', () => {
  it('returns empty input unchanged', () => {
    expect(stripIntentJson('')).toBe('')
    expect(stripIntentJson(null as unknown as string)).toBeNull()
    expect(stripIntentJson(undefined as unknown as string)).toBeUndefined()
  })

  it('removes ```json\\n{...}\\n``` blocks at start', () => {
    const input =
      '```json\n{\n  "intent_classification": {\n    "primary_intent": "question"\n  }\n}\n```\nHalo, apa itu PKH?'
    // The closing fence + trailing newline pattern strips the boundary
    // whitespace too, so the prose starts cleanly without an extra
    // leading newline.
    expect(stripIntentJson(input)).toBe('Halo, apa itu PKH?')
  })

  it('removes ```json{...}``` inline without newlines', () => {
    const input = '```json{"intent_classification": {"primary_intent": "question"}}```Mulai cerita'
    expect(stripIntentJson(input)).toBe('Mulai cerita')
  })

  it('removes ```\\n{...}\\n``` when LLM drops the language tag', () => {
    const input =
      '```\n{\n  "intent_classification": {\n    "primary_intent": "application"\n  }\n}\n```\nSilakan cek program PKH'
    expect(stripIntentJson(input)).toBe('Silakan cek program PKH')
  })

  it('removes multi-line nested naked JSON with intent_classification', () => {
    const input =
      '{\n  "intent_classification": {\n    "primary_intent": "application",\n    "confidence": 0.9\n  }\n}\n\nBerikut ringkasan program PKH untuk Anda.'
    expect(stripIntentJson(input)).toBe('Berikut ringkasan program PKH untuk Anda.')
  })

  it('removes json keyword + naked JSON preamble', () => {
    const input =
      'json\n{\n  "intent_classification": { "primary_intent": "question" }\n}\n\nHalo user'
    expect(stripIntentJson(input)).toBe('Halo user')
  })

  it('removes single-line naked JSON object at start', () => {
    const input =
      '{"intent_classification": {"primary_intent": "document_request"}}\nBuatkan saya SKTM'
    expect(stripIntentJson(input)).toBe('Buatkan saya SKTM')
  })

  it('removes JSON in the middle of the response', () => {
    const input =
      'Halo, berikut ringkasan:\n```json\n{"intent_classification": {"primary_intent":"question"}}\n```\nlalu lanjut pembahasan'
    expect(stripIntentJson(input)).toBe(
      'Halo, berikut ringkasan:\nlalu lanjut pembahasan',
    )
  })

  it('does not touch prose that contains the substring "intent_classification"', () => {
    const input = 'Istilah intent_classification kadang muncul di dokumen teknis'
    expect(stripIntentJson(input)).toBe(input)
  })

  it('handles multiple blocks (rare retry pattern)', () => {
    const input =
      '```json\n{"a":1}\n```\nTeks pertama\n```json\n{"b":2}\n```\nTeks kedua'
    expect(stripIntentJson(input)).toBe(
      'Teks pertama\nTeks kedua',
    )
  })

  it('does NOT strip the word "json" from legitimate prose', () => {
    // Conditional stripping: the "json" preamble cleanup only fires
    // when a JSON block was actually removed in this call. This protects
    // prose where the assistant writes the bare word "json" as part of
    // a sentence without a JSON object following.
    expect(stripIntentJson('json adalah format pertukaran data')).toBe(
      'json adalah format pertukaran data',
    )
  })

  it('does NOT strip "json" prose that follows a stripped ```json``` fenced block', () => {
    // Regression for the conditional-check capture position: when a
    // ```json``` fence (phase 1) was stripped but no naked JSON (phase 2)
    // was involved, the prose containing the word "json" must survive.
    const input =
      '```json\n{"intent_classification": {"primary_intent": "question"}}\n```\nPenting: json adalah format pertukaran data.'
    expect(stripIntentJson(input)).toBe(
      'Penting: json adalah format pertukaran data.',
    )
  })

  it('handles empty-prose-after-fence degenerate case', () => {
    // When the ```json``` fence is the entire response (no body text),
    // phase 1 strips everything and phase 2 has nothing to do. Condi-
    // tional "json" strip must not throw or produce junk — final result
    // should be empty string. Locks in that the conditional cleanup
    // doesn't accidentally fire when only phase 1 reduced length.
    expect(stripIntentJson('```json\n{}\n```')).toBe('')
  })
})

describe('stripInlineMarkers', () => {
  it('returns empty input unchanged', () => {
    expect(stripInlineMarkers('')).toBe('')
    expect(stripInlineMarkers(null as unknown as string)).toBeNull()
    expect(stripInlineMarkers(undefined as unknown as string)).toBeUndefined()
  })

  it('strips a single [PROGRAM:id] marker on its own line', () => {
    const input = 'Halo\n\n[PROGRAM:pkh]\n\nBerikut info program'
    expect(stripInlineMarkers(input)).toBe('Halo\n\n\n\nBerikut info program')
  })

  it('strips a single [ACTION:type] marker', () => {
    const input = 'Klik tombol di atas\n\n[ACTION:auto-birokrasi]\n\nUntuk lanjut'
    expect(stripInlineMarkers(input)).toBe('Klik tombol di atas\n\n\n\nUntuk lanjut')
  })

  it('strips a marker inline within prose (preserves surrounding spaces)', () => {
    const input = 'Saya rekomendasikan [PROGRAM:pkh] untuk Anda'
    expect(stripInlineMarkers(input)).toBe('Saya rekomendasikan  untuk Anda')
  })

  it('strips multiple markers of both types', () => {
    const input =
      'Berikut programnya:\n\n[PROGRAM:bpnt]\n\n[PROGRAM:kip]\n\n[ACTION:marketplace]\n\n[ACTION:emergency]'
    expect(stripInlineMarkers(input)).toBe(
      'Berikut programnya:\n\n\n\n\n\n\n\n',
    )
  })

  it('is case-insensitive (matches Python re.IGNORECASE)', () => {
    expect(stripInlineMarkers('[program:PKH]')).toBe('')
    expect(stripInlineMarkers('[Action:AUTO-BIROKRASI]')).toBe('')
  })

  it('accepts programs/actions with hyphens in the id (e.g. blt-dana-desa)', () => {
    expect(stripInlineMarkers('[PROGRAM:blt-dana-desa]')).toBe('')
    expect(stripInlineMarkers('[ACTION:auto-birokrasi]')).toBe('')
  })

  it('does not strip prose that merely mentions the marker syntax in brackets', () => {
    // The regex is intentionally specific: only `[PROGRAM:id]` and
    // `[ACTION:type]` with the canonical id charset are stripped. A
    // user's quoted `[PROGRAM:foo bar]` with a space inside is not a
    // valid marker and must survive.
    expect(stripInlineMarkers('Saya menulis [PROGRAM:foo bar] sebagai contoh')).toBe(
      'Saya menulis [PROGRAM:foo bar] sebagai contoh',
    )
    // Different bracket-wrapped syntactic tokens that share the prefix
    // shape but aren't markers also survive.
    expect(stripInlineMarkers('lihat juga [PROGRAM] tanpa titik dua')).toBe(
      'lihat juga [PROGRAM] tanpa titik dua',
    )
  })
})

describe('removeEnglishMixing', () => {
  it('replaces exact English words', () => {
    expect(removeEnglishMixing('Click tombol untuk submit')).toBe('Klik tombol untuk kirim')
  })

  it('preserves capitalization', () => {
    expect(removeEnglishMixing('Click the button to Save')).toBe('Klik the tombol to Simpan')
  })

  it('preserves the original word if it is not in the dictionary', () => {
    expect(removeEnglishMixing('Halo, how are you?')).toBe('Halo, how are you?')
  })

  it('does not translate Indonesian-suffixed compound words like "dashboardnya"', () => {
    // \bdashboard\b requires word boundary; "dashboardnya" has no boundary
    // before "nya", so the suffix-attached form stays unchanged.
    expect(removeEnglishMixing('dashboardnya bagus')).toBe('dashboardnya bagus')
  })

  it('returns empty input unchanged', () => {
    expect(removeEnglishMixing('')).toBe('')
    expect(removeEnglishMixing('   ')).toBe('   ')
  })

  it('translates the standalone English form', () => {
    expect(removeEnglishMixing('dashboard bagus')).toBe('beranda bagus')
  })
})

describe('convertToConversational', () => {
  it('replaces Bapak/Ibu with kamu', () => {
    expect(convertToConversational('Bapak/Ibu dapat bantuan')).toBe('kamu dapat bantuan')
  })

  it('replaces Anda with kamu but preserves "Anda yang"', () => {
    expect(convertToConversational('Anda perlu cek, Anda yang bertanggung jawab')).toBe(
      'kamu perlu cek, Anda yang bertanggung jawab',
    )
  })

  it('drops formal lead-ins like "Dengan hormat,"', () => {
    expect(convertToConversational('Dengan hormat, saya lampirkan dokumen')).toBe(
      'saya lampirkan dokumen',
    )
  })

  it('is case-insensitive (matches Python re.IGNORECASE)', () => {
    expect(convertToConversational('bapak/ibu mendapat bantuan')).toBe('kamu mendapat bantuan')
  })

  it('collapses multiple whitespace after removal', () => {
    expect(convertToConversational('Harap   perhatikan   itu')).toBe('perhatikan itu')
  })
})

describe('removeAiPatterns', () => {
  it('strips "Selanjutnya," and re-capitalizes the first letter', () => {
    // Python behavior: strip pattern fires, then result.charAt(0).upper().
    expect(removeAiPatterns('Selanjutnya, kami jelaskan')).toBe('Kami jelaskan')
  })

  it('is case-insensitive (matches Python re.IGNORECASE)', () => {
    // "selanjutnya," lowercase matches the pattern with `i` flag,
    // strips it, then re-capitalizes first letter of remaining text.
    expect(removeAiPatterns('selanjutnya, langkahnya')).toBe('Langkahnya')
  })

  it('replaces "Yuk kita" with "Mari kita" only when no preceding occurrence consumed it first', () => {
    // "Yuk[,!]?\s+" strips "Yuk " before "Yuk kita" pattern can match.
    // This matches Python's actual behavior.
    expect(removeAiPatterns('Yuk kita mulai')).toBe('Kita mulai')
  })

  it('handles uppercase input by stripping the case-insensitive pattern only', () => {
    // "YUK " matches \bYuk[,!]?\s+ case-insensitively and is stripped.
    // Subsequent tokens stay uppercase because the function never lowercases
    // anything; it only re-capitalizes the first letter of the result.
    expect(removeAiPatterns('YUK KITA MULAI')).toBe('KITA MULAI')
  })

  it('collapses exclamation marks', () => {
    expect(removeAiPatterns('Mantap!!!')).toBe('Mantap!')
  })

  it('returns empty input unchanged', () => {
    expect(removeAiPatterns('')).toBe('')
    expect(removeAiPatterns('   ')).toBe('   ')
  })
})

describe('transformContent', () => {
  it('applies all three phases in order and re-capitalizes the first letter', () => {
    // Pipeline: removeEnglishMixing → convertToConversational → removeAiPatterns.
    // "Bapak/Ibu" → "kamu", "click"→"klik", "submit"→"kirim".
    // No AI patterns to strip. Final result is then re-capitalized.
    const input = 'Bapak/Ibu dapat click tombol untuk submit'
    expect(transformContent(input)).toBe('Kamu dapat klik tombol untuk kirim')
  })

  it('returns empty input unchanged', () => {
    expect(transformContent('')).toBe('')
    expect(transformContent('   ')).toBe('   ')
  })
})

describe('cleanupStreamedText', () => {
  it('combines strip and transform in the documented order with re-capitalization', () => {
    const input =
      '```json\n{"intent_classification": {"primary_intent":"question"}}\n```\nSelanjutnya, Bapak/Ibu dapat click tombol.'
    // Strip JSON → "Selanjutnya, Bapak/Ibu dapat click tombol."
    // Transform: "Selanjutnya," stripped, "Bapak/Ibu"→"kamu", "click"→"klik"
    // Re-capitalize first letter → "Kamu..."
    expect(cleanupStreamedText(input)).toBe('Kamu dapat klik tombol.')
  })

  it('handles the most common LLM leak pattern', () => {
    const input =
      '{\n  "intent_classification": {\n    "primary_intent": "application",\n    "confidence": 0.9\n  }\n}\n\nBerikut ringkasan program PKH untuk Anda.'
    expect(cleanupStreamedText(input)).toBe('Berikut ringkasan program PKH untuk kamu.')
  })

  it('handles JSON at end of text', () => {
    const input = 'Jawaban lengkap di atas.\n```json\n{"intent_classification":{}}\n```'
    expect(cleanupStreamedText(input)).toBe('Jawaban lengkap di atas.')
  })

  it('is a no-op for clean prose', () => {
    const input = 'Halo, apa itu PKH?'
    expect(cleanupStreamedText(input)).toBe('Halo, apa itu PKH?')
  })

  it('returns empty input unchanged', () => {
    expect(cleanupStreamedText('')).toBe('')
  })

  it('strips residual [PROGRAM:id] markers leaked through the stream', () => {
    // Bug 2 regression: when Python's token-buffer marker detection
    // misses a marker split across token boundaries, the marker leaks
    // through as raw text-delta. The frontend cleanup must strip it
    // so the user never sees `[PROGRAM:pkh]` in their chat.
    // Note: `transformContent` (last step) collapses whitespace runs to
    // a single space, so the marker removal's accidental double-space
    // is collapsed back to a single space.
    const input = 'Saya rekomendasikan [PROGRAM:pkh] untuk Anda'
    expect(cleanupStreamedText(input)).toBe('Saya rekomendasikan untuk kamu')
  })

  it('strips residual [ACTION:type] markers leaked through the stream', () => {
    // Transform pipeline collapses the marker removal's double-space.
    const input = 'Klik tombol [ACTION:auto-birokrasi] untuk lanjut'
    expect(cleanupStreamedText(input)).toBe('Klik tombol untuk lanjut')
  })
})
