import Link from "next/link";
import { Sparkles, CheckCircle2, Compass, Sliders, FileSpreadsheet, Users, HeartHandshake, Layers, Building } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#faf6f2] text-[#191816]">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 pt-4">
        <div className="mx-auto max-w-5xl rounded-full bg-white/80 backdrop-blur-sm px-6 py-3 flex items-center justify-between border border-[#e05e3f]/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#e05e3f] flex items-center justify-center text-white font-bold text-sm">
              BA
            </div>
            <span className="font-bold text-lg text-[#191816] tracking-tight">
              SAHABAT AI<span className="text-[#e05e3f]">.</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#191816]/75">
            <a href="#visi-misi" className="hover:text-[#e05e3f] transition-colors">Visi & Misi</a>
            <a href="#solusi-ai" className="hover:text-[#e05e3f] transition-colors">Solusi AI</a>
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
          Portal Advokasi Jaminan Sosial Indonesia Berbasis AI
        </div>

        <h1 className="font-bold text-4xl sm:text-6xl tracking-tight leading-tight text-[#191816] max-w-4xl">
          Biarkan AI Membimbing <br />
          <span className="text-[#e05e3f]">Akses Hak Sosial</span> Keluarga Anda.
        </h1>

        <p className="text-[#191816]/70 text-sm sm:text-base leading-relaxed max-w-2xl mt-6">
          Mengurangi asimetri informasi birokrasi kependudukan. SAHABAT AI adalah platform informasi asisten hukum cerdas, simulator kelayakan desil jaminan sosial, dan format draf administrasi sipil yang dirancang asri dan bebas hambatan.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto">
          <Link href="/chat">
            <Button size="lg" className="bg-[#e05e3f] hover:bg-[#c24f30] text-white rounded-full px-8">
              Mulai Sekarang
            </Button>
          </Link>
          <a href="#solusi-ai">
            <Button variant="outline" size="lg" className="rounded-full px-8 border-[#191816]/10">
              Pelajari Program
            </Button>
          </a>
        </div>

        {/* Feature Preview Card */}
        <div className="w-full mt-14 relative" id="visi-misi">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-[#e05e3f]/15 overflow-hidden max-w-4xl mx-auto relative z-20 text-left">
            <div className="bg-[#e05e3f]/5 px-6 py-4 flex items-center justify-between border-b border-[#e05e3f]/10">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#e05e3f]/30" />
                  <div className="w-3 h-3 rounded-full bg-[#191816]/10" />
                  <div className="w-3 h-3 rounded-full bg-[#eae4dc]" />
                </div>
                <span className="text-[11px] font-mono text-[#191816]/50 ml-3">SAHABAT AI.app — Informasi Publik & Advokasi Sipil</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#e05e3f]/10 text-[#e05e3f] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e05e3f] animate-pulse" />
                Sipil RI v2.5
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
              <div className="md:col-span-4 bg-[#e05e3f]/5 p-6 sm:p-8 border-r border-[#e05e3f]/10 flex flex-col justify-between">
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] font-mono font-bold text-[#e05e3f] uppercase tracking-widest">Sistem Transparan</span>
                  <h3 className="font-bold text-xl text-[#191816] leading-snug">Menghubungkan Rakyat dengan Jaring Pengaman</h3>
                  <p className="text-xs text-[#191816]/70 leading-relaxed">
                    SAHABAT AI melahirkan kejelasan hukum sosial di Indonesia, mengikis kesenjangan informasi, dan memastikan setiap warga prasejahtera mendapatkan apa yang menjadi hak konstitusional mereka.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#e05e3f]/10">
                  <span className="text-[10px] font-mono text-[#191816]/40 uppercase block mb-1">Target Kami</span>
                  <span className="text-xs font-bold text-[#e05e3f]">100% Bebas Calo & Pungli</span>
                </div>
              </div>

              <div className="md:col-span-8 p-6 sm:p-8 flex flex-col justify-between gap-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono font-bold text-[#191816]/40 uppercase">Pilar Utama Layanan SAHABAT AI</span>
                  <h4 className="font-bold text-[#191816] text-lg">Solusi Advokasi Sipil Modern</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#faf6f2] p-4 rounded-2xl border border-[#e05e3f]/10 hover:border-[#e05e3f]/30 transition-all">
                    <Compass size={22} className="text-[#e05e3f] mb-3" />
                    <h5 className="font-bold text-xs text-[#191816] mb-1">1. AI Navigator</h5>
                    <p className="text-[11px] text-[#191816]/60 leading-normal">Menerjemahkan peraturan menteri dan pasal hukum rumit ke bahasa sehari-hari secara akurat.</p>
                  </div>

                  <div className="bg-[#faf6f2] p-4 rounded-2xl border border-[#e05e3f]/10 hover:border-[#e05e3f]/30 transition-all">
                    <Sliders size={22} className="text-[#e05e3f] mb-3" />
                    <h5 className="font-bold text-xs text-[#191816] mb-1">2. DTKS Simulator</h5>
                    <p className="text-[11px] text-[#191816]/60 leading-normal">Pengecekan mandiri estimasi desil kemiskinan dan kelayakan program jaminan sosial nasional.</p>
                  </div>

                  <div className="bg-[#faf6f2] p-4 rounded-2xl border border-[#e05e3f]/10 hover:border-[#e05e3f]/30 transition-all">
                    <FileSpreadsheet size={22} className="text-[#e05e3f] mb-3" />
                    <h5 className="font-bold text-xs text-[#191816] mb-1">3. Birokrasi Generator</h5>
                    <p className="text-[11px] text-[#191816]/60 leading-normal">Penyusunan otomatis berkas-berkas pengajuan resmi (SKTM, Sanggahan Bansos) siap cetak.</p>
                  </div>
                </div>

                <div className="p-4 bg-[#e05e3f]/5 rounded-2xl border border-[#e05e3f]/10 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#e05e3f] shrink-0" />
                  <p className="text-[11px] text-[#191816]/75 leading-relaxed">
                    <strong>Pemberitahuan Sipil:</strong> SAHABAT AI melayani lebih dari 15.000 warga melalui platform rujukan hukum mandiri tanpa memungut biaya sepeser pun.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Stats Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-left">
          <div className="bg-[#e05e3f] text-white p-6 sm:p-8 rounded-3xl border border-[#e05e3f]/10">
            <span className="font-black text-3xl block">15.000+</span>
            <span className="text-xs font-semibold text-white/90 mt-1 block">Warga Memperoleh Informasi</span>
            <p className="text-[11px] text-white/70 mt-2 leading-relaxed">Memberantas asimetri informasi kependudukan dan memfasilitasi perlindungan hak-hak dasar sosial.</p>
          </div>
          <div className="bg-white text-[#191816] p-6 sm:p-8 rounded-3xl border border-[#e05e3f]/15">
            <span className="font-black text-3xl block text-[#e05e3f]">100% Aman</span>
            <span className="text-xs font-semibold text-[#191816]/80 mt-1 block">Privasi Sipil Terenkripsi</span>
            <p className="text-[11px] text-[#191816]/60 mt-2 leading-relaxed">Seluruh data yang Anda ketik diproses 100% di browser Anda, tanpa disimpan di database pihak ketiga.</p>
          </div>
          <div className="bg-[#faf6f2] text-[#191816] p-6 sm:p-8 rounded-3xl border border-[#eae4dc]">
            <span className="font-black text-3xl block text-[#191816]">2 Detik</span>
            <span className="text-xs font-semibold text-[#191816]/80 mt-1 block">Akurasi Pencocokan Regulasi</span>
            <p className="text-[11px] text-[#191816]/60 mt-2 leading-relaxed">Algoritma asisten hukum melacak landasan undang-undang Kemensos yang sah secara verbatim dan presisi.</p>
          </div>
        </div>
      </section>

      {/* Core Problem & Vision Section */}
      <section className="py-20 bg-white border-y border-[#e05e3f]/10 px-4 sm:px-6 lg:px-8" id="solusi-ai">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 flex flex-col gap-6 text-left">
            <h2 className="font-bold text-3xl sm:text-4xl tracking-tight leading-tight text-[#191816]">
              Menghentikan Kendala Birokrasi & Hak yang Tidak Tersalurkan
            </h2>
            <p className="text-[#191816]/75 text-xs sm:text-sm leading-relaxed">
              Jutaan warga prasejahtera kehilangan jaminan pangan, kesehatan, dan beasiswa sekolah hanya karena tidak memahami regulasi berbelit-belit, bingung menyusun draf administratif, serta merasa terintimidasi oleh kompleksitas birokrasi kelurahan.
            </p>
            <p className="text-[#191816]/70 text-xs sm:text-sm leading-relaxed">
              SAHABAT AI mengubah paradigma ini. Kami mengembalikan kekuatan hukum dan transparansi jaminan sosial langsung ke tangan masyarakat dengan landasan data kependudukan terbuka (Civic Tech) yang dapat diandalkan siapa saja.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="flex items-start gap-2.5 text-xs text-[#191816]/85">
                <CheckCircle2 size={16} className="text-[#e05e3f] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[#191816]">Bebas Ketakutan Hukum</strong>
                  <span className="text-[#191816]/60">Semua rujukan berdasarkan UU sah.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-[#191816]/85">
                <CheckCircle2 size={16} className="text-[#e05e3f] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[#191816]">Anti-Calo & Pungli</strong>
                  <span className="text-[#191816]/60">Warga mampu mandiri mengurus dokumen.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col gap-5">
            <div className="p-5 rounded-2xl bg-[#faf6f2] border border-[#e05e3f]/10 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-7 h-7 rounded-full bg-[#e05e3f]/10 flex items-center justify-center text-[#e05e3f]">
                  <Compass size={14} />
                </div>
                <h4 className="font-bold text-sm text-[#191816]">AI Rights Navigator</h4>
              </div>
              <p className="text-xs text-[#191816]/65 leading-relaxed">
                Asisten hukum yang menyederhanakan undang-undang. Cukup deskripsikan kesulitan Anda dalam bahasa santai, dan AI akan memetakan langsung jenis perlindungan hukum Kemensos yang relevan beserta rujukan pasalnya secara verbatim.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#faf6f2] border border-[#e05e3f]/10 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-7 h-7 rounded-full bg-[#e05e3f]/10 flex items-center justify-center text-[#e05e3f]">
                  <Sliders size={14} />
                </div>
                <h4 className="font-bold text-sm text-[#191816]">Eligibility DTKS Simulator</h4>
              </div>
              <p className="text-xs text-[#191816]/65 leading-relaxed">
                Kalkulasi potensi kelulusan pendaftaran bantuan (PKH, BPNT, KIP) berdasarkan standar desil kemiskinan pemerintah. Anda akan mengetahui kelayakan ekonomi sebelum mengajukan ke operator kelurahan.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#faf6f2] border border-[#e05e3f]/10 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-7 h-7 rounded-full bg-[#e05e3f]/10 flex items-center justify-center text-[#e05e3f]">
                  <FileSpreadsheet size={14} />
                </div>
                <h4 className="font-bold text-sm text-[#191816]">Auto-Birokrasi Document Generator</h4>
              </div>
              <p className="text-xs text-[#191816]/65 leading-relaxed">
                Membantu penyusunan otomatis draf resmi Surat Keterangan Tidak Mampu (SKTM) atau Surat Keberatan Bansos yang legal sesuai standar administrasi daerah, siap Anda unduh dan cetak secara mandiri.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Audience Info Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center" id="cara-kerja">
        <h2 className="font-bold text-3xl sm:text-4xl tracking-tight leading-tight text-[#191816] max-w-2xl mx-auto">
          Mendukung Kemandirian Sipil di Seluruh Sektor Masyarakat
        </h2>
        <p className="text-[#191816]/70 text-xs sm:text-sm mt-3 max-w-lg mx-auto">
          SAHABAT AI melayani berbagai pihak dalam menciptakan akurasi serta pemenuhan jaring pengaman sosial yang berkeadilan.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-4xl mx-auto">
          {[
            {
              icon: Users,
              title: "Warga Mandiri",
              description: "Tidak ada lagi asimetri informasi kependudukan atau keharusan bergantung pada calo. SAHABAT AI membantu Anda memahami jaminan sosial, mengecek kelayakan desil secara objektif."
            },
            {
              icon: HeartHandshake,
              title: "Relawan Sosial",
              description: "Bantu warga prasejahtera di pelosok kampung secara sistematis. Melalui portal informasi SAHABAT AI, relawan lapangan dapat merujuk dasar hukum sosial secara instan."
            },
            {
              icon: Layers,
              title: "Ketua RT / RW",
              description: "Gunakan panduan parameter SAHABAT AI untuk menjelaskan desil kemiskinan secara kuantitatif berdasarkan parameter DTKS resmi dan menghindari konflik sosial."
            },
            {
              icon: Building,
              title: "Dinas Sosial",
              description: "Mengurangi persentase error of exclusion di daerah. Dengan mengedukasi warga tentang kriteria legal, dinas sosial terbantu karena berkas yang masuk telah terverifikasi mandiri."
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
                BA
              </div>
              <span className="font-bold text-base text-white tracking-tight">
                SAHABAT AI<span className="text-[#e05e3f]">.</span>
              </span>
            </div>
            <p className="text-[11px] text-[#faf6f2]/55 text-center md:text-left max-w-xs mt-1 leading-normal">
              Gerakan demokratisasi perlindungan jaminan sosial warga prasejahtera Republik Indonesia berbasis data terbuka.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-[10px] font-mono text-white/50">
            <a href="#visi-misi" className="hover:text-white transition-colors">Visi Misi</a>
            <a href="#solusi-ai" className="hover:text-white transition-colors">Solusi AI</a>
            <a href="#cara-kerja" className="hover:text-white transition-colors">Cara Kerja</a>
          </div>
        </div>

        <div className="max-w-5xl mx-auto border-t border-white/5 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-[#faf6f2]/40 font-mono">
          <p>© 2026 SAHABAT AI. Terenkripsi AES 256-bit lokal. Seluruh hak cipta dilindungi.</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sistem Sipil Terintegrasi
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
