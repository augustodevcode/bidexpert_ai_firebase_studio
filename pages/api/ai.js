import { getSession } from 'next-auth/client'
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handle(req, res) {
  const session = await getSession({ req })

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { method } = req

  switch (method) {
    case 'POST':
      const { query, type } = req.body

      try {
        if (type === 'nlq') {
          const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: `Convert the following natural language query to SQL: ${query}` }],
          });
          res.json({ query: completion.choices[0].message.content })
        } else if (type === 'chart-recommendation') {
          const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Recommend a chart type for the following data: ...' }],
          });
          res.json({ chartType: completion.choices[0].message.content })
        } else if (type === 'layout-suggestion') {
          const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Suggest a layout for a report with the following elements: ...' }],
          });
          res.json({ layout: completion.choices[0].message.content })
        } else {
          res.status(400).json({ message: 'Invalid AI request type' })
        }
      } catch (error) {
        res.status(500).json({ message: 'Error processing AI request', error: error.message })
      }
      break
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
