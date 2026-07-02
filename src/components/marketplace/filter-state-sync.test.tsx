/**
 * Integration tests for filter state synchronization
 * 
 * Tests Requirements:
 * - 1.3: Filter state persists across pattern switches
 * - 1.4: Filter state maintained when switching between access patterns
 * - 1.5: URL parameter synchronization
 * 
 * Test Coverage:
 * - Filter changes in modal reflect in sidebar
 * - Filter changes in sidebar reflect in modal
 * - URL parameters stay synchronized with both access patterns
 * - UserContext state shared between both components
 * - Filter state persists when switching between modal and sidebar
 */

import React, { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { EligibilityFilter } from './eligibility-filter';
import { EligibilityFilterModal } from './eligibility-filter-modal';
import { UserContextProvider, useUserContext } from '@/contexts/user-context';
import type { UserCriteria } from '@/contexts/user-context';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

// Test wrapper that includes UserContext and simulates marketplace page structure
const MarketplaceTestWrapper = ({ children }: { children?: React.ReactNode }) => {
  const [urlParams, setUrlParams] = useState(new URLSearchParams());
  const [filterState, setFilterState] = useState<UserCriteria>({});

  // Mock router
  const mockRouter = {
    push: jest.fn((path: string) => {
      const url = new URL(path, 'http://localhost');
      setUrlParams(url.searchParams);
    }),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  };

  // Mock search params
  mockUseRouter.mockReturnValue(mockRouter as any);
  mockUseSearchParams.mockReturnValue(urlParams as any);

  const handleFilterChange = (criteria: UserCriteria) => {
    setFilterState(criteria);
    
    // Simulate URL update like in marketplace page
    const params = new URLSearchParams();
    if (criteria.income) params.set('income', String(criteria.income));
    if (criteria.familySize) params.set('familySize', String(criteria.familySize));
    if (criteria.age) params.set('age', String(criteria.age));
    if (criteria.occupation) params.set('occupation', criteria.occupation);
    if (criteria.location?.province) params.set('province', criteria.location.province);
    if (criteria.location?.city) params.set('city', criteria.location.city);
    
    mockRouter.push(`/marketplace${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <UserContextProvider>
      <div data-testid="marketplace-wrapper">
        <div data-testid="sidebar">
          <EligibilityFilter onFilterChange={handleFilterChange} />
        </div>
        <div data-testid="modal-container">
          <EligibilityFilterModal 
            onFilterChange={handleFilterChange}
            triggerContent={<button>Open Modal Filter</button>}
          />
        </div>
        <div data-testid="filter-state-display">
          {JSON.stringify(filterState)}
        </div>
      </div>
    </UserContextProvider>
  );
};

// Component to read UserContext state for testing
const ContextStateReader = ({ onStateRead }: { onStateRead: (criteria: UserCriteria) => void }) => {
  const { userCriteria } = useUserContext();
  React.useEffect(() => {
    onStateRead(userCriteria);
  }, [userCriteria, onStateRead]);
  return null;
};

describe('Filter State Synchronization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 1.3: Filter state persists across pattern switches', () => {
    test('filters set in sidebar are visible in modal', async () => {
      const user = userEvent.setup();
      render(<MarketplaceTestWrapper />);

      // Set income in sidebar
      const sidebar = screen.getByTestId('sidebar');
      const incomeInput = within(sidebar).getByLabelText(/penghasilan per bulan/i);
      
      await user.clear(incomeInput);
      await user.type(incomeInput, '2000000');

      // Open modal
      const modalTrigger = screen.getByRole('button', { name: /open modal filter/i });
      await user.click(modalTrigger);

      // Modal should be open now
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Check if income value is present in the dialog
      const dialog = screen.getByRole('dialog');
      const modalIncomeInput = within(dialog).getByLabelText(/penghasilan per bulan/i);
      
      await waitFor(() => {
        expect(modalIncomeInput).toHaveValue(2000000);
      });
    });

    test('filters set in modal are visible in sidebar', async () => {
      const user = userEvent.setup();
      render(<MarketplaceTestWrapper />);

      // Open modal first
      const modalTrigger = screen.getByRole('button', { name: /open modal filter/i });
      await user.click(modalTrigger);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Set family size in modal
      const dialog = screen.getByRole('dialog');
      const familySizeInput = within(dialog).getByLabelText(/jumlah anggota keluarga/i);
      
      await user.clear(familySizeInput);
      await user.type(familySizeInput, '4');

      // Close modal
      const closeButton = within(dialog).getByRole('button', { name: /close/i });
      await user.click(closeButton);

      // Wait for modal to close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Check sidebar has the family size value
      const sidebar = screen.getByTestId('sidebar');
      const sidebarFamilySizeInput = within(sidebar).getByLabelText(/jumlah anggota keluarga/i);
      
      expect(sidebarFamilySizeInput).toHaveValue(4);
    });

    test('multiple filter changes persist across modal open/close cycles', async () => {
      const user = userEvent.setup();
      render(<MarketplaceTestWrapper />);

      const sidebar = screen.getByTestId('sidebar');

      // Set multiple filters in sidebar
      const incomeInput = within(sidebar).getByLabelText(/penghasilan per bulan/i);
      await user.clear(incomeInput);
      await user.type(incomeInput, '1500000');

      const provinceInput = within(sidebar).getByLabelText(/provinsi/i);
      await user.clear(provinceInput);
      await user.type(provinceInput, 'Jawa Barat');

      // Open modal - first time
      let modalTrigger = screen.getByRole('button', { name: /open modal filter/i });
      await user.click(modalTrigger);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Verify values in modal
      let dialog = screen.getByRole('dialog');
      expect(within(dialog).getByLabelText(/penghasilan per bulan/i)).toHaveValue(1500000);
      expect(within(dialog).getByLabelText(/provinsi/i)).toHaveValue('Jawa Barat');

      // Close modal
      let closeButton = within(dialog).getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Open modal again - second time
      modalTrigger = screen.getByRole('button', { name: /open modal filter/i });
      await user.click(modalTrigger);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Verify values still persist
      dialog = screen.getByRole('dialog');
      expect(within(dialog).getByLabelText(/penghasilan per bulan/i)).toHaveValue(1500000);
      expect(within(dialog).getByLabelText(/provinsi/i)).toHaveValue('Jawa Barat');
    });
  });

  describe('Requirement 1.4: Maintain filter state when switching between access patterns', () => {
    test('UserContext maintains consistent state across both components', async () => {
      const stateReadings: UserCriteria[] = [];
      const onStateRead = jest.fn((criteria: UserCriteria) => {
        stateReadings.push(criteria);
      });

      const TestWrapper = () => (
        <UserContextProvider>
          <ContextStateReader onStateRead={onStateRead} />
          <MarketplaceTestWrapper />
        </UserContextProvider>
      );

      const user = userEvent.setup();
      render(<TestWrapper />);

      // Initial state should be empty
      expect(stateReadings[stateReadings.length - 1]).toEqual({});

      // Set income in sidebar
      const sidebar = screen.getByTestId('sidebar');
      const incomeInput = within(sidebar).getByLabelText(/penghasilan per bulan/i);
      await user.clear(incomeInput);
      await user.type(incomeInput, '3000000');

      // Wait for state update
      await waitFor(() => {
        const latestState = stateReadings[stateReadings.length - 1];
        expect(latestState.income).toBe(3000000);
      });

      // Open modal and make additional changes
      const modalTrigger = screen.getByRole('button', { name: /open modal filter/i });
      await user.click(modalTrigger);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const dialog = screen.getByRole('dialog');
      const familySizeInput = within(dialog).getByLabelText(/jumlah anggota keluarga/i);
      await user.clear(familySizeInput);
      await user.type(familySizeInput, '5');

      // Wait for state update
      await waitFor(() => {
        const latestState = stateReadings[stateReadings.length - 1];
        expect(latestState.income).toBe(3000000);
        expect(latestState.familySize).toBe(5);
      });
    });

    test('reset button clears filters in both sidebar and modal', async () => {
      const user = userEvent.setup();
      render(<MarketplaceTestWrapper />);

      const sidebar = screen.getByTestId('sidebar');

      // Set some filters
      const incomeInput = within(sidebar).getByLabelText(/penghasilan per bulan/i);
      await user.clear(incomeInput);
      await user.type(incomeInput, '2500000');

      // Click reset button in sidebar
      const resetButton = within(sidebar).getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      // Verify sidebar is cleared
      expect(incomeInput).toHaveValue(null);

      // Open modal and verify it's also cleared
      const modalTrigger = screen.getByRole('button', { name: /open modal filter/i });
      await user.click(modalTrigger);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const dialog = screen.getByRole('dialog');
      const modalIncomeInput = within(dialog).getByLabelText(/penghasilan per bulan/i);
      expect(modalIncomeInput).toHaveValue(null);
    });
  });

  describe('Requirement 1.5: URL parameter synchronization', () => {
    test('URL parameters updated when filters change in sidebar', async () => {
      const user = userEvent.setup();
      const mockRouter = {
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
      };
      mockUseRouter.mockReturnValue(mockRouter as any);

      render(<MarketplaceTestWrapper />);

      const sidebar = screen.getByTestId('sidebar');
      const incomeInput = within(sidebar).getByLabelText(/penghasilan per bulan/i);
      
      await user.clear(incomeInput);
      await user.type(incomeInput, '2000000');

      // Wait for router.push to be called
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalled();
      });

      // Verify URL contains income parameter
      const lastCall = mockRouter.push.mock.calls[mockRouter.push.mock.calls.length - 1];
      expect(lastCall[0]).toContain('income=2000000');
    });

    test('URL parameters updated when filters change in modal', async () => {
      const user = userEvent.setup();
      const mockRouter = {
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
      };
      mockUseRouter.mockReturnValue(mockRouter as any);

      render(<MarketplaceTestWrapper />);

      // Open modal
      const modalTrigger = screen.getByRole('button', { name: /open modal filter/i });
      await user.click(modalTrigger);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Set location in modal
      const dialog = screen.getByRole('dialog');
      const provinceInput = within(dialog).getByLabelText(/provinsi/i);
      await user.clear(provinceInput);
      await user.type(provinceInput, 'Jawa Timur');

      // Wait for router.push to be called
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalled();
      });

      // Verify URL contains province parameter
      const calls = mockRouter.push.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).toContain('province=Jawa+Timur');
    });

    test('multiple filter changes result in synchronized URL parameters', async () => {
      const user = userEvent.setup();
      const mockRouter = {
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
      };
      mockUseRouter.mockReturnValue(mockRouter as any);

      render(<MarketplaceTestWrapper />);

      const sidebar = screen.getByTestId('sidebar');

      // Set multiple filters
      const incomeInput = within(sidebar).getByLabelText(/penghasilan per bulan/i);
      await user.clear(incomeInput);
      await user.type(incomeInput, '3000000');

      const familySizeInput = within(sidebar).getByLabelText(/jumlah anggota keluarga/i);
      await user.clear(familySizeInput);
      await user.type(familySizeInput, '6');

      const provinceInput = within(sidebar).getByLabelText(/provinsi/i);
      await user.clear(provinceInput);
      await user.type(provinceInput, 'DKI Jakarta');

      // Wait for all updates
      await waitFor(() => {
        expect(mockRouter.push.mock.calls.length).toBeGreaterThan(0);
      });

      // Check the last URL contains all parameters
      const lastCall = mockRouter.push.mock.calls[mockRouter.push.mock.calls.length - 1];
      const url = lastCall[0];
      
      expect(url).toContain('income=3000000');
      expect(url).toContain('familySize=6');
      expect(url).toContain('province=DKI+Jakarta');
    });
  });

  describe('Performance: Filter state changes within 500ms (Requirement 1.6)', () => {
    test('filter updates complete within performance budget', async () => {
      const user = userEvent.setup();
      const mockRouter = {
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
      };
      mockUseRouter.mockReturnValue(mockRouter as any);

      render(<MarketplaceTestWrapper />);

      const sidebar = screen.getByTestId('sidebar');
      const incomeInput = within(sidebar).getByLabelText(/penghasilan per bulan/i);
      
      const startTime = performance.now();
      
      await user.clear(incomeInput);
      await user.type(incomeInput, '2500000');

      // Wait for state update and URL sync
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalled();
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 500ms as per Requirement 1.6
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty filter values correctly', async () => {
      const user = userEvent.setup();
      render(<MarketplaceTestWrapper />);

      const sidebar = screen.getByTestId('sidebar');
      
      // Set a value
      const incomeInput = within(sidebar).getByLabelText(/penghasilan per bulan/i);
      await user.clear(incomeInput);
      await user.type(incomeInput, '2000000');

      // Clear the value
      await user.clear(incomeInput);

      // Open modal and verify value is empty
      const modalTrigger = screen.getByRole('button', { name: /open modal filter/i });
      await user.click(modalTrigger);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const dialog = screen.getByRole('dialog');
      const modalIncomeInput = within(dialog).getByLabelText(/penghasilan per bulan/i);
      expect(modalIncomeInput).toHaveValue(null);
    });

    test('handles rapid filter changes without state corruption', async () => {
      const user = userEvent.setup();
      render(<MarketplaceTestWrapper />);

      const sidebar = screen.getByTestId('sidebar');
      const incomeInput = within(sidebar).getByLabelText(/penghasilan per bulan/i);
      
      // Rapidly change values
      for (let i = 1; i <= 5; i++) {
        await user.clear(incomeInput);
        await user.type(incomeInput, `${i}000000`);
      }

      // Final value should be reflected
      await waitFor(() => {
        expect(incomeInput).toHaveValue(5000000);
      });

      // Open modal and verify consistency
      const modalTrigger = screen.getByRole('button', { name: /open modal filter/i });
      await user.click(modalTrigger);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const dialog = screen.getByRole('dialog');
      const modalIncomeInput = within(dialog).getByLabelText(/penghasilan per bulan/i);
      expect(modalIncomeInput).toHaveValue(5000000);
    });

    test('handles conditional fields visibility across both access patterns', async () => {
      const user = userEvent.setup();
      render(<MarketplaceTestWrapper />);

      const sidebar = screen.getByTestId('sidebar');
      
      // Expand advanced filters
      const expandButton = within(sidebar).getByRole('button', { name: /tambah detail/i });
      await user.click(expandButton);

      await waitFor(() => {
        expect(within(sidebar).getByLabelText(/pekerjaan/i)).toBeInTheDocument();
      });

      // Select "Petani" occupation to trigger conditional fields
      const occupationSelect = within(sidebar).getByLabelText(/pekerjaan/i);
      await user.click(occupationSelect);
      
      // Find and click the Petani option
      const petaniOption = await screen.findByRole('option', { name: /petani/i });
      await user.click(petaniOption);

      // Conditional agriculture fields should appear
      await waitFor(() => {
        expect(within(sidebar).getByLabelText(/luas lahan/i)).toBeInTheDocument();
      });

      // Set land size
      const landSizeInput = within(sidebar).getByLabelText(/luas lahan/i);
      await user.clear(landSizeInput);
      await user.type(landSizeInput, '1.5');

      // Open modal
      const modalTrigger = screen.getByRole('button', { name: /open modal filter/i });
      await user.click(modalTrigger);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Modal should show the same occupation and conditional field
      const dialog = screen.getByRole('dialog');
      
      // Expand advanced in modal too
      const modalExpandButton = within(dialog).getByRole('button', { name: /tambah detail/i });
      await user.click(modalExpandButton);

      await waitFor(() => {
        const modalLandSizeInput = within(dialog).getByLabelText(/luas lahan/i);
        expect(modalLandSizeInput).toHaveValue(1.5);
      });
    });
  });
});
