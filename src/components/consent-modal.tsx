"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Lock, Eye } from "lucide-react";

interface ConsentModalProps {
  onAccept: (consent: { analytics: boolean; chatHistory: boolean }) => void;
}

export function ConsentModal({ onAccept }: ConsentModalProps) {
  const [analytics, setAnalytics] = useState(true);
  const [chatHistory, setChatHistory] = useState(true);

  const handleAccept = () => {
    onAccept({ analytics, chatHistory });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Kebijakan Privasi</CardTitle>
              <CardDescription>Persetujuan Pemrosesan Data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            SAHABAT AI menghargai privasi Anda. Berikut adalah jenis data yang kami proses:
          </p>

          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-muted rounded-lg">
              <Checkbox 
                id="analytics" 
                checked={analytics} 
                onCheckedChange={(checked) => setAnalytics(checked as boolean)}
              />
              <div className="space-y-1">
                <label htmlFor="analytics" className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Analitik Anonim
                </label>
                <p className="text-xs text-muted-foreground">
                  Kami mengumpulkan data statistik anonim untuk meningkatkan kualitas layanan AI kami. 
                  Data ini tidak mengandung informasi identitas pribadi.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-muted rounded-lg">
              <Checkbox 
                id="chatHistory" 
                checked={chatHistory} 
                onCheckedChange={(checked) => setChatHistory(checked as boolean)}
              />
              <div className="space-y-1">
                <label htmlFor="chatHistory" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Riwayat Chat
                </label>
                <p className="text-xs text-muted-foreground">
                  Menyimpan riwayat percakapan Anda dengan AI untuk memberikan rekomendasi yang lebih akurat 
                  dan kontinuitas layanan.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Catatan:</strong> Anda dapat mengubah preferensi ini kapan saja melalui pengaturan akun. 
              Data sensitif seperti NIK dan informasi keluarga tidak pernah dibagikan ke pihak ketiga.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={handleAccept} className="w-full">
            Setuju dan Lanjutkan
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Dengan melanjutkan, Anda menyetujui{" "}
            <a href="#" className="underline">Kebijakan Privasi</a> dan{" "}
            <a href="#" className="underline">Syarat Penggunaan</a> kami.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
