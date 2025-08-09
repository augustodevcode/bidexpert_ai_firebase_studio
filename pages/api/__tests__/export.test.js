import { createMocks } from 'node-mocks-http';
import handle from '../export';
import * as renderer from '../../../reporting-engine/core/renderer';

vi.mock('../../../reporting-engine/core/renderer', () => ({
  render: vi.fn(),
}));

describe('/api/export', () => {
  it('should export a report to the specified format', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        format: 'pdf',
        report: { title: 'Test Report' },
      },
    });

    await handle(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getHeaders()['content-disposition']).toBe(
      'attachment; filename="report.pdf"'
    );
    expect(renderer.render).toHaveBeenCalledWith(
      { title: 'Test Report' },
      'pdf'
    );
  });
});
