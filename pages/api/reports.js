import { PrismaClient } from '@prisma/client'
import { getSession } from 'next-auth/client'

const prisma = new PrismaClient()

const replaceVariables = async (definition, context) => {
  // This is a placeholder for the actual implementation
  // You will need to parse the definition and replace the variables
  // with the actual data from the database.
  let definitionString = JSON.stringify(definition);
  for (const key in context) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    definitionString = definitionString.replace(regex, context[key]);
  }
  return JSON.parse(definitionString);
};

export default async function handle(req, res) {
  const session = await getSession({ req })

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { method } = req

  switch (method) {
    case 'GET':
      if (req.query.id) {
        const report = await prisma.report.findUnique({
          where: { id: parseInt(req.query.id) },
        });
        const context = {
          'user.name': session.user.name,
          'user.email': session.user.email,
        };
        const updatedDefinition = await replaceVariables(report.definition, context);
        res.json({ ...report, definition: updatedDefinition });
      } else {
        const reports = await prisma.report.findMany({
          where: { ownerId: session.user.id },
        });
        res.json(reports);
      }
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
