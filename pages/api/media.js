import { getSession } from 'next-auth/client'

export default async function handle(req, res) {
  const session = await getSession({ req })

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const images = [
    {
      id: 1,
      name: 'Auction Hammer',
      url: 'https://via.placeholder.com/150',
    },
    {
      id: 2,
      name: 'Winning Bid',
      url: 'https://via.placeholder.com/150',
    },
    {
      id: 3,
      name: 'Lot 123',
      url: 'https://via.placeholder.com/150',
    },
  ]

  res.json(images)
}
