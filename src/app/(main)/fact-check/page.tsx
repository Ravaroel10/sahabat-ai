"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, ShieldAlert, CheckCircle, XCircle, Search, Share2, Download, FileText } from "lucide-react";

interface FactCheckResult {
  claim: string;
  verdict: "fact" | "hoax" | "partial";
  confidence: number;
  explanation: string;
  sources: string[];
  relatedOfficialInfo: string;
}

export default function FactCheckPage() {
  const [activeTab, setActiveTab] = useState("text");
  const [claim, setClaim] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const checkClaim = async (text: string) => {
    setIsChecking(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const lowerText = text.toLowerCase();
    
    // Mock analysis based on common claims
    let mockResult: FactCheckResult;
    
    if (lowerText.includes("bansos dihentikan") || lowerText.includes("bantuan sosial dihapus")) {
      mockResult = {
        claim: text,
        verdict: "hoax",
        confidence: 95,
        explanation: "Klaim ini tidak benar. Berdasarkan informasi resmi dari Kementerian Sosial, program bantuan sosial seperti PKH, BPNT, dan program lainnya continue berlanjut sesuai alokasi anggaran tahun berjalan.",
        sources: [
          "kemensos.go.id",
          "Permensos No. 1/2024",
          "Permensos No. 2/2024"
        ],
        relatedOfficialInfo: "Program Bansos continue berlanjut. Cek status penerima di: kemensos.go.id atau hubungi 119."
      };
    } else if (lowerText.includes("bpjs dihapus") || lowerText.includes("bpjs gratis untuk semua")) {
      mockResult = {
        claim: text,
        verdict: "partial",
        confidence: 70,
        explanation: "Klaim ini sebagian benar. JKN-PBI (BPJS Gratis) memang tersedia untuk masyarakat tidak mampu yang terdaftar dalam DTKS, namun tidak semua warga otomatis mendapatkannya.",
        sources: [
          "bpjs-kesehatan.go.id",
          "UU No. 40/2004 tentang SJSN",
          "Perpres No. 82/2018"
        ],
        relatedOfficialInfo: "Pendaftaran BPJS dapat dilakukan di kantor BPJS terdekat, puskesmas, atau melalui aplikasi Mobile JKN."
      };
    } else if (lowerText.includes("bansos langsung") || lowerText.includes("bansos langsung cair")) {
      mockResult = {
        claim: text,
        verdict: "hoax",
        confidence: 88,
        explanation: "Hati-hati dengan informasi seperti ini. Pencairan bansos melalui prosedur resmi dengan verifikasi data dan tidak ada yang namanya 'cair otomatis' tanpa verifikasi.",
        sources: [
          "kemensos.go.id",
          "PP No. 63/2021"
        ],
        relatedOfficialInfo: "Pastikan informasi pencairan bansos dari sumber resmi Kemensos. Laporkan jika ada permintaan uang untuk pencairan."
      };
    } else {
      mockResult = {
        claim: text,
        verdict: "partial",
        confidence: 50,
        explanation: "Kami tidak dapat memverifikasi klaim ini dengan pasti. Silakan hubungi sumber resmi terkait untuk konfirmasi.",
        sources: [
          "kemensos.go.id",
          "bpjs-kesehatan.go.id"
        ],
        relatedOfficialInfo: "Untuk informasi akurat, selalu merujuk ke website resmi Kemensos dan BPJS Kesehatan."
      };
    }
    
    setResult(mockResult);
    setIsChecking(false);
  };

  const handleTextCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (claim.trim()) {
      checkClaim(claim);
    }
  };

  const handleImageCheck = async () => {
    setIsChecking(true);
    
    // Simulate OCR + AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock result for uploaded image
    setResult({
      claim: "Screenshot yang diupload",
      verdict: "hoax",
      confidence: 85,
      explanation: "Teks dalam gambar ini mengandung klaim yang tidak terverifikasi. Informasi mengenai pencairan dana bansos memerlukan konfirmasi langsung dari kantor Kemensos atau Dinas Sosial setempat.",
      sources: [
        "kemensos.go.id",
        "hotline kemensos: 119"
      ],
      relatedOfficialInfo: "Jangan percaya informasi yang meminta Anda mentransfer uang untuk mendapatkan bansos."
    });
    
    setIsChecking(false);
  };

  const getVerdictConfig = (verdict: string) => {
    switch (verdict) {
      case "fact":
        return {
          icon: <CheckCircle className="h-8 w-8" />,
          label: "Fakta",
          color: "bg-green-500",
          bgColor: "bg-green-50 border-green-200",
          textColor: "text-green-800"
        };
      case "hoax":
        return {
          icon: <XCircle className="h-8 w-8" />,
          label: "Hoaks",
          color: "bg-red-500",
          bgColor: "bg-red-50 border-red-200",
          textColor: "text-red-800"
        };
      default:
        return {
          icon: <ShieldAlert className="h-8 w-8" />,
          label: "Sebagian Benar",
          color: "bg-yellow-500",
          bgColor: "bg-yellow-50 border-yellow-200",
          textColor: "text-yellow-800"
        };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Fact Checker</h1>
        <p className="text-muted-foreground mt-2">
          Verifikasi kebenaran informasi tentang bantuan sosial yang Anda terima
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text">
            <FileText className="h-4 w-4 mr-2" />
            Cek Teks
          </TabsTrigger>
          <TabsTrigger value="image">
            <Upload className="h-4 w-4 mr-2" />
            Upload Gambar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle>Masukkan Klaim</CardTitle>
              <CardDescription>
                Ketik atau tempel informasi yang ingin Anda verifikasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTextCheck} className="space-y-4">
                <Textarea
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  placeholder="Contoh: 'Bansos dihentikan mulai bulan depan', 'BPJS dihapus untuk orang kaya', 'Bansos langsung cair tanpa verifikasi'"
                  rows={4}
                  className="resize-none"
                />
                <Button type="submit" disabled={!claim.trim() || isChecking} className="w-full">
                  {isChecking ? (
                    <>
                      <Search className="h-4 w-4 mr-2 animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="h-4 w-4 mr-2" />
                      Verifikasi Klaim
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="image">
          <Card>
            <CardHeader>
              <CardTitle>Upload Screenshot</CardTitle>
              <CardDescription>
                Upload tangkapan layar informasi yang ingin Anda verifikasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              
              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Klik untuk upload gambar atau drag & drop
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Format: JPG, PNG (maks. 5MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden border">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-h-64 object-contain bg-muted"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                    >
                      Hapus
                    </Button>
                  </div>
                  <Button 
                    onClick={handleImageCheck} 
                    disabled={isChecking} 
                    className="w-full"
                  >
                    {isChecking ? (
                      <>
                        <Search className="h-4 w-4 mr-2 animate-spin" />
                        Memproses Gambar...
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-4 w-4 mr-2" />
                        Verifikasi Gambar
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results */}
      {result && (
        <Card className={getVerdictConfig(result.verdict).bgColor}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-full ${getVerdictConfig(result.verdict).color} flex items-center justify-center text-white`}>
                  {getVerdictConfig(result.verdict).icon}
                </div>
                <div>
                  <Badge className={`${getVerdictConfig(result.verdict).color} text-white mb-1`}>
                    {getVerdictConfig(result.verdict).label}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Tingkat kepercayaan: {result.confidence}%
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-1" />
                  Bagikan
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Simpan
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Klaim:</h4>
              <p className="text-sm bg-white/50 p-3 rounded">{result.claim}</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Penjelasan:</h4>
              <p className="text-sm">{result.explanation}</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Informasi Resmi:</h4>
              <p className="text-sm bg-white/50 p-3 rounded border-l-4 border-primary">
                {result.relatedOfficialInfo}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Sumber Verifikasi:</h4>
              <ul className="text-sm space-y-1">
                {result.sources.map((source, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{source}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Tips Keamanan</h4>
              <ul className="text-sm text-blue-800 mt-1 space-y-1">
                <li>• Jangan percaya informasi bansos dari media sosial tidak resmi</li>
                <li>• Tidak ada bansos yang meminta pembayaran untuk pencairan</li>
                <li>• Selalu cek informasi di website resmi: kemensos.go.id</li>
                <li>• Laporkan informasi hoaks ke hotline Kemensos: 119</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
