// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  url: string,
  name: string
  
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  res.status(200).json({ url: 'https://badgerscollectif.com', name: 'Collectif of the Badgers Diamond Hands' })
}
