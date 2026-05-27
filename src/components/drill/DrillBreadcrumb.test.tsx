import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DrillBreadcrumb } from './DrillBreadcrumb';
import type { DrillPathNode } from './types';

const basePath: DrillPathNode[] = [
  { level: 0, label: 'Home', scope: {}, href: '/home' },
  { level: 1, label: 'Runs', scope: {}, href: '/runs' },
  { level: 2, label: 'March', scope: {}, href: '/march' },
  { level: 3, label: 'Desk', scope: {}, href: '/desk' },
  { level: 4, label: 'Counterparty', scope: {}, href: '/cp' },
  { level: 5, label: 'Document', scope: {}, href: '/doc' },
];

describe('DrillBreadcrumb', () => {
  it('collapses intermediate nodes when path is long', () => {
    render(<DrillBreadcrumb path={basePath} onNavigate={() => undefined} />);
    expect(screen.getByRole('button', { name: /mostrar niveles intermedios/i })).toBeInTheDocument();
    expect(screen.getByText('Document')).toBeInTheDocument();
  });

  it('navigates when clicking a non-terminal node', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<DrillBreadcrumb path={basePath.slice(0, 4)} onNavigate={onNavigate} />);

    await user.click(screen.getByRole('button', { name: 'Runs' }));
    expect(onNavigate).toHaveBeenCalledWith(basePath[1]);
  });
});
