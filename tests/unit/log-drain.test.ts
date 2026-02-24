/**
 * Tests for the Log Drain API endpoint
 * This endpoint receives logs from Vercel and creates GitHub issues for errors
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/log-drain/route';
import { NextRequest } from 'next/server';

// Mock Octokit using hoisted variables to avoid TDZ issues
const { mockCreateIssue } = vi.hoisted(() => ({
  mockCreateIssue: vi.fn().mockResolvedValue({
    data: {
      html_url: 'https://github.com/augustodevcode/bidexpert_ai_firebase_studio/issues/123'
    }
  }),
}));

vi.mock('@octokit/rest', () => ({
  Octokit: function MockOctokit() {
    return {
      issues: {
        create: mockCreateIssue,
      },
    };
  },
}));

describe('Log Drain API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set environment variables for tests
    process.env.LOG_DRAIN_SECRET = 'test-secret-key';
    process.env.GITHUB_TOKEN = 'test-github-token';
  });

  it('should reject requests without authorization', async () => {
    const request = new NextRequest('http://localhost:3000/api/log-drain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([]),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('should reject requests with invalid authorization', async () => {
    const request = new NextRequest('http://localhost:3000/api/log-drain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer wrong-secret',
      },
      body: JSON.stringify([]),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('should accept requests with valid authorization', async () => {
    const request = new NextRequest('http://localhost:3000/api/log-drain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-secret-key',
      },
      body: JSON.stringify([]),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('processed');
    expect(data).toHaveProperty('errors');
  });

  it('should filter only error logs', async () => {
    const logs = [
      {
        id: 'log-1',
        message: 'Info message',
        timestamp: Date.now(),
        source: 'lambda',
        type: 'stdout' as const,
        level: 'info' as const,
      },
      {
        id: 'log-2',
        message: 'Error: Something went wrong',
        timestamp: Date.now(),
        source: 'lambda',
        type: 'lambda-error' as const,
      },
      {
        id: 'log-3',
        message: 'Warning message',
        timestamp: Date.now(),
        source: 'lambda',
        type: 'stdout' as const,
        level: 'warn' as const,
      },
    ];

    const request = new NextRequest('http://localhost:3000/api/log-drain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-secret-key',
      },
      body: JSON.stringify(logs),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.processed).toBe(3);
    expect(data.errors).toBe(1); // Only the lambda-error should be counted
  });

  it('should process edge errors', async () => {
    const logs = [
      {
        id: 'log-1',
        message: 'Edge error occurred',
        timestamp: Date.now(),
        source: 'edge',
        type: 'edge-error' as const,
      },
    ];

    const request = new NextRequest('http://localhost:3000/api/log-drain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-secret-key',
      },
      body: JSON.stringify(logs),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.errors).toBe(1);
  });

  it('should process stderr with error level', async () => {
    const logs = [
      {
        id: 'log-1',
        message: 'Stderr error message',
        timestamp: Date.now(),
        source: 'lambda',
        type: 'stderr' as const,
        level: 'error' as const,
      },
    ];

    const request = new NextRequest('http://localhost:3000/api/log-drain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-secret-key',
      },
      body: JSON.stringify(logs),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.errors).toBe(1);
  });

  it('should process messages containing "error"', async () => {
    const logs = [
      {
        id: 'log-1',
        message: 'Something error happened in the system',
        timestamp: Date.now(),
        source: 'lambda',
        type: 'stdout' as const,
      },
    ];

    const request = new NextRequest('http://localhost:3000/api/log-drain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-secret-key',
      },
      body: JSON.stringify(logs),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.errors).toBe(1);
  });
});
