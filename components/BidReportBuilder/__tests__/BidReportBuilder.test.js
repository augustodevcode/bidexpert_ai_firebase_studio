import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BidReportBuilder from '../index';

describe('BidReportBuilder', () => {
  it('renders the report builder', () => {
    render(<BidReportBuilder />);
    expect(screen.getByText('Bid Report Builder')).toBeInTheDocument();
  });
});
