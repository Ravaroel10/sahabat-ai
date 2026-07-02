/**
 * Message Part Renderers
 * Components for rendering different types of message content
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ExternalLink, Phone } from 'lucide-react';
import Link from 'next/link';
import type { 
  Citation,
  RegulationCitation,
  WebsiteCitation,
  RAGDocumentCitation,
  InstitutionCitation,
  EmergencyDetection,
  SocialProgram,
} from '@/types/llm-response';

/**
 * Render citations/sources from various types
 */
export function CitationRenderer({ 
  citations, 
  sectionLabel = 'Referensi' 
}: { 
  citations: Citation[];
  sectionLabel?: string;
}) {
  if (!citations || citations.length === 0) return null;

  // Group citations by type for better organization
  const regulations = citations.filter(c => c.type === 'regulation') as RegulationCitation[];
  const websites = citations.filter(c => c.type === 'website') as WebsiteCitation[];
  const ragDocs = citations.filter(c => c.type === 'rag-document') as RAGDocumentCitation[];
  const institutions = citations.filter(c => c.type === 'institution-info') as InstitutionCitation[];

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <p className="text-xs font-semibold text-muted-foreground mb-2">
        📚 {sectionLabel}:
      </p>
      <div className="space-y-2">
        {/* Regulations - highest priority */}
        {regulations.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground">📜 Dasar Hukum:</p>
            {regulations.map((citation, index) => (
              <div key={index} className="text-xs text-muted-foreground ml-2">
                • {citation.fullCitation}
              </div>
            ))}
          </div>
        )}

        {/* Website sources */}
        {websites.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground">🌐 Sumber Web:</p>
            {websites.map((citation, index) => (
              <div key={index} className="text-xs ml-2">
                {citation.url ? (
                  <a 
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    • {citation.title} ({citation.domain})
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">
                    • {citation.title} ({citation.domain})
                  </span>
                )}
                {citation.snippet && (
                  <p className="text-muted-foreground ml-3 mt-0.5 italic">
                    "{citation.snippet.substring(0, 100)}..."
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* RAG documents */}
        {ragDocs.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground">📄 Dokumen Terkait:</p>
            {ragDocs.map((citation, index) => (
              <div key={index} className="text-xs text-muted-foreground ml-2">
                • {citation.title}
                {citation.snippet && (
                  <p className="ml-3 mt-0.5 italic text-muted-foreground/80">
                    "{citation.snippet.substring(0, 80)}..."
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Institution information */}
        {institutions.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground">🏛️ Informasi Institusi:</p>
            {institutions.map((citation, index) => (
              <div key={index} className="text-xs text-muted-foreground ml-2">
                • {citation.institutionName}
                {citation.contact && (
                  <span className="ml-2 font-mono">({citation.contact})</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Render emergency alert with immediate actions
 */
export function EmergencyAlertRenderer({ 
  emergency, 
  immediateSteps, 
  contacts 
}: { 
  emergency: EmergencyDetection; 
  immediateSteps: string[]; 
  contacts: Array<{ name: string; phone?: string; description?: string }>;
}) {
  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case 'medical': return '🏥';
      case 'financial': return '💰';
      case 'violence': return '🛡️';
      case 'disaster': return '⚠️';
      default: return '⚠️';
    }
  };

  return (
    <Card className="border-destructive bg-destructive/10 mt-3">
      <div className="p-4 space-y-3">
        {/* Alert header */}
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-destructive text-sm">
              {getEmergencyIcon(emergency.type || 'medical')} Situasi Darurat Terdeteksi
            </p>
            <p className="text-xs text-destructive/80 mt-1">
              Kata kunci: {emergency.keywords.join(', ')}
            </p>
          </div>
        </div>

        {/* Immediate steps */}
        {immediateSteps && immediateSteps.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Langkah yang bisa dilakukan SEKARANG:
            </p>
            <ol className="space-y-1.5 text-sm">
              {immediateSteps.map((step, index) => (
                <li key={index} className="flex items-start">
                  <span className="font-bold text-destructive mr-2">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Emergency contacts */}
        {contacts && contacts.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-destructive/20">
            <p className="text-sm font-semibold text-foreground flex items-center">
              <Phone className="h-4 w-4 mr-1.5" />
              Kontak Darurat:
            </p>
            <div className="space-y-1.5">
              {contacts.map((contact, index) => (
                <div key={index} className="text-sm">
                  <span className="font-semibold">{contact.name}:</span>{' '}
                  {contact.phone && (
                    <a 
                      href={`tel:${contact.phone}`}
                      className="text-destructive hover:underline font-mono"
                    >
                      {contact.phone}
                    </a>
                  )}
                  {contact.description && (
                    <p className="text-xs text-muted-foreground ml-0 mt-0.5">
                      {contact.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
/**
 * Inline Action Button - single action button embedded within text flow
 */
export function InlineActionButtonRenderer({ 
  actionType 
}: { 
  actionType: string;
}) {
  // Map action types to button config
  const getActionConfig = (type: string) => {
    switch (type) {
      case 'auto-birokrasi':
        return {
          label: '📝 Buat Dokumen dengan Auto-Birokrasi',
          href: '/auto-birokrasi',
          variant: 'default' as const,
        };
      case 'marketplace':
        return {
          label: '🛒 Jelajahi Marketplace Program',
          href: '/programs',
          variant: 'outline' as const,
        };
      case 'emergency':
        return {
          label: '🚨 Nomor Darurat',
          href: 'tel:119',
          variant: 'destructive' as const,
          description: 'Hubungi layanan darurat: 119 (ambulans), 110 (polisi), 113 (pemadam)',
          isExternal: true,
        };
      default:
        return {
          label: 'Aksi',
          href: '#',
          variant: 'outline' as const,
          description: '',
        };
    }
  };
  
  const config = getActionConfig(actionType);
  
  return (
        <Link href={config.href} target='_blank'>
          {config.isExternal ? (
              <Button 
                variant={config.variant}
                className="w-full text-sm py-3"
              >
                {config.label}
              </Button>
          ) : (
              <Button 
                variant={config.variant}
                className="w-full text-sm py-3"
              >
                {config.label}
              </Button>
          )}
        </Link>
  );
}

/**
 * Inline Program Card - compact card embedded within text flow
 * Different from regular program cards which appear at the end
 */
export function InlineProgramCardRenderer({ 
  programId, 
  program 
}: { 
  programId?: string; 
  program?: SocialProgram;
}) {
  // If we have full program data, use it directly
  if (program) {
    return (
      <div className="my-3 inline-block w-full">
        <Card className="bg-primary/5 border-primary/20 hover:border-primary/40 transition-colors">
          <div className="p-3 space-y-2">
            <div className="flex items-start gap-2">
              <div className="text-2xl">💼</div>
              <div className="flex-1 space-y-1">
                <h5 className="font-semibold text-sm text-primary">{program.name}</h5>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {program.description}
                </p>
                
                {program.benefits && (
                  <div className="text-xs">
                    <span className="font-semibold text-foreground">💰 Manfaat:</span>{' '}
                    <span className="text-muted-foreground">{program.benefits}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 pt-1">
              <Link href={`/programs/${program.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-xs h-7">
                  Lihat Detail
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  // If we only have programId, fetch from static data or show placeholder
  // TODO: Integrate with social-programs.ts data
  if (programId) {
    return (
      <div className="my-3 inline-block w-full">
        <Card className="bg-primary/5 border-primary/20">
          <div className="p-3">
            <div className="flex items-start gap-2">
              <div className="text-2xl">💼</div>
              <div className="flex-1 space-y-1">
                <h5 className="font-semibold text-sm text-primary">
                  Program {programId.toUpperCase()}
                </h5>
                <p className="text-xs text-muted-foreground italic">
                  Memuat detail program...
                </p>
              </div>
            </div>
            
            <div className="mt-2">
              <Link href={`/programs/${programId}`}>
                <Button variant="outline" size="sm" className="w-full text-xs h-7">
                  Lihat Detail
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  return null;
}

/**
 * Compact Program Reference Card - for references section (not inline in text)
 * Minimal, space-efficient design for the bottom references area
 */
function CompactProgramReferenceCard({ program }: { program: SocialProgram }) {
  // Determine eligibility status badge
  const getEligibilityBadge = () => {
    const status = (program as any).eligibilityStatus || 'unknown';
    
    switch (status) {
      case 'eligible':
        return <Badge className="text-xs bg-green-600 hover:bg-green-700 border-0">✓ Eligible</Badge>;
      case 'partial':
        return <Badge variant="outline" className="text-xs border-amber-500 text-amber-700">⚠ Perlu Verifikasi</Badge>;
      case 'ineligible':
        return <Badge variant="outline" className="text-xs text-muted-foreground">✗ Tidak Eligible</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-accent/30 hover:bg-accent/50 transition-colors border border-border/30">
      <div className="text-lg">💼</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link 
            href={`/programs/${program.id}`}
            className="font-semibold text-xs hover:underline text-primary truncate"
          >
            {program.name}
          </Link>
          {getEligibilityBadge()}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
          {program.description}
        </p>
      </div>
      <Link href={`/programs/${program.id}`}>
        <Button variant="ghost" size="sm" className="h-7 text-xs px-2 shrink-0">
          Detail
        </Button>
      </Link>
    </div>
  );
}

/**
 * Render program card (compact view) - for references section only
 * This is NOT the inline card - inline cards use InlineProgramCardRenderer
 */
export function ProgramCardRenderer({ program }: { program: SocialProgram }) {
  return <CompactProgramReferenceCard program={program} />;
}
