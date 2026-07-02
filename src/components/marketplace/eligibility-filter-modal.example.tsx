/**
 * Example usage of EligibilityFilterModal component
 * 
 * This file demonstrates different usage patterns for the modal component.
 * It is NOT meant to be imported in production code - it's for reference only.
 */

import React from 'react';
import { EligibilityFilterModal } from './eligibility-filter-modal';
import { Button } from '@/components/ui/button';
import { Filter, Settings } from 'lucide-react';
import type { UserCriteria } from '@/contexts/user-context';

/**
 * Example 1: Uncontrolled mode (simplest usage)
 * The component manages its own open/close state internally
 */
export function UncontrolledExample() {
  return (
    <div className="space-y-4">
      <h2>Uncontrolled Modal Example</h2>
      <EligibilityFilterModal
        onFilterChange={(criteria) => {
          console.log('Filter changed:', criteria);
        }}
      />
    </div>
  );
}

/**
 * Example 2: Controlled mode
 * Parent component controls the open/close state
 */
export function ControlledExample() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <h2>Controlled Modal Example</h2>
      <EligibilityFilterModal
        open={isOpen}
        onOpenChange={setIsOpen}
        onFilterChange={(criteria) => {
          console.log('Filter changed:', criteria);
        }}
      />
      
      {/* Additional controls */}
      <Button onClick={() => setIsOpen(true)}>
        Open Filters Programmatically
      </Button>
    </div>
  );
}

/**
 * Example 3: Custom trigger button
 * Replace the default trigger with custom content
 */
export function CustomTriggerExample() {
  return (
    <div className="space-y-4">
      <h2>Custom Trigger Example</h2>
      <EligibilityFilterModal
        triggerContent={
          <Button variant="default" size="lg">
            <Settings className="h-5 w-5 mr-2" />
            Atur Filter Saya
          </Button>
        }
        onFilterChange={(criteria) => {
          console.log('Filter changed:', criteria);
        }}
      />
    </div>
  );
}

/**
 * Example 4: Without presets
 * Hide the filter preset templates
 */
export function NoPresetsExample() {
  return (
    <div className="space-y-4">
      <h2>No Presets Example</h2>
      <EligibilityFilterModal
        showPresets={false}
        onFilterChange={(criteria) => {
          console.log('Filter changed:', criteria);
        }}
      />
    </div>
  );
}

/**
 * Example 5: Integration with marketplace page
 * Shows how the modal would be used in the actual marketplace
 */
export function MarketplaceIntegrationExample() {
  const handleFilterChange = (criteria: UserCriteria) => {
    // Update URL parameters
    const params = new URLSearchParams();
    if (criteria.age) params.set('age', String(criteria.age));
    if (criteria.income) params.set('income', String(criteria.income));
    if (criteria.location?.province) params.set('province', criteria.location.province);
    // ... add other parameters
    
    // Update route
    window.history.pushState(
      {},
      '',
      `/marketplace${params.toString() ? `?${params.toString()}` : ''}`
    );
  };

  return (
    <div className="flex items-center gap-2">
      {/* Mobile view - show modal button */}
      <div className="lg:hidden">
        <EligibilityFilterModal onFilterChange={handleFilterChange} />
      </div>
      
      {/* Desktop view - sidebar shown separately, modal as alternative */}
      <div className="hidden lg:block">
        <EligibilityFilterModal
          triggerContent={
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Tampilan Modal
            </Button>
          }
          onFilterChange={handleFilterChange}
        />
      </div>
    </div>
  );
}
