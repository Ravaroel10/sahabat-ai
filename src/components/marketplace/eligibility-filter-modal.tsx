'use client';

/**
 * EligibilityFilterModal - Modal wrapper for EligibilityFilter component
 * 
 * Provides alternative access pattern to sidebar filtering system.
 * Uses shadcn/ui Dialog component for accessibility compliance.
 * 
 * Features:
 * - Modal open/close state management
 * - Focus trap when modal is open
 * - Escape key to close
 * - Focus returns to trigger button on close
 * - Shared filter state with sidebar through UserContext
 * - Mobile-first: full-screen on small devices, centered on desktop
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { EligibilityFilter } from './eligibility-filter';
import type { UserCriteria } from '@/contexts/user-context';

interface EligibilityFilterModalProps {
  /**
   * Controlled open state (optional)
   * If provided, component operates in controlled mode
   */
  open?: boolean;
  
  /**
   * Callback when open state changes
   * Required if using controlled mode
   */
  onOpenChange?: (open: boolean) => void;
  
  /**
   * Callback when filter criteria change
   * Notifies parent of filter updates
   */
  onFilterChange?: (criteria: UserCriteria) => void;
  
  /**
   * Show filter presets in the modal
   * Default: true
   */
  showPresets?: boolean;
  
  /**
   * Custom trigger button content
   * Default: "Filter" button with icon
   */
  triggerContent?: React.ReactNode;
}

/**
 * Modal wrapper for EligibilityFilter component
 * Provides alternative access pattern to sidebar filtering
 * 
 * Accessibility:
 * - Focus trap when modal is open (handled by Dialog)
 * - Escape key to close (handled by Dialog)
 * - Focus returns to trigger button on close (handled by Dialog)
 * - aria-modal="true" and role="dialog" (handled by Dialog)
 * - Descriptive labels for screen readers
 */
export function EligibilityFilterModal({
  open: controlledOpen,
  onOpenChange,
  onFilterChange,
  showPresets = true,
  triggerContent,
}: EligibilityFilterModalProps) {
  // Internal state for uncontrolled mode
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use controlled or uncontrolled state
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {triggerContent || (
          <Button variant="outline" aria-label="Buka filter kelayakan">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className="max-w-[calc(100%-2rem)] sm:max-w-md md:max-w-lg max-h-[calc(100vh-4rem)] overflow-y-auto"
        aria-describedby="filter-description"
      >
        <DialogHeader>
          <DialogTitle>Filter Kelayakan</DialogTitle>
          <DialogDescription id="filter-description">
            Gunakan filter ini untuk menemukan program yang sesuai dengan situasi kamu
          </DialogDescription>
        </DialogHeader>
        
        {/* EligibilityFilter component renders inside Dialog */}
        <div className="mt-2">
          <EligibilityFilter 
            onFilterChange={onFilterChange}
            showPresets={showPresets}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
