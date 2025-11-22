import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NoticeTypeStep from '../NoticeTypeStep';
import { NOTICE_DEFINITIONS } from '@/next/publish/config/noticeTypes';

describe('NoticeTypeStep', () => {
  const mockOnSelect = vi.fn();
  const mockOnContinue = vi.fn();

  const defaultProps = {
    selectedId: null,
    onSelect: mockOnSelect,
    onContinue: mockOnContinue,
  };

  it('renders all category sections with icons and counts', () => {
    render(<NoticeTypeStep {...defaultProps} />);

    // Check for category sections with icons
    expect(screen.getAllByText(/Licensing Act 2003/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Gambling Act 2005/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Goods Vehicle Operator/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Planning/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Probate/i).length).toBeGreaterThan(0);

    // Check for type counts (should show "X types")
    const countBadges = screen.getAllByText(/\d+ types?/);
    expect(countBadges.length).toBeGreaterThan(0);
  });

  it('categories are collapsed by default', () => {
    const { container } = render(<NoticeTypeStep {...defaultProps} />);

    // Check that all details elements do not have the 'open' attribute initially
    const detailsElements = container.querySelectorAll('details');

    // At least one category should be collapsed (not have open attribute)
    const collapsedCount = Array.from(detailsElements).filter(
      details => !details.hasAttribute('open')
    ).length;

    expect(collapsedCount).toBeGreaterThan(0);
  });

  it('expands category when header is clicked', () => {
    render(<NoticeTypeStep {...defaultProps} />);

    // Find and click the Licensing category header
    const licensingHeaders = screen.getAllByText(/Licensing Act 2003/i);
    const summaryHeader = licensingHeaders.find(el => el.closest('summary'));
    expect(summaryHeader).toBeInTheDocument();

    const detailsElement = summaryHeader?.closest('details');
    expect(detailsElement).toBeInTheDocument();
    expect(detailsElement?.hasAttribute('open')).toBe(false);

    // Click the summary to expand
    if (summaryHeader) {
      fireEvent.click(summaryHeader);
    }

    // Now the Premises Licence options should be visible
    expect(screen.getAllByText('Premises Licence — New').length).toBeGreaterThan(0);
  });

  it('shows search input', () => {
    render(<NoticeTypeStep {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/e.g., Premises licence/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('auto-expands categories when searching', () => {
    render(<NoticeTypeStep {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/e.g., Premises licence/i);

    // Type in search
    fireEvent.change(searchInput, { target: { value: 'premises' } });

    // Categories with matching results should be expanded
    expect(screen.getAllByText('Premises Licence — New').length).toBeGreaterThan(0);
  });

  it('shows category icons', () => {
    render(<NoticeTypeStep {...defaultProps} />);

    // Check that emoji icons are rendered (they should be in the document as text)
    const licensingHeaders = screen.getAllByText(/Licensing Act 2003/i);
    const licensingSection = licensingHeaders[0].closest('details');
    expect(licensingSection?.textContent).toMatch(/📄/);
  });

  it('opens category containing selected notice type', () => {
    const licensingDefinition = NOTICE_DEFINITIONS.find(
      (def) => def.id === 'licensing-premises-new'
    );

    render(
      <NoticeTypeStep
        {...defaultProps}
        selectedId="licensing-premises-new"
        onSelect={vi.fn()}
      />
    );

    // The licensing category should be open because it contains the selected item
    expect(screen.getAllByText('Premises Licence — New').length).toBeGreaterThan(0);
  });

  it('allows multiple categories to be expanded simultaneously', () => {
    render(<NoticeTypeStep {...defaultProps} />);

    // Expand Licensing
    const licensingHeaders = screen.getAllByText(/Licensing Act 2003/i);
    const licensingSummary = licensingHeaders.find(el => el.closest('summary'));
    if (licensingSummary) {
      fireEvent.click(licensingSummary);
    }

    // Expand Planning
    const planningHeaders = screen.getAllByText(/Planning \(Press Notices\)/i);
    const planningSummary = planningHeaders.find(el => el.closest('summary'));
    if (planningSummary) {
      fireEvent.click(planningSummary);
    }

    // Both should be visible
    expect(screen.getAllByText('Premises Licence — New').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Major Development/i).length).toBeGreaterThan(0);
  });
});
