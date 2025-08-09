import { getSession } from 'next-auth/client'

export default async function handle(req, res) {
  const session = await getSession({ req })

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { method } = req

  switch (method) {
    case 'POST':
      const { format, report } = req.body

      // This is a placeholder for the actual implementation
      // You will need to use the DevExpress Reporting API to export the report
      res.setHeader('Content-Disposition', `attachment; filename="report.${format}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.send('This is a mock file.');
      break
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
