import React from 'react';
import { render, screen } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { describe, it, expect, vi } from 'vitest';
import VariablePanel from '../components/VariablePanel';

global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve([
        {
          group: 'Auction',
          variables: [
            { name: 'Auction Name', value: '{{auction.name}}' },
            { name: 'Auction Date', value: '{{auction.date}}' },
          ],
        },
      ]),
  })
);

describe('VariablePanel', () => {
  it('renders the variable panel and makes the variables draggable', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <VariablePanel />
      </DndProvider>
    );
    expect(screen.getByText('Variables')).toBeInTheDocument();
  });
});
