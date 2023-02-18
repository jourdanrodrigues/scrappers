import type {NextApiRequest, NextApiResponse} from 'next'
import {Registries, Registry} from '@/registries'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Registry[] | { message: string }>,
) {
  if (req.method === 'GET')  return res.status(201).json(Registries.getAll())
  res.status(405).json({message: 'Method not allowed'})
}
