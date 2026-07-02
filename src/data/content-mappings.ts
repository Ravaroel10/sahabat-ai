/**
 * Content Mappings for Indonesian Localization
 * 
 * This file contains mappings used by the content transformation system
 * to convert English-mixed and formal bureaucratic text to natural,
 * conversational Indonesian language.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

/**
 * English to Indonesian word mappings
 * 
 * Maps common English terms to their Indonesian equivalents.
 * Preserves technical terms and official program names that should not be translated.
 */
export const ENGLISH_TO_INDONESIAN: Record<string, string> = {
  // UI terms
  'button': 'tombol',
  'click': 'klik',
  'submit': 'kirim',
  'cancel': 'batal',
  'close': 'tutup',
  'open': 'buka',
  'save': 'simpan',
  'delete': 'hapus',
  'edit': 'ubah',
  'add': 'tambah',
  'remove': 'hapus',
  'filter': 'saring',
  'search': 'cari',
  'upload': 'unggah',
  'download': 'unduh',
  'next': 'lanjut',
  'previous': 'sebelumnya',
  'back': 'kembali',
  'continue': 'lanjutkan',
  'finish': 'selesai',
  'start': 'mulai',
  'stop': 'berhenti',
  'loading': 'memuat',
  'error': 'kesalahan',
  'success': 'berhasil',
  'warning': 'peringatan',
  'info': 'informasi',
  
  // App terms
  'marketplace': 'pasar program',
  'dashboard': 'beranda',
  'profile': 'profil',
  'settings': 'pengaturan',
  'login': 'masuk',
  'logout': 'keluar',
  'register': 'daftar',
  'account': 'akun',
  'password': 'kata sandi',
  'email': 'surel',
  'username': 'nama pengguna',
  'name': 'nama',
  'address': 'alamat',
  'phone': 'telepon',
  'message': 'pesan',
  'notification': 'notifikasi',
  'help': 'bantuan',
  'guide': 'panduan',
  'tutorial': 'tutorial',
  'faq': 'tanya jawab',
  'support': 'dukungan',
  'contact': 'kontak',
  'about': 'tentang',
  'privacy': 'privasi',
  'terms': 'ketentuan',
  
  // Document terms
  'document': 'dokumen',
  'file': 'berkas',
  'template': 'templat',
  'form': 'formulir',
  'field': 'kolom',
  'required': 'wajib',
  'optional': 'opsional',
  
  // Status terms
  'pending': 'menunggu',
  'approved': 'disetujui',
  'rejected': 'ditolak',
  'completed': 'selesai',
  'processing': 'diproses',
};

/**
 * Formal to conversational phrase mappings
 * 
 * Maps formal bureaucratic expressions to natural, peer-to-peer Indonesian.
 * Uses regex patterns for flexible matching.
 */
export const FORMAL_TO_CONVERSATIONAL: Array<[RegExp, string]> = [
  // Formal pronouns and address
  [/\bBapak\/Ibu\b/gi, 'kamu'],
  [/\bSaudara\/i\b/gi, 'kamu'],
  [/\bAnda\b(?!\s+yang)/gi, 'kamu'], // Preserve "Anda yang" patterns
  
  // Formal requests
  [/\bSilakan\s+(?:Bapak\/Ibu\s+)?/gi, ''],
  [/\bSilahkan\s+(?:Bapak\/Ibu\s+)?/gi, ''],
  [/\bMohon\s+untuk\s+/gi, 'Tolong '],
  [/\bDiharapkan\s+/gi, ''],
  [/\bDimohon\s+/gi, 'Tolong '],
  
  // Formal instructions
  [/\bHarap\s+/gi, ''],
  [/\bPerlu\s+diperhatikan\s+bahwa\s+/gi, 'Perhatikan: '],
  [/\bPatut\s+dicatat\s+bahwa\s+/gi, 'Ingat: '],
  
  // Formal salutations (remove)
  [/\bDengan\s+hormat,?\s*/gi, ''],
  [/\bHormat\s+kami,?\s*/gi, ''],
  [/\bTerima\s+kasih\s+atas\s+perhatian\s+(?:Bapak\/Ibu|Anda)\b/gi, 'Terima kasih'],
  
  // Passive to active voice
  [/\bharus\s+diisi\b/gi, 'harus isi'],
  [/\bakan\s+dikirim\b/gi, 'akan kirim'],
  [/\btelah\s+diterima\b/gi, 'sudah terima'],
  [/\bdapat\s+digunakan\b/gi, 'bisa pakai'],
  
  // Bureaucratic expressions
  [/\bsesuai\s+dengan\s+/gi, 'sesuai '],
  [/\bberdasarkan\s+/gi, 'dari '],
  [/\bdalam\s+hal\s+ini\s+/gi, ''],
  [/\bpada\s+saat\s+ini\s+/gi, 'sekarang '],
  [/\bsaat\s+ini\s+/gi, 'sekarang '],
  [/\bpada\s+waktu\s+ini\s+/gi, 'sekarang '],
  
  // Redundant formality
  [/\byang\s+terhormat\b/gi, ''],
  [/\byang\s+mulia\b/gi, ''],
  [/\bdengan\s+ini\s+/gi, ''],
  [/\bkami\s+informasikan\s+bahwa\s+/gi, ''],
];

/**
 * AI-generated language patterns to remove
 * 
 * Identifies and removes overly enthusiastic markers, robotic transitions,
 * and unnatural phrasings common in AI-generated Indonesian text.
 */
export const AI_PATTERNS_TO_REMOVE: Array<[RegExp, string]> = [
  // Overly enthusiastic markers
  [/\bYuk[,!]?\s+/gi, ''],
  [/\bAyo[,!]?\s+/gi, ''],
  [/\bYuk kita\b/gi, 'Mari kita'],
  [/\bAyo kita\b/gi, 'Mari kita'],
  
  // Multiple exclamation marks (reduce to single)
  [/!{2,}/g, '!'],
  
  // Robotic transitions
  [/\bSelanjutnya,\s+/gi, ''],
  [/\bKemudian,\s+/gi, ''],
  [/\bSetelah itu,\s+/gi, ''],
  [/\bLalu,\s+/gi, ''],
  [/\bBerikutnya,\s+/gi, ''],
  
  // Redundant enthusiasm
  [/\bSangat\s+senang\s+/gi, ''],
  [/\bDengan\s+senang\s+hati\s+/gi, ''],
  [/\bSenang\s+sekali\s+/gi, ''],
  
  // Unnatural AI politeness
  [/\bTentu\s+saja[,!]?\s+/gi, ''],
  [/\bPasti[,!]?\s+/gi, ''],
  [/\bDengan\s+pasti\s+/gi, ''],
  
  // Robotic confirmations
  [/\bBaik,\s+saya\s+akan\s+/gi, ''],
  [/\bBaik,\s+mari\s+/gi, 'Mari '],
  [/\bOke,\s+/gi, ''],
  
  // Unnatural qualifiers
  [/\bsangat\s+sangat\b/gi, 'sangat'],
  [/\bsekali\s+sekali\b/gi, 'sekali'],
  
  // Excessive politeness
  [/\bMaaf\s+sebelumnya,?\s+/gi, ''],
  [/\bPermisi,?\s+/gi, ''],
  [/\bSekedar\s+informasi,?\s+/gi, ''],
  [/\bPerlu\s+diketahui\s+bahwa\s+/gi, ''],
];

/**
 * Technical terms whitelist
 * 
 * Technical terms and official program names that should NOT be translated.
 * These are preserved as-is during content transformation.
 */
export const TECHNICAL_TERMS_WHITELIST: string[] = [
  // Official government program names
  'PKH', // Program Keluarga Harapan
  'BPNT', // Bantuan Pangan Non Tunai
  'KIP', // Kartu Indonesia Pintar
  'KIP Kuliah',
  'KIS', // Kartu Indonesia Sehat
  'PIP', // Program Indonesia Pintar
  'BST', // Bantuan Sosial Tunai
  'BLT', // Bantuan Langsung Tunai
  'JKN', // Jaminan Kesehatan Nasional
  'BPJS',
  
  // Technical/system terms
  'API',
  'URL',
  'PDF',
  'HTTP',
  'HTTPS',
  'JSON',
  'XML',
  
  // Database/technical identifiers
  'database',
  'endpoint',
  'server',
  'client',
  'frontend',
  'backend',
];

/**
 * Helper to check if a word should be preserved (not translated)
 */
export function shouldPreserveTerm(word: string): boolean {
  return TECHNICAL_TERMS_WHITELIST.some(
    term => term.toLowerCase() === word.toLowerCase()
  );
}
