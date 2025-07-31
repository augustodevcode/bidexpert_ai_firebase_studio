import React from 'react';
import { render } from '@testing-library/react';
import { ChartComponent } from '../chart';
import { vi } from 'vitest';

vi.mock('react-chartjs-2', () => ({
  Bar: () => <div>Bar Chart</div>,
}));

describe('ChartComponent', () => {
  it('should render a bar chart', () => {
    const properties = {
      data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [
          {
            label: '# of Votes',
            data: [12, 19, 3, 5, 2, 3],
          },
        ],
      },
    };
    const component = new ChartComponent(properties);
    const { getByText } = render(component.render());
    expect(getByText('Bar Chart')).toBeInTheDocument();
  });
});
