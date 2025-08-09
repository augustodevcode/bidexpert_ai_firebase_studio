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
      const dataSources = await prisma.dataSource.findMany()
      res.json(dataSources)
      break
    case 'POST':
      const { name, type, connectionString } = req.body
      const dataSource = await prisma.dataSource.create({
        data: {
          name,
          type,
          connectionString,
        },
      })
      res.json(dataSource)
      break
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
