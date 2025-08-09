import React from 'react';
import { render, screen } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { describe, it, expect, vi } from 'vitest';
import BidReportBuilder from '../index';

global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve([]),
  })
);

describe('BidReportBuilder', () => {
  it('renders the report builder', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <BidReportBuilder />
      </DndProvider>
    );
    expect(screen.getByText('Bid Report Builder')).toBeInTheDocument();
  });
});
