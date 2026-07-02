/**
 * Integration tests for filter state synchronization
 * 
 * Validates Requirements 1.3, 1.4, 1.5:
 * - Filter state persists across access pattern switches
 * - Changes in modal reflect in sidebar and vice versa
 * - URL parameters stay synchronized
 * 
 * **Validates: Requirements 1.3, 1.4, 1.5**
 */

import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EligibilityFilter } from './eligibility-filter';
import { EligibilityFilterModal } from './eligibility-filter-modal';
import { UserContextProvider, useUserContext } from '@/contexts/user-context';
import type { UserCriteria } from '@/contexts/user-context';

// Test component that simulates marketplace page with both sidebar and modal
function TestMarketplacePage() {
  const { userCriteria } = useUserContext();
  const [urlParams, setUrlParams] = useState('');

  // Simulate URL parameter synchronization like marketplace page
  const handleFilterChange = (criteria: UserCriteria) => {
    const params = new URLSearchParams();
    
    if (criteria.income) params.set('income', String(criteria.income));
    if (criteria.familySize) params.set('familySize', String(criteria.familySize));
    if (criteria.age) params.set('age', String(criteria.age));
    if (criteria.occupation) params.set('occupation', criteria.occupation);
    if (criteria.location?.province) params.set('province', criteria.location.province);
    if (criteria.location?.city) params.set('city', criteria.location.city);
    
    setUrlParams(params.toString());
  };

  return (
    <div>
      {/* Display current criteria for testing */}
      <div data-testid="current-criteria">
        {JSON.stringify(userCriteria)}
      </div>
      
      {/* Display URL params for testing */}
      <div data-testid="url-params">
        {urlParams}
      </div>

      {/* Sidebar filter */}
      <div data-testid="sidebar-filter">
        <EligibilityFilter 
          onFilterChange={handleFilterChange}
          showPresets={true}
        />
      </div>

      {/* Modal filter */}
      <div data-testid="modal-filter">
        <EligibilityFilterModal
          onFilterChange={handleFilterChange}
          showPresets={true}
        />
      </div>
    </div>
  );
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <UserContextProvider>
      {children}
    </UserContextProvider>
  );
}

describe('Filter State Synchronization', () => {
  describe('Requirement 1.3: Filter state shared between sidebar and modal via UserContext', () => {
    test('changes in sidebar filter update UserContext', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TestMarketplacePage />
        </TestWrapper>
      );

      // Find income input in sidebar (first occurrence)
      const sidebarIncomeInput = screen.getAllByLabelText(/Penghasilan per Bulan/i)[0];
      
      // Update income in sidebar
      await user.clear(sidebarIncomeInput);
      await user.type(sidebarIncomeInput, '2000000');

      // Check UserContext updated
      await waitFor(() => {
        const criteriaDisplay = screen.getByTestId('current-criteria');
        expect(criteriaDisplay.textContent).toContain('2000000');
      });
    });

    test('changes in modal filter update UserContext', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TestMarketplacePage />
        </TestWrapper>
      );

      // Open modal
      const modalTrigger = screen.getByRole('button', { name: /Buka filter kelayakan/i });
      await user.click(modalTrigger);

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Find income input in modal (should be second occurrence now)
      const incomeInputs = screen.getAllByLabelText(/Penghasilan per Bulan/i);
      const modalIncomeInput = incomeInputs[incomeInputs.length - 1];
      
      // Update income in modal
      await user.clear(modalIncomeInput);
      await user.type(modalIncomeInput, '3000000');

      // Check UserContext updated
      await waitFor(() => {
        const criteriaDisplay = screen.getByTestId('current-criteria');
        expect(criteriaDisplay.textContent).toContain('3000000');
      });
    });

    test('both sidebar and modal read from same UserContext', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TestMarketplacePage />
        </TestWrapper>
      );

      // Update in sidebar
      const sidebarIncomeInput = screen.getAllByLabelText(/Penghasilan per Bulan/i)[0];
      await user.clear(sidebarIncomeInput);
      await user.type(sidebarIncomeInput, '1500000');

      // Open modal
      const modalTrigger = screen.getByRole('button', { name: /Buka filter kelayakan/i });
      await user.click(modalTrigger);

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Check modal shows same value from UserContext
      const incomeInputs = screen.getAllByLabelText(/Penghasilan per Bulan/i);
      const modalIncomeInput = incomeInputs[incomeInputs.length - 1] as HTMLInputElement;
      
      await waitFor(() => {
        expect(modalIncomeInput.value).toBe('1500000');
      });
    });
  });

  describe('Requirement 1.4: Filter state persists when switching between access patterns', () => {
    test('filter values persist after opening and closing modal', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TestMarketplacePage />
        </TestWrapper>
      );

      // Set filter in sidebar
      const sidebarFamilySizeInput = screen.getAllByLabelText(/Jumlah Anggota Keluarga/i)[0];
      await user.clear(sidebarFamilySizeInput);
      await user.type(sidebarFamilySizeInput, '4');

      // Open modal
      const modalTrigger = screen.getByRole('button', { name: /Buka filter kelayakan/i });
      await user.click(modalTrigger);

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close modal (press Escape)
      await user.keyboard('{Escape}');

      // Wait for modal to close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Check value still in sidebar
      const sidebarFamilySizeAfter = screen.getByLabelText(/Jumlah Anggota Keluarga/i) as HTMLInputElement;
      expect(sidebarFamilySizeAfter.value).toBe('4');

      // Check UserContext still has value
      const criteriaDisplay = screen.getByTestId('current-criteria');
      expect(criteriaDisplay.textContent).toContain('4');
    });

    test('filter values persist when set in modal then viewed in sidebar', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TestMarketplacePage />
        </TestWrapper>
      );

      // Open modal
      const modalTrigger = screen.getByRole('button', { name: /Buka filter kelayakan/i });
      await user.click(modalTrigger);

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Set filter in modal
      const modalInputs = screen.getAllByLabelText(/Penghasilan per Bulan/i);
      const modalIncomeInput = modalInputs[modalInputs.length - 1];
      await user.clear(modalIncomeInput);
      await user.type(modalIncomeInput, '2500000');

      // Close modal
      await user.keyboard('{Escape}');

      // Wait for modal to close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Check value appears in sidebar
      const sidebarIncomeInput = screen.getByLabelText(/Penghasilan per Bulan/i) as HTMLInputElement;
      expect(sidebarIncomeInput.value).toBe('2500000');
    });
  });

  describe('Requirement 1.5: URL parameter synchronization maintained', () => {
    test('sidebar filter changes update URL parameters', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TestMarketplacePage />
        </TestWrapper>
      );

      // Update income in sidebar
      const incomeInput = screen.getAllByLabelText(/Penghasilan per Bulan/i)[0];
      await user.clear(incomeInput);
      await user.type(incomeInput, '2000000');

      // Check URL params updated
      await waitFor(() => {
        const urlDisplay = screen.getByTestId('url-params');
        expect(urlDisplay.textContent).toContain('income=2000000');
      });
    });

    test('modal filter changes update URL parameters', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TestMarketplacePage />
        </TestWrapper>
      );

      // Open modal
      const modalTrigger = screen.getByRole('button', { name: /Buka filter kelayakan/i });
      await user.click(modalTrigger);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Update income in modal
      const incomeInputs = screen.getAllByLabelText(/Penghasilan per Bulan/i);
      const modalIncomeInput = incomeInputs[incomeInputs.length - 1];
      await user.clear(modalIncomeInput);
      await user.type(modalIncomeInput, '3500000');

      // Check URL params updated
      await waitFor(() => {
        const urlDisplay = screen.getByTestId('url-params');
        expect(urlDisplay.textContent).toContain('income=3500000');
      });
    });

    test('URL parameters include all filter fields', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TestMarketplacePage />
        </TestWrapper>
      );

      // Set multiple filters
      const incomeInput = screen.getAllByLabelText(/Penghasilan per Bulan/i)[0];
      await user.clear(incomeInput);
      await user.type(incomeInput, '2000000');

      const familySizeInput = screen.getAllByLabelText(/Jumlah Anggota Keluarga/i)[0];
      await user.clear(familySizeInput);
      await user.type(familySizeInput, '5');

      const provinceInput = screen.getAllByLabelText(/Provinsi/i)[0];
      await user.clear(provinceInput);
      await user.type(provinceInput, 'Jawa Barat');

      // Check all parameters in URL
      await waitFor(() => {
        const urlDisplay = screen.getByTestId('url-params');
        const urlText = urlDisplay.textContent || '';
        expect(urlText).toContain('income=2000000');
        expect(urlText).toContain('familySize=5');
        expect(urlText).toContain('province=Jawa+Barat');
      });
    });
  });

  describe('Bidirectional synchronization', () => {
    test('changes reflect bidirectionally between sidebar and modal', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <TestMarketplacePage />
        </TestWrapper>
      );

      // Step 1: Set value in sidebar
      const sidebarIncomeInput = screen.getAllByLabelText(/Penghasilan per Bulan/i)[0];
      await user.clear(sidebarIncomeInput);
      await user.type(sidebarIncomeInput, '1000000');

      // Step 2: Open modal and verify value
      const modalTrigger = screen.getByRole('button', { name: /Buka filter kelayakan/i });
      await user.click(modalTrigger);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const incomeInputsAfterOpen = screen.getAllByLabelText(/Penghasilan per Bulan/i);
      const modalIncomeInput = incomeInputsAfterOpen[incomeInputsAfterOpen.length - 1] as HTMLInputElement;
      expect(modalIncomeInput.value).toBe('1000000');

      // Step 3: Change value in modal
      await user.clear(modalIncomeInput);
      await user.type(modalIncomeInput, '2000000');

      // Step 4: Close modal
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Step 5: Verify sidebar has updated value
      const sidebarIncomeAfter = screen.getByLabelText(/Penghasilan per Bulan/i) as HTMLInputElement;
      expect(sidebarIncomeAfter.value).toBe('2000000');

      // Step 6: Verify URL params updated
      const urlDisplay = screen.getByTestId('url-params');
      expect(urlDisplay.textContent).toContain('income=2000000');
    });
  });
});
