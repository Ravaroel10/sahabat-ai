"""
Content transformer — ported from src/lib/content-transformer.ts.

Applies post-LLM output transformation:
1. remove_english_mixing — replace English terms with Indonesian equivalents
2. convert_to_conversational — formal bureaucratic → conversational tone
3. remove_ai_patterns — strip AI-generated language patterns

Runs AFTER the LLM call and BEFORE returning the response.
"""

import re
from typing import Dict, List, Tuple

# English → Indonesian word mappings
_ENGLISH_TO_INDONESIAN: Dict[str, str] = {
    "button": "tombol", "click": "klik", "submit": "kirim", "cancel": "batal",
    "close": "tutup", "open": "buka", "save": "simpan", "delete": "hapus",
    "edit": "ubah", "add": "tambah", "remove": "hapus", "filter": "saring",
    "search": "cari", "upload": "unggah", "download": "unduh", "next": "lanjut",
    "previous": "sebelumnya", "back": "kembali", "continue": "lanjutkan",
    "finish": "selesai", "start": "mulai", "stop": "berhenti", "loading": "memuat",
    "error": "kesalahan", "success": "berhasil", "warning": "peringatan",
    "info": "informasi", "marketplace": "pasar program", "dashboard": "beranda",
    "profile": "profil", "settings": "pengaturan", "login": "masuk",
    "logout": "keluar", "register": "daftar", "account": "akun",
    "password": "kata sandi", "email": "surel", "username": "nama pengguna",
    "document": "dokumen", "file": "berkas", "template": "templat",
    "form": "formulir", "field": "kolom", "required": "wajib",
    "optional": "opsional", "pending": "menunggu", "approved": "disetujui",
    "rejected": "ditolak", "completed": "selesai", "processing": "diproses",
}

# Formal → conversational phrase mappings
_FORMAL_TO_CONVERSATIONAL: List[Tuple[str, str]] = [
    (r"\bBapak/Ibu\b", "kamu"),
    (r"\bSaudara/i\b", "kamu"),
    (r"\bAnda\b(?!\s+yang)", "kamu"),
    (r"\bSilakan\s+(?:Bapak/Ibu\s+)?", ""),
    (r"\bSilahkan\s+(?:Bapak/Ibu\s+)?", ""),
    (r"\bMohon\s+untuk\s+", "Tolong "),
    (r"\bDiharapkan\s+", ""),
    (r"\bDimohon\s+", "Tolong "),
    (r"\bHarap\s+", ""),
    (r"\bPerlu\s+diperhatikan\s+bahwa\s+", "Perhatikan: "),
    (r"\bPatut\s+dicatat\s+bahwa\s+", "Ingat: "),
    (r"\bDengan\s+hormat,?\s*", ""),
    (r"\bHormat\s+kami,?\s*", ""),
    (r"\bTerima\s+kasih\s+atas\s+perhatian\s+(?:Bapak/Ibu|Anda)\b", "Terima kasih"),
    (r"\bharus\s+diisi\b", "harus isi"),
    (r"\bakan\s+dikirim\b", "akan kirim"),
    (r"\btelah\s+diterima\b", "sudah terima"),
    (r"\bdapat\s+digunakan\b", "bisa pakai"),
    (r"\bsesuai\s+dengan\s+", "sesuai "),
    (r"\bberdasarkan\s+", "dari "),
    (r"\bdalam\s+hal\s+ini\s+", ""),
    (r"\bpada\s+saat\s+ini\s+", "sekarang "),
    (r"\bsaat\s+ini\s+", "sekarang "),
    (r"\bpada\s+waktu\s+ini\s+", "sekarang "),
    (r"\byang\s+terhormat\b", ""),
    (r"\byang\s+mulia\b", ""),
    (r"\bdengan\s+ini\s+", ""),
    (r"\bkami\s+informasikan\s+bahwa\s+", ""),
]

# AI pattern removals
_AI_PATTERNS: List[Tuple[str, str]] = [
    (r"\bYuk[,!]?\s+", ""),
    (r"\bAyo[,!]?\s+", ""),
    (r"\bYuk kita\b", "Mari kita"),
    (r"\bAyo kita\b", "Mari kita"),
    (r"!{2,}", "!"),
    (r"\bSelanjutnya,\s+", ""),
    (r"\bKemudian,\s+", ""),
    (r"\bSetelah itu,\s+", ""),
    (r"\bLalu,\s+", ""),
    (r"\bBerikutnya,\s+", ""),
    (r"\bSangat\s+senang\s+", ""),
    (r"\bDengan\s+senang\s+hati\s+", ""),
    (r"\bSenang\s+sekali\s+", ""),
    (r"\bTentu\s+saja[,!]?\s+", ""),
    (r"\bPasti[,!]?\s+", ""),
    (r"\bDengan\s+pasti\s+", ""),
    (r"\bBaik,\s+saya\s+akan\s+", ""),
    (r"\bBaik,\s+mari\s+", "Mari "),
    (r"\bOke,\s+", ""),
    (r"\bsangat\s+sangat\b", "sangat"),
    (r"\bsekali\s+sekali\b", "sekali"),
    (r"\bMaaf\s+sebelumnya,?\s+", ""),
    (r"\bPermisi,?\s+", ""),
    (r"\bSekedar\s+informasi,?\s+", ""),
    (r"\bPerlu\s+diketahui\s+bahwa\s+", ""),
]


def remove_english_mixing(text: str) -> str:
    """Replace English words with Indonesian equivalents."""
    if not text or not text.strip():
        return text
    result = text
    for english, indonesian in _ENGLISH_TO_INDONESIAN.items():
        regex = re.compile(rf"\b{english}\b", re.IGNORECASE)
        result = regex.sub(
            lambda m: indonesian.capitalize() if m.group()[0].isupper() else indonesian,
            result,
        )
    return result


def convert_to_conversational(text: str) -> str:
    """Convert formal bureaucratic language to conversational tone."""
    if not text or not text.strip():
        return text
    result = text
    for pattern, replacement in _FORMAL_TO_CONVERSATIONAL:
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
    result = re.sub(r"\s+", " ", result).strip()
    return result


def remove_ai_patterns(text: str) -> str:
    """Strip AI-generated language patterns for natural tone."""
    if not text or not text.strip():
        return text
    result = text
    for pattern, replacement in _AI_PATTERNS:
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
    result = re.sub(r"\s+", " ", result).strip()
    if result:
        result = result[0].upper() + result[1:]
    return result


def transform_content(text: str) -> str:
    """Apply all transformations in sequence: English removal → conversational → AI patterns."""
    if not text or not text.strip():
        return text
    text = remove_english_mixing(text)
    text = convert_to_conversational(text)
    text = remove_ai_patterns(text)
    return text
