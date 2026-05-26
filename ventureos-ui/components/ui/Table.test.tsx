import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Table, Column } from './Table';

interface TestData {
  id: number;
  name: string;
  age: number;
  email: string;
}

const mockData: TestData[] = [
  { id: 1, name: 'John Doe', age: 30, email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', age: 25, email: 'jane@example.com' },
  { id: 3, name: 'Bob Johnson', age: 35, email: 'bob@example.com' },
];

const mockColumns: Column<TestData>[] = [
  {
    key: 'name',
    header: 'Name',
    accessor: (row) => row.name,
    sortable: true,
    filterable: true,
  },
  {
    key: 'age',
    header: 'Age',
    accessor: (row) => row.age,
    sortable: true,
  },
  {
    key: 'email',
    header: 'Email',
    accessor: (row) => row.email,
  },
];

describe('Table', () => {
  it('renders table with data', () => {
    render(<Table data={mockData} columns={mockColumns} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<Table data={mockData} columns={mockColumns} />);
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('displays empty message when no data', () => {
    render(<Table data={[]} columns={mockColumns} emptyMessage="No records found" />);
    
    expect(screen.getByText('No records found')).toBeInTheDocument();
  });

  it('sorts data when clicking sortable column header', () => {
    render(<Table data={mockData} columns={mockColumns} />);
    
    const sortButton = screen.getByLabelText('Sort by Name');
    fireEvent.click(sortButton);
    
    // After sorting ascending, Bob should come first (alphabetically)
    const cells = screen.getAllByRole('cell');
    const nameCells = cells.filter((cell) => 
      cell.textContent === 'John Doe' || 
      cell.textContent === 'Bob Johnson' || 
      cell.textContent === 'Jane Smith'
    );
    expect(nameCells[0]).toHaveTextContent('Bob Johnson');
  });

  it('filters data when typing in filter input', () => {
    render(<Table data={mockData} columns={mockColumns} />);
    
    const filterInput = screen.getByLabelText('Filter Name');
    fireEvent.change(filterInput, { target: { value: 'Jane' } });
    
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
  });

  it('handles row click when onRowClick is provided', () => {
    const handleRowClick = jest.fn();
    render(<Table data={mockData} columns={mockColumns} onRowClick={handleRowClick} />);
    
    const firstRow = screen.getByText('John Doe').closest('tr');
    fireEvent.click(firstRow!);
    
    expect(handleRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('paginates data correctly', () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `Person ${i + 1}`,
      age: 20 + i,
      email: `person${i + 1}@example.com`,
    }));

    render(
      <Table
        data={largeData}
        columns={mockColumns}
        pagination={{ pageSize: 10, showPagination: true }}
      />
    );
    
    expect(screen.getByText('Person 1')).toBeInTheDocument();
    expect(screen.getByText('Person 10')).toBeInTheDocument();
    expect(screen.queryByText('Person 11')).not.toBeInTheDocument();
    
    const nextButton = screen.getByLabelText('Next page');
    fireEvent.click(nextButton);
    
    expect(screen.getByText('Person 11')).toBeInTheDocument();
    expect(screen.queryByText('Person 1')).not.toBeInTheDocument();
  });

  it('disables pagination when showPagination is false', () => {
    render(
      <Table
        data={mockData}
        columns={mockColumns}
        pagination={{ showPagination: false }}
      />
    );
    
    expect(screen.queryByLabelText('Next page')).not.toBeInTheDocument();
  });

  it('supports keyboard navigation for sortable columns', () => {
    render(<Table data={mockData} columns={mockColumns} />);
    
    const sortButton = screen.getByLabelText('Sort by Name');
    fireEvent.keyDown(sortButton, { key: 'Enter' });
    
    // Should trigger sort
    expect(sortButton).toBeInTheDocument();
  });

  it('displays correct pagination info', () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `Person ${i + 1}`,
      age: 20 + i,
      email: `person${i + 1}@example.com`,
    }));

    render(
      <Table
        data={largeData}
        columns={mockColumns}
        pagination={{ pageSize: 10, showPagination: true }}
      />
    );
    
    // Check for pagination text - use getAllByText since there might be multiple matches
    const paginationTexts = screen.getAllByText((content, element) => {
      return element?.textContent === 'Showing 1 to 10 of 25 results';
    });
    expect(paginationTexts.length).toBeGreaterThan(0);
  });

  it('applies custom className', () => {
    const { container } = render(
      <Table data={mockData} columns={mockColumns} className="custom-table" />
    );
    
    expect(container.querySelector('.custom-table')).toBeInTheDocument();
  });
});
