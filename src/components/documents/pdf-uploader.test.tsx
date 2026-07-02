/**
 * Unit tests for PdfUploader component
 * 
 * Tests:
 * - Component rendering and UI states
 * - File validation (type, size)
 * - Drag-and-drop interactions
 * - File picker interactions
 * - Error handling and messages
 * - Progress indication
 * - Preview extracted fields before confirmation
 * - Accessibility attributes
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.9
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PdfUploader } from './pdf-uploader';
import * as fieldExtractor from '@/lib/pdf-processing/field-extractor';

// Mock the pdf-processing module
jest.mock('@/lib/pdf-processing/field-extractor', () => ({
  validatePdf: jest.fn(),
  extractPdfFormFields: jest.fn(),
  hasFormFields: jest.fn(),
  PdfProcessingError: class PdfProcessingError extends Error {
    constructor(message: string, public cause?: unknown) {
      super(message);
      this.name = 'PdfProcessingError';
    }
  },
}));

// Helper function to create a mock File
const createMockFile = (
  name: string,
  size: number,
  type: string
): File => {
  const blob = new Blob(['a'.repeat(size)], { type });
  return new File([blob], name, { type });
};

// Helper function to create a mock PDF ArrayBuffer
const createMockPdfArrayBuffer = (size: number = 1024): ArrayBuffer => {
  const buffer = new ArrayBuffer(size);
  const view = new Uint8Array(buffer);
  // Add PDF magic number
  view[0] = 0x25; // %
  view[1] = 0x50; // P
  view[2] = 0x44; // D
  view[3] = 0x46; // F
  view[4] = 0x2D; // -
  return buffer;
};

describe('PdfUploader', () => {
  const mockOnUploadSuccess = jest.fn();
  const mockOnUploadError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (fieldExtractor.validatePdf as jest.Mock).mockReturnValue({ valid: true });
    (fieldExtractor.hasFormFields as jest.Mock).mockResolvedValue(true);
    (fieldExtractor.extractPdfFormFields as jest.Mock).mockResolvedValue([
      {
        name: 'nama',
        type: 'text',
        value: '',
        readOnly: false,
      },
    ]);

    // Mock FileReader
    const mockFileReader = {
      readAsArrayBuffer: jest.fn(),
      onload: null as any,
      onerror: null as any,
      result: null as any,
    };

    global.FileReader = jest.fn(() => mockFileReader) as any;

    // Setup FileReader to simulate successful read
    mockFileReader.readAsArrayBuffer.mockImplementation(function (this: any) {
      setTimeout(() => {
        this.result = createMockPdfArrayBuffer(1024);
        if (this.onload) {
          this.onload();
        }
      }, 0);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders upload zone in idle state', () => {
      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      expect(screen.getByText('Tarik file PDF ke sini')).toBeInTheDocument();
      expect(screen.getByText(/atau klik tombol di bawah/i)).toBeInTheDocument();
      expect(screen.getByText(/Maksimal 5MB/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pilih file/i })).toBeInTheDocument();
    });

    test('renders with custom maxSizeMB', () => {
      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
          maxSizeMB={10}
        />
      );

      expect(screen.getByText(/Maksimal 10MB/i)).toBeInTheDocument();
    });

    test('renders with custom className', () => {
      const { container } = render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('File Picker Interaction', () => {
    test('opens file picker when button is clicked', () => {
      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const button = screen.getByRole('button', { name: /pilih file/i });
      const fileInput = screen.getByLabelText('Pilih file PDF') as HTMLInputElement;
      
      const clickSpy = jest.spyOn(fileInput, 'click');
      fireEvent.click(button);

      expect(clickSpy).toHaveBeenCalled();
    });

    test('accepts only PDF files', () => {
      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const fileInput = screen.getByLabelText('Pilih file PDF') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('accept', '.pdf,application/pdf');
    });
  });

  describe('Drag and Drop Interaction', () => {
    test('shows dragging state when file is dragged over', () => {
      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const dropZone = screen.getByText('Tarik file PDF ke sini').closest('div');
      
      const dragEnterEvent = new Event('dragenter', { bubbles: true });
      Object.defineProperty(dragEnterEvent, 'dataTransfer', {
        value: { items: [{ kind: 'file' }] },
      });

      fireEvent(dropZone!, dragEnterEvent);

      expect(screen.getByText('Lepas file di sini')).toBeInTheDocument();
    });

    test('returns to idle state when drag leaves', () => {
      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const dropZone = screen.getByText('Tarik file PDF ke sini').closest('div');
      
      // Enter drag
      const dragEnterEvent = new Event('dragenter', { bubbles: true });
      Object.defineProperty(dragEnterEvent, 'dataTransfer', {
        value: { items: [{ kind: 'file' }] },
      });
      fireEvent(dropZone!, dragEnterEvent);

      // Leave drag
      const dragLeaveEvent = new Event('dragleave', { bubbles: true });
      Object.defineProperty(dragLeaveEvent, 'dataTransfer', {
        value: { items: [] },
      });
      fireEvent(dropZone!, dragLeaveEvent);

      expect(screen.getByText('Tarik file PDF ke sini')).toBeInTheDocument();
    });
  });

  describe('File Validation', () => {
    test('validates file size - rejects files over limit', async () => {
      (fieldExtractor.validatePdf as jest.Mock).mockReturnValue({
        valid: false,
        error: 'File terlalu besar. Maksimal 5MB. File kamu: 6.00MB',
      });

      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
          maxSizeMB={5}
        />
      );

      const fileInput = screen.getByLabelText('Pilih file PDF') as HTMLInputElement;
      const largeFile = createMockFile('large.pdf', 6 * 1024 * 1024, 'application/pdf');

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(screen.getByText(/File terlalu besar/i)).toBeInTheDocument();
        expect(mockOnUploadError).toHaveBeenCalledWith(
          expect.stringContaining('File terlalu besar')
        );
      });
    });

    test('validates file type - rejects non-PDF files', async () => {
      (fieldExtractor.validatePdf as jest.Mock).mockReturnValue({
        valid: false,
        error: 'File harus berformat PDF',
      });

      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const fileInput = screen.getByLabelText('Pilih file PDF') as HTMLInputElement;
      const nonPdfFile = createMockFile('document.docx', 1024, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      fireEvent.change(fileInput, { target: { files: [nonPdfFile] } });

      await waitFor(() => {
        expect(screen.getByText(/File harus berformat PDF/i)).toBeInTheDocument();
        expect(mockOnUploadError).toHaveBeenCalledWith('File harus berformat PDF');
      });
    });

    test('accepts valid PDF within size limit', async () => {
      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const fileInput = screen.getByLabelText('Pilih file PDF') as HTMLInputElement;
      const validFile = createMockFile('valid.pdf', 2 * 1024 * 1024, 'application/pdf');

      fireEvent.change(fileInput, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(mockOnUploadSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('PDF Form Field Extraction', () => {
    test('shows error when PDF has no form fields', async () => {
      (fieldExtractor.hasFormFields as jest.Mock).mockResolvedValue(false);

      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const fileInput = screen.getByLabelText('Pilih file PDF') as HTMLInputElement;
      const pdfFile = createMockFile('no-fields.pdf', 1024, 'application/pdf');

      fireEvent.change(fileInput, { target: { files: [pdfFile] } });

      await waitFor(() => {
        expect(screen.getByText(/tidak punya kolom yang bisa diisi/i)).toBeInTheDocument();
        expect(mockOnUploadError).toHaveBeenCalledWith(
          expect.stringContaining('tidak punya kolom yang bisa diisi')
        );
      });
    });

    test('successfully extracts form fields from valid PDF', async () => {
      const mockFields = [
        { name: 'nama', type: 'text' as const, value: '', readOnly: false },
        { name: 'alamat', type: 'text' as const, value: '', readOnly: false },
        { name: 'setuju', type: 'checkbox' as const, value: 'false', readOnly: false },
      ];

      (fieldExtractor.extractPdfFormFields as jest.Mock).mockResolvedValue(mockFields);

      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const fileInput = screen.getByLabelText('Pilih file PDF') as HTMLInputElement;
      const validFile = createMockFile('valid-form.pdf', 1024, 'application/pdf');

      fireEvent.change(fileInput, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(mockOnUploadSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'valid-form.pdf',
            fields: mockFields,
          })
        );
      });
    });
  });

  describe('Progress Indication', () => {
    test('shows progress indicator during upload', async () => {
      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const fileInput = screen.getByLabelText('Pilih file PDF') as HTMLInputElement;
      const validFile = createMockFile('test.pdf', 1024, 'application/pdf');

      fireEvent.change(fileInput, { target: { files: [validFile] } });

      // Should show "Mengunggah..." state
      await waitFor(() => {
        expect(screen.getByText(/Mengunggah\.\.\.|Memproses\.\.\./i)).toBeInTheDocument();
      });
    });

    test('shows success state after successful upload', async () => {
      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const fileInput = screen.getByLabelText('Pilih file PDF') as HTMLInputElement;
      const validFile = createMockFile('success.pdf', 1024, 'application/pdf');

      fireEvent.change(fileInput, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(screen.getByText('Berhasil!')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('shows error for corrupted PDF', async () => {
      (fieldExtractor.extractPdfFormFields as jest.Mock).mockRejectedValue(
        new Error('File PDF rusak atau tidak bisa dibaca')
      );

      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const fileInput = screen.getByLabelText('Pilih file PDF') as HTMLInputElement;
      const corruptedFile = createMockFile('corrupted.pdf', 1024, 'application/pdf');

      fireEvent.change(fileInput, { target: { files: [corruptedFile] } });

      await waitFor(() => {
        expect(screen.getByText(/rusak atau tidak bisa dibaca/i)).toBeInTheDocument();
        expect(mockOnUploadError).toHaveBeenCalled();
      });
    });

    test('shows error for password-protected PDF', async () => {
      (fieldExtractor.extractPdfFormFields as jest.Mock).mockRejectedValue(
        new Error('encrypted password')
      );

      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const fileInput = screen.getByLabelText('Pilih file PDF') as HTMLInputElement;
      const protectedFile = createMockFile('protected.pdf', 1024, 'application/pdf');

      fireEvent.change(fileInput, { target: { files: [protectedFile] } });

      await waitFor(() => {
        expect(screen.getByText(/dilindungi password/i)).toBeInTheDocument();
      });
    });

    test('shows generic error for unknown failures', async () => {
      (fieldExtractor.extractPdfFormFields as jest.Mock).mockRejectedValue(
        new Error('Unknown error')
      );

      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const fileInput = screen.getByLabelText('Pilih file PDF') as HTMLInputElement;
      const unknownFile = createMockFile('unknown.pdf', 1024, 'application/pdf');

      fireEvent.change(fileInput, { target: { files: [unknownFile] } });

      await waitFor(() => {
        expect(screen.getByText(/Gagal membaca PDF/i)).toBeInTheDocument();
      });
    });
  });

  describe('Reset Functionality', () => {
    test('allows retry after error', async () => {
      (fieldExtractor.validatePdf as jest.Mock).mockReturnValue({
        valid: false,
        error: 'File harus berformat PDF',
      });

      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const fileInput = screen.getByLabelText('Pilih file PDF') as HTMLInputElement;
      const invalidFile = createMockFile('invalid.txt', 1024, 'text/plain');

      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      await waitFor(() => {
        expect(screen.getByText(/File harus berformat PDF/i)).toBeInTheDocument();
      });

      // Click "Coba Lagi" button
      const retryButton = screen.getByRole('button', { name: /coba lagi/i });
      fireEvent.click(retryButton);

      // Should return to idle state
      expect(screen.getByText('Tarik file PDF ke sini')).toBeInTheDocument();
    });

    test('allows upload again after success', async () => {
      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const fileInput = screen.getByLabelText('Pilih file PDF') as HTMLInputElement;
      const validFile = createMockFile('success.pdf', 1024, 'application/pdf');

      fireEvent.change(fileInput, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(screen.getByText('Berhasil!')).toBeInTheDocument();
      });

      // Click "Unggah Lagi" button
      const uploadAgainButton = screen.getByRole('button', { name: /unggah lagi/i });
      fireEvent.click(uploadAgainButton);

      // Should return to idle state
      expect(screen.getByText('Tarik file PDF ke sini')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('file input has proper aria-label', () => {
      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const fileInput = screen.getByLabelText('Pilih file PDF');
      expect(fileInput).toBeInTheDocument();
    });

    test('error messages have role="alert"', async () => {
      (fieldExtractor.validatePdf as jest.Mock).mockReturnValue({
        valid: false,
        error: 'File harus berformat PDF',
      });

      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const fileInput = screen.getByLabelText('Pilih file PDF') as HTMLInputElement;
      const invalidFile = createMockFile('invalid.txt', 1024, 'text/plain');

      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('File harus berformat PDF');
      });
    });

    test('progress bar has proper accessibility attributes', async () => {
      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const fileInput = screen.getByLabelText('Pilih file PDF') as HTMLInputElement;
      const validFile = createMockFile('test.pdf', 1024, 'application/pdf');

      fireEvent.change(fileInput, { target: { files: [validFile] } });

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
        // aria-live is on the wrapper div, not the progressbar itself
        const wrapper = progressBar.parentElement;
        expect(wrapper).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Requirements Validation', () => {
    test('Requirement 4.1: Provides interface for uploading custom PDF templates', () => {
      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      // Check drag-drop zone exists
      expect(screen.getByText('Tarik file PDF ke sini')).toBeInTheDocument();
      // Check file picker exists
      expect(screen.getByRole('button', { name: /pilih file/i })).toBeInTheDocument();
    });

    test('Requirement 4.2: Validates PDF file format', async () => {
      (fieldExtractor.validatePdf as jest.Mock).mockReturnValue({
        valid: false,
        error: 'File harus berformat PDF',
      });

      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
        />
      );

      const fileInput = screen.getByLabelText('Pilih file PDF') as HTMLInputElement;
      const nonPdfFile = createMockFile('document.docx', 1024, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      fireEvent.change(fileInput, { target: { files: [nonPdfFile] } });

      await waitFor(() => {
        expect(fieldExtractor.validatePdf).toHaveBeenCalled();
        expect(screen.getByText(/File harus berformat PDF/i)).toBeInTheDocument();
      });
    });

    test('Requirement 4.3: Rejects files larger than 5MB', async () => {
      (fieldExtractor.validatePdf as jest.Mock).mockReturnValue({
        valid: false,
        error: 'File terlalu besar. Maksimal 5MB. File kamu: 6.00MB',
      });

      render(
        <PdfUploader
          onUploadSuccess={mockOnUploadSuccess}
          onUploadError={mockOnUploadError}
          maxSizeMB={5}
        />
      );

      const fileInput = screen.getByLabelText('Pilih file PDF') as HTMLInputElement;
      const largeFile = createMockFile('large.pdf', 6 * 1024 * 1024, 'application/pdf');

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(screen.getByText(/File terlalu besar/i)).toBeInTheDocument();
      });
    });
  });
});
