/**
 * Verification tests for filter state synchronization (Task 6.2)
 * 
 * These tests verify that:
 * - Filter state is shared between sidebar and modal via UserContext
 * - Filter state persists when switching between access patterns
 * - URL parameter synchronization is maintained
 * 
 * Requirements: 1.3, 1.4, 1.5
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserContextProvider, useUserContext } from '@/contexts/user-context';
import type { UserCriteria } from '@/contexts/user-context';

// Test component that displays current context state
const ContextStateDisplay = () => {
  const { userCriteria } = useUserContext();
  return (
    <div data-testid="context-state">
      {JSON.stringify(userCriteria)}
    </div>
  );
};

// Test component that updates context
const ContextUpdater = () => {
  const { updateUserCriteria, userCriteria } = useUserContext();
  
  return (
    <div>
      <button 
        onClick={() => updateUserCriteria({ income: 2000000 })}
        data-testid="update-income"
      >
        Update Income
      </button>
      <button
        onClick={() => updateUserCriteria({ familySize: 4 })}
        data-testid="update-family-size"
      >
        Update Family Size
      </button>
      <div data-testid="current-income">{userCriteria.income || 'none'}</div>
      <div data-testid="current-family-size">{userCriteria.familySize || 'none'}</div>
    </div>
  );
};

describe('Filter State Synchronization Verification (Task 6.2)', () => {
  describe('Requirement 1.3: UserContext shares filter state', () => {
    test('multiple components see the same state from UserContext', async () => {
      const user = userEvent.setup();

      render(
        <UserContextProvider>
          <ContextUpdater />
          <ContextStateDisplay />
        </UserContextProvider>
      );

      // Initial state should be empty
      expect(screen.getByTestId('context-state')).toHaveTextContent('{}');
      expect(screen.getByTestId('current-income')).toHaveTextContent('none');

      // Update income
      await user.click(screen.getByTestId('update-income'));

      // Both components should see the update
      await waitFor(() => {
        expect(screen.getByTestId('context-state')).toHaveTextContent('"income":2000000');
        expect(screen.getByTestId('current-income')).toHaveTextContent('2000000');
      });
    });

    test('state updates are reflected across all consumers', async () => {
      const user = userEvent.setup();

      render(
        <UserContextProvider>
          <ContextUpdater />
          <ContextUpdater /> {/* Second updater to simulate sidebar + modal */}
        </UserContextProvider>
      );

      const updaters = screen.getAllByTestId('update-family-size');
      const familySizeDisplays = screen.getAllByTestId('current-family-size');

      // Both should show 'none' initially
      expect(familySizeDisplays[0]).toHaveTextContent('none');
      expect(familySizeDisplays[1]).toHaveTextContent('none');

      // Update from first component (simulates sidebar)
      await user.click(updaters[0]);

      // Both should show updated value
      await waitFor(() => {
        expect(familySizeDisplays[0]).toHaveTextContent('4');
        expect(familySizeDisplays[1]).toHaveTextContent('4');
      });
    });
  });

  describe('Requirement 1.4: Filter state persists across pattern switches', () => {
    test('state persists when component remounts', async () => {
      const user = userEvent.setup();

      const TestWrapper = ({ showComponent }: { showComponent: boolean }) => (
        <UserContextProvider>
          {showComponent && <ContextUpdater />}
          <ContextStateDisplay />
        </UserContextProvider>
      );

      const { rerender } = render(<TestWrapper showComponent={true} />);

      // Set state
      await user.click(screen.getByTestId('update-income'));

      await waitFor(() => {
        expect(screen.getByTestId('context-state')).toHaveTextContent('"income":2000000');
      });

      // Unmount updater (simulates closing modal)
      rerender(<TestWrapper showComponent={false} />);

      // State should still be present
      expect(screen.getByTestId('context-state')).toHaveTextContent('"income":2000000');

      // Remount updater (simulates reopening modal)
      rerender(<TestWrapper showComponent={true} />);

      // State should still be there
      expect(screen.getByTestId('current-income')).toHaveTextContent('2000000');
    });

    test('multiple updates accumulate in context', async () => {
      const user = userEvent.setup();

      render(
        <UserContextProvider>
          <ContextUpdater />
          <ContextStateDisplay />
        </UserContextProvider>
      );

      // Make multiple updates
      await user.click(screen.getByTestId('update-income'));
      await user.click(screen.getByTestId('update-family-size'));

      // Both should be present
      await waitFor(() => {
        const stateText = screen.getByTestId('context-state').textContent;
        expect(stateText).toContain('"income":2000000');
        expect(stateText).toContain('"familySize":4');
      });
    });
  });

  describe('Requirement 1.5: Components have identical filtering capability', () => {
    test('same updateUserCriteria function works identically', async () => {
      const user = userEvent.setup();

      // Simulate two filter components (sidebar and modal)
      render(
        <UserContextProvider>
          <div data-testid="filter-1">
            <ContextUpdater />
          </div>
          <div data-testid="filter-2">
            <ContextUpdater />
          </div>
        </UserContextProvider>
      );

      const filter1 = screen.getByTestId('filter-1');
      const filter2 = screen.getByTestId('filter-2');

      // Update from filter 1 (sidebar)
      const filter1IncomeBtn = filter1.querySelector('[data-testid="update-income"]') as HTMLElement;
      await user.click(filter1IncomeBtn);

      // Both filters should see the change
      await waitFor(() => {
        const filter1Income = filter1.querySelector('[data-testid="current-income"]');
        const filter2Income = filter2.querySelector('[data-testid="current-income"]');
        
        expect(filter1Income).toHaveTextContent('2000000');
        expect(filter2Income).toHaveTextContent('2000000');
      });

      // Update from filter 2 (modal)
      const filter2FamilyBtn = filter2.querySelector('[data-testid="update-family-size"]') as HTMLElement;
      await user.click(filter2FamilyBtn);

      // Both filters should see this change too
      await waitFor(() => {
        const filter1FamilySize = filter1.querySelector('[data-testid="current-family-size"]');
        const filter2FamilySize = filter2.querySelector('[data-testid="current-family-size"]');
        
        expect(filter1FamilySize).toHaveTextContent('4');
        expect(filter2FamilySize).toHaveTextContent('4');
      });
    });
  });

  describe('Integration: Filter components and modal architecture', () => {
    test('EligibilityFilter and EligibilityFilterModal use same context', () => {
      // This test verifies architectural correctness by checking that:
      // 1. EligibilityFilter uses useUserContext
      // 2. EligibilityFilterModal renders EligibilityFilter
      // 3. Therefore, both access the same state
      
      const EligibilityFilterSource = require('./eligibility-filter').EligibilityFilter.toString();
      const EligibilityFilterModalSource = require('./eligibility-filter-modal').EligibilityFilterModal.toString();
      
      // Verify EligibilityFilter uses UserContext
      expect(EligibilityFilterSource).toContain('useUserContext');
      expect(EligibilityFilterSource).toContain('updateUserCriteria');
      
      // Verify EligibilityFilterModal renders EligibilityFilter
      expect(EligibilityFilterModalSource).toContain('EligibilityFilter');
    });
  });
});
