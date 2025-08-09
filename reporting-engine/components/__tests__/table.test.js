import React from 'react';
import { render } from '@testing-library/react';
import { TableComponent } from '../table';
import { vi } from 'vitest';

describe('TableComponent', () => {
  it('should render a table', () => {
    const properties = {
      data: [
        { id: 1, name: 'Auction 1', date: '2025-01-01' },
        { id: 2, name: 'Auction 2', date: '2025-02-01' },
        { id: 3, name: 'Auction 3', date: '2025-03-01' },
      ],
    };
    const component = new TableComponent(properties);
    const { getByText } = render(component.render());
    expect(getByText('Auction 1')).toBeInTheDocument();
    expect(getByText('Auction 2')).toBeInTheDocument();
    expect(getByText('Auction 3')).toBeInTheDocument();
  });
});
