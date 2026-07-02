"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { calculateAllEligibilities, UserProfile, getStatusLabel, getStatusColor } from "@/lib/eligibility";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, Users, Wallet, GraduationCap, Heart, Building } from "lucide-react";

export default function ScannerPage() {
  const [profile, setProfile] = useState<UserProfile>({
    occupation: "",
    monthlyIncome: 0,
    familySize: 1,
    hasChildren: false,
    hasElderly: false,
    hasPregnant: false,
    hasDisability: false,
    hasStudent: false,
    location: "",
    hasBpjs: false,
    isNaturalDisasterVictim: false,
    hasWorkAccident: false
  });
  const [results, setResults] = useState<ReturnType<typeof calculateAllEligibilities>>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eligibilityResults = calculateAllEligibilities(profile);
    setResults(eligibilityResults);
    setShowResults(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "highly_eligible":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "eligible":
        return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
      case "possibly_eligible":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Eligibility Scanner</h1>
        <p className="text-muted-foreground mt-2">
          Cek kelayakan Anda untuk berbagai program bantuan sosial pemerintah
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Anda</CardTitle>
            <CardDescription>
              Isi data di bawah ini untuk melihat program yang mungkin cocok untuk Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="occupation">Pekerjaan</Label>
                  <Select 
                    value={profile.occupation} 
                    onValueChange={(v) => setProfile({...profile, occupation: v || ""})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pekerjaan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_working">Tidak Bekerja</SelectItem>
                      <SelectItem value="petani">Petani</SelectItem>
                      <SelectItem value="buruh">Buruh/Tukang</SelectItem>
                      <SelectItem value="pedagang">Pedagang</SelectItem>
                      <SelectItem value="pns">PNS</SelectItem>
                      <SelectItem value="wiraswasta">Wiraswasta</SelectItem>
                      <SelectItem value="freelance">Freelance/Kerja Lepas</SelectItem>
                      <SelectItem value="ibu_rumah_tangga">Ibu Rumah Tangga</SelectItem>
                      <SelectItem value="lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="income">Penghasilan per Bulan (Rp)</Label>
                  <Input
                    id="income"
                    type="number"
                    placeholder="Contoh: 500000"
                    value={profile.monthlyIncome || ""}
                    onChange={(e) => setProfile({...profile, monthlyIncome: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="familySize">Jumlah Anggota Keluarga</Label>
                  <Input
                    id="familySize"
                    type="number"
                    min={1}
                    value={profile.familySize}
                    onChange={(e) => setProfile({...profile, familySize: parseInt(e.target.value) || 1})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Domisili</Label>
                  <Input
                    id="location"
                    placeholder="Contoh: Jakarta, Desa terpencil, dll"
                    value={profile.location}
                    onChange={(e) => setProfile({...profile, location: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base">Kondisi Keluarga</Label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.hasChildren}
                      onChange={(e) => setProfile({...profile, hasChildren: e.target.checked})}
                      className="rounded"
                    />
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Punya Anak</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.hasElderly}
                      onChange={(e) => setProfile({...profile, hasElderly: e.target.checked})}
                      className="rounded"
                    />
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Ada Lansia</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.hasPregnant}
                      onChange={(e) => setProfile({...profile, hasPregnant: e.target.checked})}
                      className="rounded"
                    />
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">Ada Ibu Hamil</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.hasStudent}
                      onChange={(e) => setProfile({...profile, hasStudent: e.target.checked})}
                      className="rounded"
                    />
                    <GraduationCap className="h-4 w-4" />
                    <span className="text-sm">Anak Sekolah</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.hasDisability}
                      onChange={(e) => setProfile({...profile, hasDisability: e.target.checked})}
                      className="rounded"
                    />
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Penyandang Disabilitas</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.hasBpjs}
                      onChange={(e) => setProfile({...profile, hasBpjs: e.target.checked})}
                      className="rounded"
                    />
                    <Building className="h-4 w-4" />
                    <span className="text-sm">Punya BPJS</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base">Situasi Khusus</Label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.isNaturalDisasterVictim}
                      onChange={(e) => setProfile({...profile, isNaturalDisasterVictim: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">Terdampak Bencana Alam</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.hasWorkAccident}
                      onChange={(e) => setProfile({...profile, hasWorkAccident: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">Kecelakaan Kerja</span>
                  </label>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Cek Kelayakan <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {!showResults ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Lihat Hasil</h3>
                <p className="text-muted-foreground text-sm">
                  Isi formulir dan klik "Cek Kelayakan" untuk melihat program yang cocok untuk Anda
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Hasil Eligibility</h2>
                <Badge variant="outline">
                  {results.filter(r => r.score >= 50).length} program cocok
                </Badge>
              </div>

              {results.slice(0, 6).map((result) => (
                <Card key={result.programId} className={result.score >= 50 ? "border-primary" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <CardTitle className="text-lg">
                          {result.program.acronym}
                        </CardTitle>
                      </div>
                      <Badge className={getStatusColor(result.status)}>
                        {getStatusLabel(result.status)}
                      </Badge>
                    </div>
                    <CardDescription>{result.program.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Skor Kelayakan</span>
                        <span className="font-medium">{result.score}%</span>
                      </div>
                      <Progress value={result.score} className="h-2" />
                    </div>
                    
                    {result.reasons.length > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Alasan:</span>
                        <ul className="mt-1 space-y-1">
                          {result.reasons.slice(0, 3).map((reason, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-green-500">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.missingRequirements.length > 0 && (
                      <div className="text-sm bg-yellow-50 p-2 rounded">
                        <span className="text-yellow-700">⚠️ Syarat yang belum dipenuhi:</span>
                        <ul className="mt-1">
                          {result.missingRequirements.map((req, i) => (
                            <li key={i} className="text-yellow-700 text-xs">• {req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
