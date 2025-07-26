import { getSession } from 'next-auth/client'

export default async function handle(req, res) {
  const session = await getSession({ req })

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const variables = [
    {
      group: 'Auction',
      variables: [
        { name: 'Auction Name', value: '{{auction.name}}' },
        { name: 'Auction Date', value: '{{auction.date}}' },
      ],
    },
    {
      group: 'Lot',
      variables: [
        { name: 'Lot Number', value: '{{lot.number}}' },
        { name: 'Lot Description', value: '{{lot.description}}' },
      ],
    },
    {
      group: 'User',
      variables: [
        { name: 'User Name', value: '{{user.name}}' },
        { name: 'User Email', value: '{{user.email}}' },
      ],
    },
  ]

  res.json(variables)
}
