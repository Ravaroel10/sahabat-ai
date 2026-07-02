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

  it('preserves newlines (does not collapse \\n into a space) — markdown regression', () => {
    // Regression: convertToConversational previously used /\s+/g which
    // collapsed ALL whitespace including \n, destroying markdown structure
    // (tables, headers, lists). The fix uses [^\S\n]+ which preserves
    // newlines while still collapsing horizontal whitespace runs.
    const input = 'Bapak/Ibu dapat\nbantuan untuk\nkeluarga'
    expect(convertToConversational(input)).toBe(
      'kamu dapat\nbantuan untuk\nkeluarga',
    )
  })

  it('preserves markdown table structure (regression)', () => {
    // The user-facing bug: LLM emitted a markdown table, cleanup mangled
    // newlines, and the rendered UI showed raw `| col | col |` text.
    // This test locks in the fix: newlines between rows are preserved.
    //
    // Note: the cleanup also collapses horizontal whitespace runs (e.g.,
    // table cell padding `| PKH     |` -> `| PKH |`). This is acceptable
    // because markdown renderers (react-markdown + remark-gfm) parse
    // tables by pipe/dash structure, not by visual alignment.
    const input = [
      '| Program | Aturan |',
      '|---------|--------|',
      '| PKH     | Per X  |',
      '| BPNT    | Per Y  |',
    ].join('\n')
    const result = convertToConversational(input)
    // Critical: newlines are preserved.
    expect(result.split('\n')).toHaveLength(4)
    // Critical: the table structure (pipes, dashes, content) is intact.
    expect(result).toContain('| Program | Aturan |')
    expect(result).toContain('|---------|--------|')
    expect(result).toMatch(/\| PKH .*Per X .*\|/)
    expect(result).toMatch(/\| BPNT .*Per Y .*\|/)
    // And the collapsed-newline bug is gone.
    expect(result).not.toMatch(/Aturan \|-/)
  })

  it('preserves markdown headers + paragraphs (regression)', () => {
    const input = '### Header\n\nParagraph satu.\n\n- Item A\n- Item B'
    expect(convertToConversational(input)).toBe(input)
  })

  it('still collapses horizontal whitespace runs while preserving newlines', () => {
    // Locks in the "horizontal only" behavior: multiple spaces on a
    // single line collapse, but \n between lines is preserved.
    expect(convertToConversational('Bapak/Ibu   lihat   ini')).toBe(
      'kamu lihat ini',
    )
    // The leading space after \n is internal whitespace — trim() only
    // touches string start/end, not internal whitespace. So 'kamu lihat
    // \n   ini  ' becomes 'kamu lihat\n ini' (note: leading ' ini', not
    // 'ini'). This is the correct "collapse runs to one space, preserve
    // newlines" behavior.
    expect(
      convertToConversational('Bapak/Ibu   lihat\n   ini  '),
    ).toBe('kamu lihat\n ini')
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

  it('preserves newlines (does not collapse \\n into a space) — markdown regression', () => {
    // Regression: same bug as convertToConversational. Lock in that
    // removeAiPatterns no longer flattens multi-line content.
    const input = 'Selanjutnya,\nlangkah berikutnya\nadalah verifikasi'
    expect(removeAiPatterns(input)).toBe('Langkah berikutnya\nadalah verifikasi')
  })

  it('preserves markdown table structure (regression)', () => {
    // Same caveat as the convertToConversational table test: cell padding
    // is collapsed but the table structure (pipes, dashes, newlines) is
    // preserved, which is all react-markdown needs to render correctly.
    const input = [
      '| Program | Aturan |',
      '|---------|--------|',
      '| PKH     | Per X  |',
    ].join('\n')
    const result = removeAiPatterns(input)
    expect(result.split('\n')).toHaveLength(3)
    expect(result).toContain('| Program | Aturan |')
    expect(result).toContain('|---------|--------|')
    expect(result).toMatch(/\| PKH .*Per X .*\|/)
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

  it('preserves markdown table through the full cleanup pipeline (regression)', () => {
    // The actual user-facing bug: LLM emitted a markdown table in its
    // response, the proxy streamed it as text-delta, cleanup mangled
    // newlines, and the rendered UI showed raw `| col | col |` text.
    // This test reproduces the input the user reported and confirms the
    // table now survives the full pipeline.
    //
    // Same caveat as the unit tests: cell padding is collapsed but the
    // table structure (pipes, dashes, newlines, cell content) is intact.
    const input = [
      '### 📋 Dasar Hukum & Kriteria',
      '',
      '| Program | Aturan |',
      '|---------|--------|',
      '| PKH     | Per X  |',
      '| BPNT    | Per Y  |',
    ].join('\n')
    const result = cleanupStreamedText(input)
    // Critical: newlines are preserved (6 lines: header, blank, table).
    expect(result.split('\n')).toHaveLength(6)
    // Critical: header + table structure is intact.
    expect(result).toContain('### 📋 Dasar Hukum & Kriteria')
    expect(result).toContain('| Program | Aturan |')
    expect(result).toContain('|---------|--------|')
    expect(result).toMatch(/\| PKH .*Per X .*\|/)
    expect(result).toMatch(/\| BPNT .*Per Y .*\|/)
    // And the collapsed-newline bug is gone.
    expect(result).not.toMatch(/Aturan \|-/)
  })

  it('preserves headers + ordered/unordered lists through the full pipeline', () => {
    const input = [
      '### Header',
      '',
      'Paragraph satu.',
      '',
      '1. Langkah satu',
      '2. Langkah dua',
      '',
      '- Bullet A',
      '- Bullet B',
    ].join('\n')
    const result = cleanupStreamedText(input)
    expect(result).toContain('### Header')
    expect(result).toContain('1. Langkah satu')
    expect(result).toContain('2. Langkah dua')
    expect(result).toContain('- Bullet A')
    expect(result).toContain('- Bullet B')
  })
})
