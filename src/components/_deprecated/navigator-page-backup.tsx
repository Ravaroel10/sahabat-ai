import { ChatInterface } from "@/components/chat/chat-interface";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, FileText, Clock } from "lucide-react";

export default function NavigatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Rights Navigator</h1>
        <p className="text-muted-foreground mt-2">
          Ceritakan situasi Anda dan AI akan membantu menemukan program bantuan yang sesuai
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💬 Obrolan dengan SAHABAT AI
              </CardTitle>
              <CardDescription>
                Jawab pertanyaan AI dengan sejujurnya untuk hasil yang lebih akurat
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ChatInterface />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                Informasi yang Bisa Dipercaya
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Semua rekomendasi dari SAHABAT AI didasarkan pada regulasi resmi:
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Permensos No. 1/2024 tentang PKH</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Permensos No. 2/2024 tentang BPNT</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>UU No. 40/2004 tentang SJSN</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Perpres No. 82/2018 tentang JKN</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Contoh Pertanyaan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">Coba tanyakan hal-hal seperti:</p>
              <div className="space-y-2">
                <div className="bg-muted rounded p-2 text-xs">
                  "Suami saya buruh bangunan jatuh dari perancah dan sekarang di rumah sakit"
                </div>
                <div className="bg-muted rounded p-2 text-xs">
                  "Saya petani dengan penghasilan Rp 500rb/bulan, punya 3 anak sekolah"
                </div>
                <div className="bg-muted rounded p-2 text-xs">
                  "Ibu saya berusia 70 tahun dan tinggal sendiri"
                </div>
                <div className="bg-muted rounded p-2 text-xs">
                  "Apakah saya bisa dapat bantuan jika tidak punya KTP?"
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Penting
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="text-yellow-800">
                SAHABAT AI memberikan informasi umum. Untuk kepastian kelayakan, 
                silakan hubungi kantor Dinas Sosial setempat atau cek langsung 
                di portal resmi pemerintah.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
