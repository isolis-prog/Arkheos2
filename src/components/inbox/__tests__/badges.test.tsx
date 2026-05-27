import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModulePill, moduleLabel } from '@/components/inbox/ModulePill';
import { SeverityBadge } from '@/components/inbox/SeverityBadge';

describe('ModulePill', () => {
  it('renders Reconciliations label', () => {
    render(<ModulePill module="reconciliations" />);
    expect(screen.getByText('Reconciliations')).toBeInTheDocument();
  });

  it('renders Cashflows label', () => {
    render(<ModulePill module="cashflows" />);
    expect(screen.getByText('Cashflows')).toBeInTheDocument();
  });

  it('renders Valuation label', () => {
    render(<ModulePill module="valuation_recon" />);
    expect(screen.getByText('Valuation')).toBeInTheDocument();
  });

  it('renders Confirmations label', () => {
    render(<ModulePill module="confirmations_recon" />);
    expect(screen.getByText('Confirmations')).toBeInTheDocument();
  });

  it('uses short label when compact', () => {
    render(<ModulePill module="reconciliations" compact />);
    expect(screen.getByText('Recon')).toBeInTheDocument();
  });

  it('moduleLabel returns full name', () => {
    expect(moduleLabel('cashflows')).toBe('Cashflows');
    expect(moduleLabel('valuation_recon')).toBe('Valuation');
  });
});

describe('SeverityBadge', () => {
  it('renders Critical', () => {
    render(<SeverityBadge severity="critical" />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('renders Material', () => {
    render(<SeverityBadge severity="material" />);
    expect(screen.getByText('Material')).toBeInTheDocument();
  });

  it('renders Review', () => {
    render(<SeverityBadge severity="review" />);
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('applies destructive class for critical', () => {
    const { container } = render(<SeverityBadge severity="critical" />);
    expect(container.firstChild).toHaveClass('text-destructive');
  });

  it('applies warning class for material', () => {
    const { container } = render(<SeverityBadge severity="material" />);
    expect(container.firstChild).toHaveClass('text-warning');
  });

  it('applies muted class for review', () => {
    const { container } = render(<SeverityBadge severity="review" />);
    expect(container.firstChild).toHaveClass('text-muted-foreground');
  });
});
