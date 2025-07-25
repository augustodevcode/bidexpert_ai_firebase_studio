import { PrismaClient } from '@prisma/client'
import { getSession } from 'next-auth/client'

const prisma = new PrismaClient()

export default async function handle(req, res) {
  const session = await getSession({ req })

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { method } = req

  switch (method) {
    case 'GET':
      const reports = await prisma.report.findMany({
        where: { ownerId: session.user.id },
      })
      res.json(reports)
      break
    case 'POST':
      const { title, description, definition } = req.body
      const report = await prisma.report.create({
        data: {
          title,
          description,
          definition,
          owner: { connect: { id: session.user.id } },
        },
      })
      res.json(report)
      break
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
