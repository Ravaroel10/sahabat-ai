/**
 * PDF Templates for Government Documents (Surat Resmi)
 * Uses @react-pdf/renderer to generate properly formatted PDFs
 */

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts for better Indonesian character support
// You can add custom fonts here if needed

// Define styles for Indonesian government letter format
const styles = StyleSheet.create({
  page: {
    padding: '2cm 3cm',
    fontSize: 12,
    fontFamily: 'Times-Roman',
    lineHeight: 1.5,
  },
  
  // Letterhead (Kop Surat)
  letterhead: {
    borderBottom: '3pt solid black',
    paddingBottom: 10,
    marginBottom: 20,
  },
  
  letterheadTitle: {
    fontSize: 16,
    fontFamily: 'Times-Bold',
    textAlign: 'center',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  
  letterheadSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
  
  letterheadAddress: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 2,
  },
  
  // Document Number and Title
  documentNumber: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 5,
  },
  
  documentTitle: {
    fontSize: 14,
    fontFamily: 'Times-Bold',
    textAlign: 'center',
    marginBottom: 20,
    textDecoration: 'underline',
    textTransform: 'uppercase',
  },
  
  // Content sections
  introText: {
    marginBottom: 15,
    textAlign: 'justify',
  },
  
  dataTable: {
    marginBottom: 15,
  },
  
  dataRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  
  dataLabel: {
    width: '35%',
    paddingLeft: 30,
  },
  
  dataColon: {
    width: '3%',
  },
  
  dataValue: {
    width: '62%',
  },
  
  paragraph: {
    marginBottom: 10,
    textAlign: 'justify',
    paddingLeft: 30,
    paddingRight: 30,
  },
  
  // Signature section
  signatureSection: {
    marginTop: 30,
    marginBottom: 15,
  },
  
  signatureBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  
  signatureBox: {
    width: '45%',
    alignItems: 'center',
  },
  
  signatureBoxSingle: {
    width: '50%',
    marginLeft: 'auto',
    alignItems: 'center',
  },
  
  signatureLocation: {
    textAlign: 'center',
    marginBottom: 5,
  },
  
  signatureRole: {
    textAlign: 'center',
    marginBottom: 40,
  },
  
  signatureName: {
    textAlign: 'center',
    fontFamily: 'Times-Bold',
    textDecoration: 'underline',
  },
  
  signatureNIP: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  
  // Footer stamps section
  stampSection: {
    marginTop: 20,
    borderTop: '1pt solid #ccc',
    paddingTop: 15,
  },
  
  stampTitle: {
    fontFamily: 'Times-Bold',
    marginBottom: 5,
  },
});

interface DocumentData {
  // Template type
  templateType: 'sktm' | 'permohonan' | 'aduan' | 'pengantar';
  
  // Letterhead data
  kabupatenKota?: string;
  kecamatan?: string;
  kelurahan?: string;
  alamatKantor?: string;
  
  // Document metadata
  nomorSurat?: string;
  tanggal?: string;
  
  // Personal data
  nama?: string;
  nik?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  jenisKelamin?: string;
  alamat?: string;
  rtRw?: string;
  pekerjaan?: string;
  penghasilanPerBulan?: string;
  jumlahTanggungan?: string;
  telepon?: string;
  email?: string;
  
  // Purpose
  keperluan?: string;
  tujuanSurat?: string;
  
  // Additional fields
  [key: string]: string | undefined;
}

interface PDFDocumentProps {
  data: DocumentData;
}

// SKTM Template
export function SKTMDocument({ data }: PDFDocumentProps) {
  const today = new Date().toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Letterhead */}
        <View style={styles.letterhead}>
          <Text style={styles.letterheadTitle}>
            PEMERINTAH {data.kabupatenKota?.toUpperCase() || '.....................'}
          </Text>
          <Text style={styles.letterheadTitle}>
            KECAMATAN {data.kecamatan?.toUpperCase() || '.....................'}
          </Text>
          <Text style={styles.letterheadSubtitle}>
            KELURAHAN/DESA {data.kelurahan?.toUpperCase() || '.....................'}
          </Text>
          <Text style={styles.letterheadAddress}>
            {data.alamatKantor || 'Alamat: .....................'}
          </Text>
        </View>
        
        {/* Document Number */}
        <Text style={styles.documentNumber}>
          Nomor: {data.nomorSurat || `___/SKTM/${new Date().getFullYear()}`}
        </Text>
        
        {/* Title */}
        <Text style={styles.documentTitle}>
          SURAT KETERANGAN TIDAK MAMPU
        </Text>
        
        {/* Introduction */}
        <Text style={styles.introText}>
          Yang bertanda tangan di bawah ini Lurah/Kepala Desa {data.kelurahan || '.....................'}, 
          Kecamatan {data.kecamatan || '.....................'}, menerangkan dengan sebenarnya bahwa:
        </Text>
        
        {/* Personal Data Table */}
        <View style={styles.dataTable}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Nama Lengkap</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.nama || ''}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>NIK</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.nik || ''}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Tempat/Tgl Lahir</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>
              {data.tempatLahir || ''}{data.tempatLahir && data.tanggalLahir ? ', ' : ''}{data.tanggalLahir || ''}
            </Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Jenis Kelamin</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.jenisKelamin || ''}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Alamat</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.alamat || ''}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>RT/RW</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.rtRw || ''}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Kelurahan/Desa</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.kelurahan || ''}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Kecamatan</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.kecamatan || ''}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Pekerjaan</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.pekerjaan || ''}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Penghasilan/Bulan</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.penghasilanPerBulan ? `Rp ${data.penghasilanPerBulan}` : ''}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Jumlah Tanggungan</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.jumlahTanggungan ? `${data.jumlahTanggungan} orang` : ''}</Text>
          </View>
        </View>
        
        {/* Statement */}
        <Text style={styles.paragraph}>
          Berdasarkan hasil survey dan penelitian, yang bersangkutan benar-benar termasuk 
          keluarga tidak mampu dan layak menerima bantuan sosial dari pemerintah.
        </Text>
        
        <Text style={styles.paragraph}>
          Surat keterangan ini dibuat untuk keperluan: {data.keperluan || '.....................'}
        </Text>
        
        <Text style={styles.paragraph}>
          Demikian surat keterangan ini dibuat dengan sebenar-benarnya dan dapat digunakan 
          sebagaimana mestinya.
        </Text>
        
        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <Text style={styles.signatureLocation}>
            {data.kelurahan || '.....................'}, {data.tanggal || today}
          </Text>
          
          <View style={styles.signatureBlock}>
            {/* Left: Applicant */}
            <View style={styles.signatureBox}>
              <Text style={styles.signatureRole}>Yang Membuat Pernyataan,</Text>
              <Text style={styles.signatureName}>{data.nama || '( ........................... )'}</Text>
            </View>
            
            {/* Right: Village Head */}
            <View style={styles.signatureBox}>
              <Text style={styles.signatureRole}>Lurah/Kepala Desa,</Text>
              <Text style={styles.signatureName}>{data.namaKedesLurah || '( ........................... )'}</Text>
              {data.nipKedesLurah && <Text style={styles.signatureNIP}>NIP. {data.nipKedesLurah}</Text>}
            </View>
          </View>
          
          {/* District Head Acknowledgment */}
          <View style={styles.signatureBoxSingle}>
            <Text style={styles.signatureRole}>
              Mengetahui:{'\n'}
              Camat {data.kecamatan || '.....................'}
            </Text>
            <Text style={styles.signatureName}>{data.namaCamat || '( ........................... )'}</Text>
            {data.nipCamat && <Text style={styles.signatureNIP}>NIP. {data.nipCamat}</Text>}
          </View>
        </View>
      </Page>
    </Document>
  );
}

// Permohonan Bantuan Template
export function PermohonanDocument({ data }: PDFDocumentProps) {
  const today = new Date().toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <Text style={styles.documentTitle}>
          SURAT PERMOHONAN BANTUAN SOSIAL
        </Text>
        
        {/* Recipient Address */}
        <Text style={styles.paragraph}>
          Kepada Yth.{'\n'}
          Kepala Dinas Sosial{'\n'}
          {data.kabupatenKota || '.....................'}
        </Text>
        
        <Text style={styles.introText}>Dengan hormat,</Text>
        
        <Text style={styles.introText}>Yang bertanda tangan di bawah ini:</Text>
        
        {/* Personal Data Table */}
        <View style={styles.dataTable}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Nama</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.nama || ''}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>NIK</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.nik || ''}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Alamat</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.alamat || ''}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Nomor Telepon</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.telepon || ''}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Pekerjaan</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.pekerjaan || ''}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Penghasilan/Bulan</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.penghasilan ? `Rp ${data.penghasilan}` : ''}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Jumlah Anggota Keluarga</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.jumlahAnggotaKeluarga ? `${data.jumlahAnggotaKeluarga} orang` : ''}</Text>
          </View>
        </View>
        
        {/* Request Body */}
        <Text style={styles.paragraph}>
          Dengan ini mengajukan permohonan untuk menjadi penerima {data.jenisBantuanYangDimohon || '.....................'}.
        </Text>
        
        <Text style={styles.paragraph}>
          <Text style={{ fontFamily: 'Times-Bold' }}>Alasan memerlukan bantuan:{'\n'}</Text>
          {data.alasanMemerlukanBantuan || '.....................'}
        </Text>
        
        {data.keteranganTambahan && (
          <Text style={styles.paragraph}>
            <Text style={{ fontFamily: 'Times-Bold' }}>Keterangan tambahan:{'\n'}</Text>
            {data.keteranganTambahan}
          </Text>
        )}
        
        {/* Attachments */}
        <Text style={styles.paragraph}>
          Sebagai bahan pertimbangan, bersama ini kami lampirkan:{'\n'}
          1. Fotokopi KTP{'\n'}
          2. Fotokopi Kartu Keluarga (KK){'\n'}
          3. Surat Keterangan Tidak Mampu (SKTM){'\n'}
          4. Fotokopi Akta Kelahiran (jika ada){'\n'}
          5. Surat Keterangan Tempat Tinggal (jika domisili tidak sesuai KK)
        </Text>
        
        {/* Closing */}
        <Text style={styles.paragraph}>
          Demikian surat permohonan ini saya buat dengan sebenar-benarnya. Atas perhatian 
          dan pertimbangan Bapak/Ibu, saya ucapkan terima kasih.
        </Text>
        
        {/* Signature */}
        <View style={styles.signatureSection}>
          <Text style={styles.signatureLocation}>
            {data.kelurahan || '.....................'}, {data.tanggal || today}
          </Text>
          
          <View style={styles.signatureBoxSingle}>
            <Text style={styles.signatureRole}>Hormat saya,</Text>
            <Text style={styles.signatureName}>{data.nama || '( ........................... )'}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// Surat Pengantar Template
export function PengantarDocument({ data }: PDFDocumentProps) {
  const today = new Date().toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Letterhead */}
        <View style={styles.letterhead}>
          <Text style={styles.letterheadTitle}>
            PEMERINTAH {data.kabupatenKota?.toUpperCase() || '.....................'}
          </Text>
          <Text style={styles.letterheadTitle}>
            KECAMATAN {data.kecamatan?.toUpperCase() || '.....................'}
          </Text>
          <Text style={styles.letterheadSubtitle}>
            KELURAHAN/DESA {data.kelurahan?.toUpperCase() || '.....................'}
          </Text>
          <Text style={styles.letterheadAddress}>
            {data.alamatKantor || 'Alamat: .....................'}
          </Text>
        </View>
        
        {/* Document Number */}
        <Text style={styles.documentNumber}>
          Nomor: {data.nomorSurat || '___/___/___'}
        </Text>
        
        {/* Title */}
        <Text style={styles.documentTitle}>SURAT PENGANTAR</Text>
        
        {/* Introduction */}
        <Text style={styles.introText}>
          Yang bertanda tangan di bawah ini, Pemerintah Kecamatan {data.kecamatan || '[Kecamatan]'} / 
          Kelurahan {data.kelurahan || '[Kelurahan]'}:
        </Text>
        
        <Text style={styles.introText}>
          Dengan ini mengantar warga yang namanya tersebut di bawah ini:
        </Text>
        
        {/* Personal Data */}
        <View style={styles.dataTable}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Nama</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.nama || '[Nama]'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>NIK</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.nik || '[NIK]'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Tempat/Tgl Lahir</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>
              {data.tempatLahir || '[Tempat]'}, {data.tanggalLahir || '[Tanggal]'}
            </Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Alamat</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.alamat || '[Alamat]'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>RT/RW</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.rtRw || '[RT/RW]'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Kelurahan/Desa</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.kelurahan || '[Kelurahan]'}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Kecamatan</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.kecamatan || '[Kecamatan]'}</Text>
          </View>
        </View>
        
        {/* Purpose */}
        <Text style={styles.paragraph}>
          Untuk: {data.tujuanSurat || '[Tujuan Surat]'}
        </Text>
        
        <Text style={styles.paragraph}>
          Keperluan: {data.keperluan || '[Keperluan]'}
        </Text>
        
        <Text style={styles.paragraph}>
          Berdasarkan data yang ada di kantor kami, informasi yang diberikan adalah benar.
        </Text>
        
        <Text style={styles.paragraph}>
          Demikian surat pengantar ini dibuat untuk dapat dipergunakan sebagaimana mestinya.
        </Text>
        
        {/* Signature */}
        <View style={styles.signatureSection}>
          <Text style={styles.signatureLocation}>
            {data.kelurahan || '[Tempat]'}, {data.tanggal || today}
          </Text>
          
          <View style={styles.signatureBoxSingle}>
            <Text style={styles.signatureRole}>Lurah/Camat,</Text>
            <Text style={styles.signatureName}>{data.namaPejabat || '( ........................... )'}</Text>
            {data.nip && <Text style={styles.signatureNIP}>NIP. {data.nip}</Text>}
          </View>
        </View>
      </Page>
    </Document>
  );
}

// Form Aduan Template
export function AduanDocument({ data }: PDFDocumentProps) {
  const today = new Date().toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <Text style={styles.documentTitle}>
          FORMULIR PENGADUAN/MASUKAN{'\n'}
          PROGRAM BANTUAN SOSIAL
        </Text>
        
        <Text style={styles.documentNumber}>
          Tanggal: {data.tanggal || today}
        </Text>
        
        {/* Section A: Identity */}
        <Text style={{ ...styles.paragraph, fontFamily: 'Times-Bold', marginTop: 20 }}>
          A. IDENTITAS PENGADU
        </Text>
        
        <View style={styles.dataTable}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Nama Lengkap</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.namaPengadu || ''}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>NIK</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.nikPengadu || ''}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Alamat</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.alamatPengadu || ''}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Nomor Telepon</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.teleponPengadu || ''}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Email</Text>
            <Text style={styles.dataColon}>:</Text>
            <Text style={styles.dataValue}>{data.email || ''}</Text>
          </View>
        </View>
        
        {/* Section B: Category */}
        <Text style={{ ...styles.paragraph, fontFamily: 'Times-Bold', marginTop: 15 }}>
          B. KATEGORI PENGADUAN
        </Text>
        
        <Text style={styles.paragraph}>
          {data.kategoriAduan || '.....................'}
        </Text>
        
        {/* Section C: Details */}
        <Text style={{ ...styles.paragraph, fontFamily: 'Times-Bold', marginTop: 15 }}>
          C. RINGKASAN PENGADUAN
        </Text>
        
        <Text style={styles.paragraph}>
          <Text style={{ fontFamily: 'Times-Bold' }}>Subjek: </Text>
          {data.subjekAduan || '.....................'}
        </Text>
        
        <Text style={styles.paragraph}>
          <Text style={{ fontFamily: 'Times-Bold' }}>Detail Pengaduan:{'\n'}</Text>
          {data.detailAduan || '.....................'}
        </Text>
        
        {/* Section D: Evidence */}
        <Text style={{ ...styles.paragraph, fontFamily: 'Times-Bold', marginTop: 15 }}>
          D. BUKTI PENDUKUNG
        </Text>
        
        <Text style={styles.paragraph}>
          {data.buktiPendukung || 'Terlampir'}
        </Text>
        
        {/* Section E: Expected Response */}
        <Text style={{ ...styles.paragraph, fontFamily: 'Times-Bold', marginTop: 15 }}>
          E. TANGGAPAN YANG DIHARAPKAN
        </Text>
        
        <Text style={styles.paragraph}>
          {data.tanggapanYangDiharapkan || '.....................'}
        </Text>
        
        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            {/* Left: Complainant */}
            <View style={styles.signatureBox}>
              <Text style={styles.signatureRole}>Pengadu,</Text>
              <Text style={styles.signatureName}>{data.namaPengadu || '( ........................... )'}</Text>
            </View>
            
            {/* Right: Officer */}
            <View style={styles.signatureBox}>
              <Text style={styles.signatureRole}>Petugas Penerima,</Text>
              <Text style={styles.signatureName}>{data.namaPetugas || '( ........................... )'}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// Export type for template selection
export type PDFTemplateType = 'sktm' | 'permohonan' | 'aduan' | 'pengantar';

// Helper to get the appropriate template component
export function getPDFTemplate(templateType: PDFTemplateType) {
  switch (templateType) {
    case 'sktm':
      return SKTMDocument;
    case 'permohonan':
      return PermohonanDocument;
    case 'aduan':
      return AduanDocument;
    case 'pengantar':
      return PengantarDocument;
    default:
      return SKTMDocument;
  }
}
