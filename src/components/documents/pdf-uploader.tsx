"use client"

/**
 * PDF Uploader Component
 * 
 * Provides a drag-and-drop interface for uploading PDF files with validation.
 * Features:
 * - Drag-and-drop zone with visual feedback
 * - File picker fallback for accessibility
 * - File type validation (PDF only)
 * - File size validation (5MB maximum)
 * - Progress indicator during upload and processing
 * - Preview of extracted PDF form fields before confirmation
 * - Guidance messages for PDFs without fillable fields
 * - Clear error messages in Indonesian
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.9
 */

import * as React from "react"
import { Upload, FileText, X, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { validatePdf, type PdfProcessingError } from "@/lib/pdf-processing/field-extractor"

interface PdfFormField {
  name: string
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature'
  value?: string
  defaultValue?: string
  options?: string[] // For dropdown/radio fields
  required?: boolean
  readOnly?: boolean
}

export interface CustomPdfTemplate {
  id: string
  name: string
  uploadedAt: Date
  fields: PdfFormField[]
  fileData: ArrayBuffer
}

interface PdfUploaderProps {
  onUploadSuccess: (template: CustomPdfTemplate) => void
  onUploadError: (error: string) => void
  maxSizeMB?: number // Default: 5MB
  className?: string
}

type UploadState = 'idle' | 'dragging' | 'uploading' | 'processing' | 'preview' | 'success' | 'error'

export function PdfUploader({
  onUploadSuccess,
  onUploadError,
  maxSizeMB = 5,
  className,
}: PdfUploaderProps) {
  const [state, setState] = React.useState<UploadState>('idle')
  const [progress, setProgress] = React.useState(0)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string>('')
  const [dragCounter, setDragCounter] = React.useState(0)
  const [previewTemplate, setPreviewTemplate] = React.useState<CustomPdfTemplate | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => prev + 1)
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setState('dragging')
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => {
      const newCount = prev - 1
      if (newCount === 0) {
        setState('idle')
      }
      return newCount
    })
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(0)
    setState('idle')

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  // Handle file selection from input
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  // Validate and process the file
  const handleFile = async (file: File) => {
    setSelectedFile(file)
    setErrorMessage('')
    setState('uploading')
    setProgress(0)

    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await readFileAsArrayBuffer(file)
      setProgress(30)

      // Validate PDF
      const validation = validatePdf(arrayBuffer, maxSizeMB)
      setProgress(50)

      if (!validation.valid) {
        setState('error')
        setErrorMessage(validation.error || 'File tidak valid')
        onUploadError(validation.error || 'File tidak valid')
        return
      }

      // Import the field extraction function dynamically
      setState('processing')
      setProgress(60)
      
      const { extractPdfFormFields, hasFormFields } = await import('@/lib/pdf-processing/field-extractor')
      
      setProgress(70)

      // Check if PDF has form fields
      const hasForms = await hasFormFields(arrayBuffer)
      setProgress(85)

      if (!hasForms) {
        setState('error')
        const noFieldsMessage = 'PDF ini tidak punya kolom yang bisa diisi. Butuh bantuan membuat PDF dengan kolom isian?'
        setErrorMessage(noFieldsMessage)
        onUploadError(noFieldsMessage)
        return
      }

      // Extract form fields
      const fields = await extractPdfFormFields(arrayBuffer)
      setProgress(95)

      // Create template object
      const template: CustomPdfTemplate = {
        id: crypto.randomUUID(),
        name: file.name,
        uploadedAt: new Date(),
        fields,
        fileData: arrayBuffer,
      }

      setProgress(100)
      
      // Show preview of extracted fields before confirmation
      setPreviewTemplate(template)
      setState('preview')

    } catch (error) {
      setState('error')
      let errorMsg = 'Gagal membaca PDF. Coba file lain atau gunakan template bawaan'
      
      if (error instanceof Error) {
        // Handle specific error messages
        if (error.message.includes('password')) {
          errorMsg = 'PDF ini dilindungi password. Silakan buka password dulu'
        } else if (error.message.includes('rusak') || error.message.includes('corrupted')) {
          errorMsg = 'File PDF rusak atau tidak bisa dibaca'
        }
      }
      
      setErrorMessage(errorMsg)
      onUploadError(errorMsg)
    }
  }

  // Helper function to read file as ArrayBuffer
  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'))
        }
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(file)
    })
  }

  // Reset the uploader
  const handleReset = () => {
    setState('idle')
    setSelectedFile(null)
    setErrorMessage('')
    setProgress(0)
    setPreviewTemplate(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Confirm and use the uploaded template
  const handleConfirm = () => {
    if (previewTemplate) {
      setState('success')
      onUploadSuccess(previewTemplate)
    }
  }

  // Trigger file input click
  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const isProcessing = state === 'uploading' || state === 'processing'
  const showProgress = isProcessing || state === 'preview'

  return (
    <div className={cn("w-full", className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileInputChange}
        className="sr-only"
        aria-label="Pilih file PDF"
      />

      {/* Drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
          state === 'dragging' && "border-primary bg-primary/5",
          state === 'idle' && "border-border hover:border-primary/50 hover:bg-muted/50",
          state === 'error' && "border-destructive bg-destructive/5",
          state === 'success' && "border-primary bg-primary/5",
          isProcessing && "pointer-events-none opacity-60"
        )}
      >
        {/* Icon */}
        <div className="mb-4">
          {state === 'error' && (
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          )}
          {(state === 'success' || state === 'preview') && (
            <div className="rounded-full bg-primary/10 p-3">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
          )}
          {(state === 'idle' || state === 'dragging') && (
            <div className={cn(
              "rounded-full bg-muted p-3 transition-colors",
              state === 'dragging' && "bg-primary/10"
            )}>
              <Upload className={cn(
                "h-8 w-8 text-muted-foreground transition-colors",
                state === 'dragging' && "text-primary"
              )} />
            </div>
          )}
          {isProcessing && selectedFile && (
            <div className="rounded-full bg-primary/10 p-3">
              <FileText className="h-8 w-8 text-primary" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="text-center space-y-2">
          {state === 'idle' && (
            <>
              <p className="text-sm font-medium">
                Tarik file PDF ke sini
              </p>
              <p className="text-xs text-muted-foreground">
                atau klik tombol di bawah untuk pilih file
              </p>
              <p className="text-xs text-muted-foreground">
                Maksimal {maxSizeMB}MB
              </p>
            </>
          )}

          {state === 'dragging' && (
            <p className="text-sm font-medium text-primary">
              Lepas file di sini
            </p>
          )}

          {isProcessing && selectedFile && (
            <>
              <p className="text-sm font-medium">
                {state === 'uploading' ? 'Mengunggah...' : 'Memproses...'}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedFile.name}
              </p>
            </>
          )}

          {state === 'preview' && previewTemplate && (
            <>
              <p className="text-sm font-medium text-primary">
                PDF berhasil diproses!
              </p>
              <p className="text-xs text-muted-foreground">
                {previewTemplate.name}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Ditemukan {previewTemplate.fields.length} kolom isian
              </p>
            </>
          )}

          {state === 'success' && selectedFile && (
            <>
              <p className="text-sm font-medium text-primary">
                Template siap digunakan!
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedFile.name}
              </p>
            </>
          )}

          {state === 'error' && (
            <>
              <p className="text-sm font-medium text-destructive">
                Gagal mengunggah
              </p>
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  {selectedFile.name}
                </p>
              )}
            </>
          )}
        </div>

        {/* Progress bar */}
        {showProgress && state !== 'preview' && (
          <div className="w-full mt-4" aria-live="polite">
            <Progress value={progress} className="w-full">
              <ProgressValue />
            </Progress>
          </div>
        )}

        {/* Preview extracted fields */}
        {state === 'preview' && previewTemplate && (
          <div className="w-full mt-4 max-h-64 overflow-y-auto">
            <div className="rounded-md border bg-muted/30 p-4 text-left">
              <h3 className="text-sm font-semibold mb-3">Kolom yang ditemukan:</h3>
              <ul className="space-y-2 text-xs">
                {previewTemplate.fields.slice(0, 10).map((field, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium">{field.name}</span>
                      {' '}
                      <span className="text-muted-foreground">
                        ({field.type === 'text' ? 'Teks' : 
                          field.type === 'checkbox' ? 'Centang' :
                          field.type === 'radio' ? 'Pilihan' :
                          field.type === 'dropdown' ? 'Menu' :
                          field.type === 'signature' ? 'Tanda tangan' : field.type})
                      </span>
                    </div>
                  </li>
                ))}
                {previewTemplate.fields.length > 10 && (
                  <li className="text-muted-foreground italic">
                    ... dan {previewTemplate.fields.length - 10} kolom lainnya
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Error message */}
        {state === 'error' && errorMessage && (
          <div
            className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        {/* Buttons */}
        <div className="mt-6 flex gap-2">
          {(state === 'idle' || state === 'dragging') && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBrowseClick}
              disabled={isProcessing}
            >
              Pilih File
            </Button>
          )}

          {state === 'preview' && (
            <>
              <Button
                type="button"
                onClick={handleConfirm}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Gunakan Template Ini
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
              >
                <X className="mr-2 h-4 w-4" />
                Batal
              </Button>
            </>
          )}

          {(state === 'error' || state === 'success') && (
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
            >
              <X className="mr-2 h-4 w-4" />
              {state === 'success' ? 'Unggah Lagi' : 'Coba Lagi'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
