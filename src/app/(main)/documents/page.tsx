"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getAllDocumentTemplates, DocumentTemplate } from "@/lib/document-templates";
import { trackJourney } from "@/lib/analytics";
import { FileText, Download, Eye, CheckCircle, Clock, AlertCircle, MessageCircle, X, Search, FileCheck } from "lucide-react";
import { downloadPDF, mapFormDataToPDFData, generatePDFPreviewURL } from "@/lib/pdf-generator";
import type { PDFTemplateType } from "@/components/documents/pdf-templates";

function DocumentsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [savedFormStates, setSavedFormStates] = useState<Record<string, Record<string, string>>>({});
  const [generatedDoc, setGeneratedDoc] = useState<string | null>(null);
  const [pdfPreviewURL, setPdfPreviewURL] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("form");
  const [programContext, setProgramContext] = useState<{
    programId?: string;
    programName?: string;
  }>({});

  const templates = getAllDocumentTemplates();
  
  // Filter templates based on search query
  const filteredTemplates = templates.filter((template) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.type.toLowerCase().includes(query)
    );
  });

  // Load program context from URL parameters
  useEffect(() => {
    const programId = searchParams.get('programId');
    const programName = searchParams.get('programName');
    const income = searchParams.get('income');
    const province = searchParams.get('province');
    const city = searchParams.get('city');

    if (programId && programName) {
      setProgramContext({ programId, programName });

      // Pre-fill form data if available
      if (income) setFormData(prev => ({ ...prev, penghasilan: income }));
      if (province && city) {
        setFormData(prev => ({ ...prev, alamat: `${city}, ${province}` }));
      }

      // Track market→documents arrival (task 9.12)
      trackJourney('market_to_doc', { programId, programName });
    }
  }, [searchParams]);

  // Cleanup PDF preview URL on unmount or when new PDF is generated
  useEffect(() => {
    return () => {
      if (pdfPreviewURL) {
        URL.revokeObjectURL(pdfPreviewURL);
      }
    };
  }, [pdfPreviewURL]);

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      // Save current form data before switching
      if (selectedTemplate) {
        setSavedFormStates(prev => ({
          ...prev,
          [selectedTemplate.id]: formData
        }));
      }
      
      setSelectedTemplate(template);
      
      // Restore saved form data for the new template
      setFormData(savedFormStates[templateId] || {});
      setGeneratedDoc(null);
      setPdfPreviewURL(null);
      setActiveTab("form");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateDocument = async () => {
    if (!selectedTemplate) return;
    
    setIsGenerating(true);
    
    try {
      // Map form data to PDF data format
      const pdfData = mapFormDataToPDFData(formData, selectedTemplate.type as PDFTemplateType);
      
      // Generate PDF preview URL
      const previewURL = await generatePDFPreviewURL(pdfData);
      setPdfPreviewURL(previewURL);
      
      // Also keep the text version for backward compatibility
      let content = selectedTemplate.content;
      for (const [key, value] of Object.entries(formData)) {
        content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), value || `[${key}]`);
      }
      setGeneratedDoc(content);
      
      // Auto switch to preview tab
      setActiveTab("preview");
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Terjadi kesalahan saat membuat PDF. Silakan coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadDocument = async () => {
    if (!selectedTemplate || !generatedDoc) return;
    
    try {
      // Map form data to PDF data format
      const pdfData = mapFormDataToPDFData(formData, selectedTemplate.type as PDFTemplateType);
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${selectedTemplate.name.replace(/\s+/g, '-')}-${timestamp}.pdf`;
      
      // Download PDF
      await downloadPDF(pdfData, filename);
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Terjadi kesalahan saat mengunduh PDF. Silakan coba lagi.');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Auto-Birokrasi</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Generate dokumen yang diperlukan untuk pendaftaran bantuan sosial secara otomatis
          </p>
          {programContext.programName && (
            <Badge variant="outline" className="mt-2 text-xs sm:text-sm">
              Untuk: {programContext.programName}
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="default"
          onClick={() => router.push('/chat')}
          className="shrink-0 w-full sm:w-auto"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Tanya AI
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="space-y-1.5 pb-4">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <CardTitle className="text-base sm:text-lg">Template Dokumen</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Pilih template dokumen yang ingin Anda buat
                </CardDescription>
              </div>
              {searchQuery && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {filteredTemplates.length} hasil
                </Badge>
              )}
            </div>
            {/* Search Input */}
            <div className="pt-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Cari template..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs sm:text-sm h-9 pl-9 sm:pl-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Tidak ada template yang cocok dengan pencarian "{searchQuery}"
                </p>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id 
                      ? "border-primary bg-primary/5" 
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{template.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          {!selectedTemplate ? (
            <CardContent className="flex items-center justify-center py-16 sm:py-24">
              <div className="text-center px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-2">Pilih Template</h3>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Pilih template <span className="lg:inline hidden">di samping</span><span className="lg:hidden">di atas</span> untuk mulai membuat dokumen
                </p>
              </div>
            </CardContent>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <CardHeader className="pb-0 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base sm:text-lg">{selectedTemplate.name}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{selectedTemplate.description}</CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Draft
                  </Badge>
                </div>
                <TabsList className="grid w-full grid-cols-2 h-10 bg-muted/50 p-1 rounded-lg">
                  <TabsTrigger 
                    value="form" 
                    className="text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    Formulir
                  </TabsTrigger>
                  <TabsTrigger 
                    value="preview" 
                    disabled={!generatedDoc} 
                    className="text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm disabled:opacity-50"
                  >
                    Preview
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="pt-4 sm:pt-6">
                <TabsContent value="form" className="space-y-4 mt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {selectedTemplate.fields.map((field) => (
                      <div key={field} className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor={field} className="capitalize text-xs sm:text-sm">
                          {field.replace(/_/g, " ")}
                        </Label>
                        {field === "alamat" || field === "alasan_mernerlukan_bantuan" || field === "detail_aduan" || field === "keterangan_tambahan" || field === "tanggapan_yang_diharapkan" ? (
                          <Textarea
                            id={field}
                            value={formData[field] || ""}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            placeholder={`Masukkan ${field.replace(/_/g, " ")}...`}
                            rows={3}
                            className="text-xs sm:text-sm"
                          />
                        ) : (
                          <Input
                            id={field}
                            type={field.includes("tanggal") || field.includes("date") ? "date" : "text"}
                            value={formData[field] || ""}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            placeholder={`Masukkan ${field.replace(/_/g, " ")}...`}
                            className="text-xs sm:text-sm"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2 sm:pt-4">
                    <Button 
                      onClick={generateDocument} 
                      disabled={isGenerating}
                      className="flex-1 text-xs sm:text-sm"
                      size="default"
                    >
{isGenerating ? (
                        <>
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                          Membuat PDF...
                        </>
                      ) : (
                        <>
                          <FileCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                          Generate PDF
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="mt-0">
                  {generatedDoc && (
                    <div className="space-y-3 sm:space-y-4">
                      {/* PDF Preview */}
                      {pdfPreviewURL ? (
                        <div className="border rounded-lg overflow-hidden bg-gray-100">
                          <div className="flex items-center gap-2 bg-white border-b p-2 text-xs sm:text-sm text-muted-foreground">
                            <FileCheck className="h-4 w-4 text-green-600" />
                            <span>Preview PDF - Dokumen Resmi Siap Cetak</span>
                          </div>
                          <div className="bg-gray-100 p-2">
                            <iframe
                              src={pdfPreviewURL}
                              className="w-full h-[500px] sm:h-[600px] border-0 rounded"
                              title="PDF Preview"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="bg-muted p-3 sm:p-4 rounded-lg font-mono text-xs sm:text-sm whitespace-pre-wrap max-h-96 overflow-auto">
                          {generatedDoc}
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button onClick={downloadDocument} className="flex-1 text-xs sm:text-sm" size="default">
                          <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                          Download PDF
                        </Button>
                        <Button variant="outline" onClick={() => { setGeneratedDoc(null); setPdfPreviewURL(null); setActiveTab("form"); }} className="flex-1 text-xs sm:text-sm" size="default">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                          Edit Kembali
                        </Button>
                      </div>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                          <div className="text-xs text-yellow-800">
                            <p className="font-medium mb-1">Catatan Penting:</p>
                            <p>PDF ini adalah draft yang perlu ditandatangani dan distempel resmi oleh pejabat berwenang (Lurah/Camat) agar sah secara hukum.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          )}
        </Card>
      </div>

      {/* Info Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mt-0.5 shrink-0" />
            <div className="space-y-1.5">
              <h4 className="font-medium text-blue-900 text-sm sm:text-base">Tips Penggunaan</h4>
              <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                <li>• Isi formulir dengan data yang benar dan lengkap</li>
                <li>• Dokumen akan digenerate dalam format PDF profesional</li>
                <li>• Preview PDF sebelum mengunduh untuk memastikan semua data benar</li>
                <li>• PDF yang dihasilkan menggunakan format surat resmi pemerintah Indonesia</li>
                <li>• Dokumen perlu ditandatangani dan distempel resmi untuk menjadi sah</li>
                <li>• Hubungi kelurahan/kecamatan setempat untuk validasi lebih lanjut</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-center py-24">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    }>
      <DocumentsPageContent />
    </Suspense>
  );
}
