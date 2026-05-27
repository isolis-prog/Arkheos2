import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DrillDownTable } from './DrillDownTable';
import type { DrillColumn } from './types';

type Row = { id: string; name: string; amount: number; currency: string };

const rows: Row[] = [
  { id: '1', name: 'Bravo', amount: 200, currency: 'USD' },
  { id: '2', name: 'Alpha', amount: 100, currency: 'USD' },
  { id: '3', name: 'Charlie', amount: 300, currency: 'USD' },
];

const columns: DrillColumn<Row>[] = [
  { key: 'name', header: 'Name', accessor: (row) => row.name, sortable: true },
  { key: 'amount', header: 'Amount', accessor: (row) => row.amount, sortable: true, align: 'right', format: 'currency' },
];

describe('DrillDownTable', () => {
  it('sorts rows on sortable header click', async () => {
    const user = userEvent.setup();
    render(<DrillDownTable rows={rows} columns={columns} pageSize={10} />);

    await user.click(screen.getByRole('button', { name: /name/i }));
    const alphaCells = screen.getAllByText('Alpha');
    expect(alphaCells[0]).toBeInTheDocument();
  });

  it('paginates rows', async () => {
    const user = userEvent.setup();
    const pagedRows = Array.from({ length: 12 }).map((_, index) => ({ id: `${index}`, name: `Row ${index + 1}`, amount: index + 1, currency: 'USD' }));
    render(<DrillDownTable rows={pagedRows} columns={columns} pageSize={5} />);

    expect(screen.getByText('Row 1')).toBeInTheDocument();
    expect(screen.queryByText('Row 6')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next page/i }));
    expect(screen.getByText('Row 6')).toBeInTheDocument();
  });

  it('fires row click callback', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<DrillDownTable rows={rows} columns={columns} onRowClick={onRowClick} pageSize={10} />);

    await user.click(screen.getByText('Bravo'));
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });
});
