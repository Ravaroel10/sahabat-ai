import Link from "next/link";
import { Sparkles, MessageCircle, Store, FileText, ShieldAlert, Scale, Layers, Search, Brain, BookOpen, Users, HeartHandshake, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#faf6f2] text-[#191816]">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 pt-4">
        <div className="mx-auto max-w-5xl rounded-full bg-white/80 backdrop-blur-sm px-6 py-3 flex items-center justify-between border border-[#e05e3f]/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#e05e3f] flex items-center justify-center text-white font-bold text-sm">
              SA
            </div>
            <span className="font-bold text-lg text-[#191816] tracking-tight">
              SAHABAT AI<span className="text-[#e05e3f]">.</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#191816]/75">
            <a href="#fitur" className="hover:text-[#e05e3f] transition-colors">Fitur</a>
            <a href="#arsitektur" className="hover:text-[#e05e3f] transition-colors">Arsitektur</a>
            <a href="#cara-kerja" className="hover:text-[#e05e3f] transition-colors">Cara Kerja</a>
          </nav>

          <Link href="/chat">
            <Button size="sm" className="bg-[#e05e3f] hover:bg-[#c24f30] text-white rounded-full">
              Mulai Chat
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#e05e3f]/5 border border-[#e05e3f]/15 rounded-full text-[11px] font-semibold text-[#e05e3f] mb-6">
          <Sparkles size={12} className="text-[#e05e3f]" />
          Platform Akses Jaminan Sosial Indonesia · 3 Fitur Utama
        </div>

        <h1 className="font-bold text-4xl sm:text-6xl tracking-tight leading-tight text-[#191816] max-w-4xl">
          SAHABAT AI Membimbing <br />
          <span className="text-[#e05e3f]">Akses Hak Sosial</span> Keluarga Anda.
        </h1>

        <p className="text-[#191816]/70 text-sm sm:text-base leading-relaxed max-w-2xl mt-6">
          Chat AI bersitasi otomatis dari knowledge base regulasi nasional, direktori program bantuan lintas kementerian dengan filter kelayakan otomatis, dan generator draf dokumen administrasi sipil siap cetak. Dirancang untuk transparansi dan kemandirian warga.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto">
          <Link href="/chat">
            <Button size="lg" className="bg-[#e05e3f] hover:bg-[#c24f30] text-white rounded-full px-8">
              Mulai Chat AI
            </Button>
          </Link>
          <Link href="/programs">
            <Button variant="outline" size="lg" className="rounded-full px-8 border-[#191816]/10">
              Cari Program
            </Button>
          </Link>
        </div>

        {/* Feature Preview Card */}
        <div className="w-full mt-14 relative" id="fitur">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-[#e05e3f]/15 overflow-hidden max-w-4xl mx-auto relative z-20 text-left">
            <div className="bg-[#e05e3f]/5 px-6 py-4 flex items-center justify-between border-b border-[#e05e3f]/10">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#e05e3f]/30" />
                  <div className="w-3 h-3 rounded-full bg-[#191816]/10" />
                  <div className="w-3 h-3 rounded-full bg-[#eae4dc]" />
                </div>
                <span className="text-[11px] font-mono text-[#191816]/50 ml-3">SAHABAT AI — Chat · Marketplace · Auto-Birokrasi</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#e05e3f]/10 text-[#e05e3f] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e05e3f] animate-pulse" />
                RAG + Streaming
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
              <div className="md:col-span-4 bg-[#e05e3f]/5 p-6 sm:p-8 border-r border-[#e05e3f]/10 flex flex-col justify-between">
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] font-mono font-bold text-[#e05e3f] uppercase tracking-widest">3 Fitur Utama</span>
                  <h3 className="font-bold text-xl text-[#191816] leading-snug">Chat, Direktori Program, dan Generator Dokumen</h3>
                  <p className="text-xs text-[#191816]/70 leading-relaxed">
                    SAHABAT AI mengombinasikan AI percakapan dengan knowledge base regulasi, filter kelayakan otomatis, dan generator draf PDF untuk membantu warga mengurus hak sosialnya secara mandiri.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#e05e3f]/10">
                  <span className="text-[10px] font-mono text-[#191816]/40 uppercase block mb-1">Tujuan</span>
                  <span className="text-xs font-bold text-[#e05e3f]">Mengurangi asimetri informasi kependudukan</span>
                </div>
              </div>

              <div className="md:col-span-8 p-6 sm:p-8 flex flex-col justify-between gap-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono font-bold text-[#191816]/40 uppercase">3 Pilar Layanan SAHABAT AI</span>
                  <h4 className="font-bold text-[#191816] text-lg">Solusi Advokasi Sipil Terintegrasi</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#faf6f2] p-4 rounded-2xl border border-[#e05e3f]/10 hover:border-[#e05e3f]/30 transition-all">
                    <MessageCircle size={22} className="text-[#e05e3f] mb-3" />
                    <h5 className="font-bold text-xs text-[#191816] mb-1">1. Chat AI + RAG</h5>
                    <p className="text-[11px] text-[#191816]/60 leading-normal">Chat streaming dengan sitasi otomatis dari Permensos, Perpres, dan UU. Respons dalam bahasa percakapan, darurat terdeteksi otomatis.</p>
                  </div>

                  <div className="bg-[#faf6f2] p-4 rounded-2xl border border-[#e05e3f]/10 hover:border-[#e05e3f]/30 transition-all">
                    <Store size={22} className="text-[#e05e3f] mb-3" />
                    <h5 className="font-bold text-xs text-[#191816] mb-1">2. Marketplace Program</h5>
                    <p className="text-[11px] text-[#191816]/60 leading-normal">Direktori program bantuan dari berbagai kementerian (PKH, BPNT, KIP, BPJS, dll) dengan filter kelayakan otomatis berdasarkan profil Anda. URL filter dapat dishare.</p>
                  </div>

                  <div className="bg-[#faf6f2] p-4 rounded-2xl border border-[#e05e3f]/10 hover:border-[#e05e3f]/30 transition-all">
                    <FileText size={22} className="text-[#e05e3f] mb-3" />
                    <h5 className="font-bold text-xs text-[#191816] mb-1">3. Auto-Birokrasi</h5>
                    <p className="text-[11px] text-[#191816]/60 leading-normal">Generator draf SKTM, Surat Permohonan, Formulir Aduan, dan Surat Pengantar dalam format PDF siap cetak.</p>
                  </div>
                </div>

                <div className="p-4 bg-[#e05e3f]/5 rounded-2xl border border-[#e05e3f]/10 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#e05e3f] shrink-0" />
                  <p className="text-[11px] text-[#191816]/75 leading-relaxed">
                    <strong>Alur terhubung:</strong> hasil rekomendasi chat otomatis mengisi filter marketplace, dan program terpilih membawa konteksnya ke Auto-Birokrasi. Tidak perlu input data dua kali.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid — Real counts, not fabricated metrics */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-left" id="arsitektur">
          <div className="bg-[#e05e3f] text-white p-6 sm:p-8 rounded-3xl border border-[#e05e3f]/10">
            <span className="font-black text-3xl block">Lintas Kementerian</span>
            <span className="text-xs font-semibold text-white/90 mt-1 block">Cakupan Multi-Lembaga Negara</span>
            <p className="text-[11px] text-white/70 mt-2 leading-relaxed">Program bantuan dari Kemensos, Kemenkes, Kemendikbudristek, Kemenkop UKM, BPJS Ketenagakerjaan, BNPB, hingga pemerintah daerah — merangkum kategori tunai, pangan, pendidikan, kesehatan, lansia, disabilitas, dan perumahan. Filter kelayakan otomatis menyesuaikan profil Anda.</p>
          </div>
          <div className="bg-white text-[#191816] p-6 sm:p-8 rounded-3xl border border-[#e05e3f]/15">
            <span className="font-black text-3xl block text-[#e05e3f]">RAG + Sitasi</span>
            <span className="text-xs font-semibold text-[#191816]/80 mt-1 block">Respons Berbasis Regulasi</span>
            <p className="text-[11px] text-[#191816]/60 mt-2 leading-relaxed">Chat streaming dengan retrieval-augmented generation dari knowledge base Permensos, Perpres, dan UU. Setiap klaim peraturan menyertakan rujukan pasal.</p>
          </div>
          <div className="bg-[#faf6f2] text-[#191816] p-6 sm:p-8 rounded-3xl border border-[#eae4dc]">
            <span className="font-black text-3xl block text-[#191816]">Auto-Birokrasi</span>
            <span className="text-xs font-semibold text-[#191816]/80 mt-1 block">Template Lengkap + Custom PDF</span>
            <p className="text-[11px] text-[#191816]/60 mt-2 leading-relaxed">Template surat administrasi sipil Indonesia (SKTM, Permohonan, Aduan, Pengantar) plus upload PDF custom dengan auto-fill kolom isian. Output format surat resmi kelurahan, siap cetak.</p>
          </div>
        </div>
      </section>

      {/* Architecture & Features Section */}
      <section className="py-20 bg-white border-y border-[#e05e3f]/10 px-4 sm:px-6 lg:px-8" id="solusi-ai">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 flex flex-col gap-6 text-left">
            <h2 className="font-bold text-3xl sm:text-4xl tracking-tight leading-tight text-[#191816]">
              Tiga Fitur untuk Setiap Langkah Akses Hak Sosial
            </h2>
            <p className="text-[#191816]/75 text-xs sm:text-sm leading-relaxed">
              SAHABAT AI menutup celah informasi antara warga prasejahtera dan program pemerintah melalui tiga fitur yang saling terhubung: tanya jawab AI bersitasi, direktori program yang dapat difilter, dan generator draf dokumen untuk dibawa ke kelurahan.
            </p>
            <p className="text-[#191816]/70 text-xs sm:text-sm leading-relaxed">
              Semua fitur dapat digunakan tanpa login. Login hanya untuk menyimpan riwayat chat dan draf dokumen antar sesi.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="flex items-start gap-2.5 text-xs text-[#191816]/85">
                <BookOpen size={16} className="text-[#e05e3f] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[#191816]">Sitasi Otomatis</strong>
                  <span className="text-[#191816]/60">Pasal dan nomor peraturan dicantumkan.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-[#191816]/85">
                <Brain size={16} className="text-[#e05e3f] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[#191816]">Filter Kelayakan AI</strong>
                  <span className="text-[#191816]/60">Rekomendasi program sesuai kondisi Anda.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col gap-5">
            <div className="p-5 rounded-2xl bg-[#faf6f2] border border-[#e05e3f]/10 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-7 h-7 rounded-full bg-[#e05e3f]/10 flex items-center justify-center text-[#e05e3f]">
                  <MessageCircle size={14} />
                </div>
                <h4 className="font-bold text-sm text-[#191816]">Chat AI + RAG (di /chat)</h4>
              </div>
              <p className="text-xs text-[#191816]/65 leading-relaxed">
                Pesan Anda diambil dari vector database regulasi (ChromaDB) sebelum diteruskan ke LLM. Respons mengalir token-per-token via SSE dengan sitasi peraturan yang dapat diklik. Situasi darurat (kecelakaan, kekerasan, bencana) terdeteksi otomatis dan memprioritaskan hotline.
              </p>
                {/* Desktop */}
            <Image src="/maskot3.png" alt="Maskot" width={120} height={120} className="hidden md:block absolute -bottom-145 right-60 w-24 h-auto"/>

              {/* Mobile */}
            <Image src="/maskot3.png" alt="Maskot" width={70} height={70}className="block md:hidden absolute top-565 right-2 w-14 h-auto"/>
            </div>

            <div className="p-5 rounded-2xl bg-[#faf6f2] border border-[#e05e3f]/10 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-7 h-7 rounded-full bg-[#e05e3f]/10 flex items-center justify-center text-[#e05e3f]">
                  <Store size={14} />
                </div>
                <h4 className="font-bold text-sm text-[#191816]">Marketplace + Eligibility (di /programs)</h4>
              </div>
              <p className="text-xs text-[#191816]/65 leading-relaxed">
                Filter program bantuan multi-kementerian berdasarkan penghasilan, jumlah anggota keluarga, lokasi, pekerjaan, usia, dan disabilitas. Kalkulator kelayakan lokal menandai tiap program sebagai <em>cocok</em>, <em>perlu verifikasi</em>, atau <em>tidak memenuhi</em>. Filter dapat dishare via URL.
              </p>
                {/* Desktop */}
          <Image src="/maskot2.png" alt="Maskot" width={120} height={120} className="hidden md:block absolute -bottom-145 right-145 w-24 h-auto"/>

            {/* Mobile */}
          <Image src="/maskot2.png" alt="Maskot" width={70} height={70} className="block md:hidden absolute top-515 right-2 w-14 h-auto"/>
            </div>

            <div className="p-5 rounded-2xl bg-[#faf6f2] border border-[#e05e3f]/10 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-7 h-7 rounded-full bg-[#e05e3f]/10 flex items-center justify-center text-[#e05e3f]">
                  <FileText size={14} />
                </div>
                <h4 className="font-bold text-sm text-[#191816]">Auto-Birokrasi (di /documents)</h4>
              </div>
              <p className="text-xs text-[#191816]/65 leading-relaxed">
                Template multi-format (SKTM, Permohonan, Aduan, Pengantar) plus upload PDF custom — kolom isian diekstrak otomatis. Output PDF menggunakan format surat resmi Indonesia, siap dibawa ke kelurahan untuk ditandatangani.
              </p>
               {/* Desktop */}
          <Image src="/maskot1.png" alt="Maskot" width={125} height={125} className="hidden md:block absolute -bottom-145 right-225 w-24 h-auto"/>

           {/* Mobile */}
          <Image src="/maskot1.png" alt="Maskot" width={70} height={70} className="block md:hidden absolute top-450 right-2 w-14 h-auto"/>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto" id="cara-kerja">
        <h2 className="font-bold text-3xl sm:text-4xl tracking-tight leading-tight text-[#191816] max-w-2xl mx-auto text-center">
          Cara Kerja
        </h2>
        <p className="text-[#191816]/70 text-xs sm:text-sm mt-3 max-w-lg mx-auto text-center">
          Frontend Next.js 16 + backend FastAPI + knowledge base ChromaDB. Tiap fitur berdiri sendiri dan saling berbagi konteks.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-4xl mx-auto">
          {[
            {
              icon: Brain,
              title: "Chat AI Multi-Kemampuan",
              description: "Empat kapabilitas dalam satu antarmuka: navigasi hak, sitasi bukti (Permensos/Perpres/UU), fact-check klaim, dan eskalasi darurat. Chat history otomatis tersimpan untuk pengguna login."
            },
            {
              icon: ShieldAlert,
              title: "Deteksi Darurat Otomatis",
              description: "Pesan dengan kata kunci darurat (kecelakaan, kekerasan, bencana) ditandai otomatis. UI menampilkan hotline 119/110/113 dan program prioritas. Berlaku bahkan saat LLM gagal."
            },
            {
              icon: Search,
              title: "Smart Eligibility Search",
              description: "Modal dua-langkah: input kriteria terstruktur, lalu konteks bebas. Backend menghitung skor kelayakan dengan LLM untuk rekomendasi yang kontekstual, bukan hanya berbasis field matching."
            },
            {
              icon: Layers,
              title: "Konteks Lintas-Fitur",
              description: "Program hasil rekomendasi chat otomatis mengisi filter marketplace. Program yang dipilih membawa konteksnya (kriteria user) ke Auto-Birokrasi. Riwayat draf tersimpan per template."
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white rounded-3xl border border-[#e05e3f]/10 p-6 sm:p-8 text-left">
                <div className="w-12 h-12 bg-[#e05e3f]/10 rounded-2xl flex items-center justify-center border border-[#e05e3f]/10 text-[#e05e3f] mb-4">
                  <Icon size={24} />
                </div>
                <h4 className="font-bold text-base text-[#191816] mb-2">{item.title}</h4>
                <p className="text-xs text-[#191816]/75 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Audience Section */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <h2 className="font-bold text-3xl sm:text-4xl tracking-tight leading-tight text-[#191816] max-w-2xl mx-auto text-center">
          Untuk Siapa SAHABAT AI
        </h2>
        <p className="text-[#191816]/70 text-xs sm:text-sm mt-3 max-w-lg mx-auto text-center">
          Fitur yang sama, kegunaan yang berbeda untuk tiap peran.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-4xl mx-auto">
          {[
            {
              icon: Users,
              title: "Warga Mandiri",
              description: "Cek kelayakan program dari rumah, ajukan pertanyaan dalam bahasa sehari-hari, dan unduh draf dokumen — tanpa calo atau pungli."
            },
            {
              icon: HeartHandshake,
              title: "Relawan Sosial",
              description: "Bantu warga di lapangan dengan rujukan peraturan instan via chat. Riwayat percakapan tersimpan per pengguna, sehingga lanjutan sesi bisa di mana saja."
            },
            {
              icon: Scale,
              title: "RT/RW & Pendamping",
              description: "Jelaskan parameter desil kemiskinan dan dokumen yang dibutuhkan dengan dasar hukum yang jelas. Filter marketplace membantu cek kelayakan warga secara objektif."
            },
            {
              icon: Building,
              title: "Dinas Sosial",
              description: "Berkas yang masuk lebih siap: warga dapat men-generate draf SKTM/Surat Pengantar yang sesuai format sebelum datang ke kantor. Mengurangi kesalahan administrasi."
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-white rounded-3xl border border-[#e05e3f]/10 p-6 sm:p-8 text-left">
                <div className="w-12 h-12 bg-[#e05e3f]/10 rounded-2xl flex items-center justify-center border border-[#e05e3f]/10 text-[#e05e3f] mb-4">
                  <Icon size={24} />
                </div>
                <h4 className="font-bold text-base text-[#191816] mb-2">{item.title}</h4>
                <p className="text-xs text-[#191816]/75 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#191816] text-[#faf6f2]/60 py-16 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white text-[#191816] flex items-center justify-center font-bold text-sm">
                SA
              </div>
              <span className="font-bold text-base text-white tracking-tight">
                SAHABAT<span className="text-[#e05e3f]">.</span>
              </span>
            </div>
            <p className="text-[11px] text-[#faf6f2]/55 text-center md:text-left max-w-xs mt-1 leading-normal">
              Gerakan demokratisasi akses jaminan sosial warga prasejahtera Indonesia. Informasi yang diberikan bersifat umum — verifikasi ke Dinas Sosial setempat untuk kepastian kelayakan.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-[10px] font-mono text-white/50">
            <a href="#fitur" className="hover:text-white transition-colors">Fitur</a>
            <a href="#arsitektur" className="hover:text-white transition-colors">Arsitektur</a>
            <a href="#cara-kerja" className="hover:text-white transition-colors">Cara Kerja</a>
          </div>
        </div>

        <div className="max-w-5xl mx-auto border-t border-white/5 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-[#faf6f2]/40 font-mono">
          <p>© 2026 SAHABAT AI. Seluruh hak cipta dilindungi.</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Next.js 16 · React 19 · FastAPI · ChromaDB
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
