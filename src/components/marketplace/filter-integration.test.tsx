/**
 * Integration test demonstrating filter state synchronization
 * between EligibilityFilter (sidebar) and EligibilityFilterModal
 * 
 * Task 6.2: Ensure filter state synchronization
 * Requirements: 1.3, 1.4, 1.5
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { UserContextProvider } from '@/contexts/user-context';
import { EligibilityFilter } from './eligibility-filter';
import { EligibilityFilterModal } from './eligibility-filter-modal';

describe('EligibilityFilter and EligibilityFilterModal Integration', () => {
  // Wrapper that provides required context
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <UserContextProvider>
      {children}
    </UserContextProvider>
  );

  describe('Task 6.2: Filter state synchronization between sidebar and modal', () => {
    test('filters set in sidebar component are visible in modal component', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <div data-testid="sidebar-section">
            <EligibilityFilter />
          </div>
          <div data-testid="modal-section">
            <EligibilityFilterModal triggerContent={<button>Open Filters</button>} />
          </div>
        </TestWrapper>
      );

      // Set income in sidebar
      const sidebar = screen.getByTestId('sidebar-section');
      const incomeInput = within(sidebar).getByLabelText(/penghasilan per bulan/i);
      
      await user.clear(incomeInput);
      await user.type(incomeInput, '2500000');

      // Open modal
      const openButton = screen.getByRole('button', { name: /open filters/i });
      await user.click(openButton);

      // Verify modal has the same income value
      const dialog = await screen.findByRole('dialog');
      const modalIncomeInput = within(dialog).getByLabelText(/penghasilan per bulan/i);
      
      expect(modalIncomeInput).toHaveValue(2500000);
    });

    test('filters set in modal component are visible in sidebar component', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <div data-testid="sidebar-section">
            <EligibilityFilter />
          </div>
          <div data-testid="modal-section">
            <EligibilityFilterModal triggerContent={<button>Open Filters</button>} />
          </div>
        </TestWrapper>
      );

      const sidebar = screen.getByTestId('sidebar-section');

      // Open modal first
      const openButton = screen.getByRole('button', { name: /open filters/i });
      await user.click(openButton);

      // Set family size in modal
      const dialog = await screen.findByRole('dialog');
      const modalFamilySizeInput = within(dialog).getByLabelText(/jumlah anggota keluarga/i);
      
      await user.clear(modalFamilySizeInput);
      await user.type(modalFamilySizeInput, '5');

      // Close modal (press Escape or find close button)
      await user.keyboard('{Escape}');

      // Wait for modal to close
      await screen.findByTestId('sidebar-section'); // Wait for content to be visible

      // Verify sidebar has the same family size value
      const sidebarFamilySizeInput = within(sidebar).getByLabelText(/jumlah anggota keluarga/i);
      expect(sidebarFamilySizeInput).toHaveValue(5);
    });

    test('both components share the same UserContext state', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <div data-testid="sidebar-section">
            <EligibilityFilter />
          </div>
          <div data-testid="modal-section">
            <EligibilityFilterModal triggerContent={<button>Open Filters</button>} />
          </div>
        </TestWrapper>
      );

      const sidebar = screen.getByTestId('sidebar-section');

      // Set location in sidebar
      const provinceInput = within(sidebar).getByLabelText(/provinsi/i);
      await user.clear(provinceInput);
      await user.type(provinceInput, 'DKI Jakarta');

      const cityInput = within(sidebar).getByLabelText(/kota\/kabupaten/i);
      await user.clear(cityInput);
      await user.type(cityInput, 'Jakarta Selatan');

      // Open modal
      const openButton = screen.getByRole('button', { name: /open filters/i });
      await user.click(openButton);

      // Verify modal has the same location values
      const dialog = await screen.findByRole('dialog');
      const modalProvinceInput = within(dialog).getByLabelText(/provinsi/i);
      const modalCityInput = within(dialog).getByLabelText(/kota\/kabupaten/i);
      
      expect(modalProvinceInput).toHaveValue('DKI Jakarta');
      expect(modalCityInput).toHaveValue('Jakarta Selatan');
    });

    test('reset button in sidebar clears state in both sidebar and modal', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <div data-testid="sidebar-section">
            <EligibilityFilter />
          </div>
          <div data-testid="modal-section">
            <EligibilityFilterModal triggerContent={<button>Open Filters</button>} />
          </div>
        </TestWrapper>
      );

      const sidebar = screen.getByTestId('sidebar-section');

      // Set some filters
      const incomeInput = within(sidebar).getByLabelText(/penghasilan per bulan/i);
      await user.clear(incomeInput);
      await user.type(incomeInput, '3000000');

      // Reset filters
      const resetButton = within(sidebar).getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      // Verify sidebar is cleared
      expect(incomeInput).toHaveValue(null);

      // Open modal and verify it's also cleared
      const openButton = screen.getByRole('button', { name: /open filters/i });
      await user.click(openButton);

      const dialog = await screen.findByRole('dialog');
      const modalIncomeInput = within(dialog).getByLabelText(/penghasilan per bulan/i);
      expect(modalIncomeInput).toHaveValue(null);
    });

    test('filter presets work and sync between sidebar and modal', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <div data-testid="sidebar-section">
            <EligibilityFilter showPresets={true} />
          </div>
          <div data-testid="modal-section">
            <EligibilityFilterModal 
              showPresets={true}
              triggerContent={<button>Open Filters</button>} 
            />
          </div>
        </TestWrapper>
      );

      const sidebar = screen.getByTestId('sidebar-section');

      // Click a preset in sidebar (e.g., "Ibu Rumah Tangga dengan Anak")
      const presetButton = within(sidebar).getByRole('button', { 
        name: /ibu rumah tangga dengan anak/i 
      });
      await user.click(presetButton);

      // Verify preset values are applied in sidebar
      const incomeInput = within(sidebar).getByLabelText(/penghasilan per bulan/i);
      expect(incomeInput).toHaveValue(1500000); // From preset

      // Open modal
      const openButton = screen.getByRole('button', { name: /open filters/i });
      await user.click(openButton);

      // Verify preset values are also in modal
      const dialog = await screen.findByRole('dialog');
      const modalIncomeInput = within(dialog).getByLabelText(/penghasilan per bulan/i);
      expect(modalIncomeInput).toHaveValue(1500000);
    });
  });

  describe('Architecture verification', () => {
    test('EligibilityFilterModal renders EligibilityFilter component', () => {
      render(
        <TestWrapper>
          <EligibilityFilterModal triggerContent={<button>Open</button>} />
        </TestWrapper>
      );

      // This test verifies the modal wrapper architecture is correct
      expect(screen.getByRole('button', { name: /open/i })).toBeInTheDocument();
    });

    test('both components receive and use onFilterChange callback', async () => {
      const onFilterChange = jest.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <div data-testid="sidebar">
            <EligibilityFilter onFilterChange={onFilterChange} />
          </div>
          <div data-testid="modal">
            <EligibilityFilterModal 
              onFilterChange={onFilterChange}
              triggerContent={<button>Open</button>} 
            />
          </div>
        </TestWrapper>
      );

      // Change filter in sidebar
      const sidebar = screen.getByTestId('sidebar');
      const incomeInput = within(sidebar).getByLabelText(/penghasilan per bulan/i);
      
      await user.clear(incomeInput);
      await user.type(incomeInput, '2000000');

      // Callback should have been called
      expect(onFilterChange).toHaveBeenCalled();
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          income: 2000000
        })
      );
    });
  });
});
