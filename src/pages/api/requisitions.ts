import type {NextApiRequest, NextApiResponse} from 'next'
import {Requisition} from '@prisma/client'
import {z} from 'zod'
import Registries from '@/registries'
import prisma from '@/clients/prisma'

const types = Registries.getTypes()

const requisitionSchema = z.object({
  number: z.string(),
  password: z.string(),
  registryId: z.number(),
  type: z.union([
    z.literal(types[0]),
    z.literal(types[1]),
    ...types.slice(2).map(type => z.literal(type)),
  ]),
  email: z.string().optional(),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Requisition | { message: string }>,
) {
  if (req.method === 'POST') return handleRequisitionCreation(req, res)
  res.status(405).json({message: 'Method not allowed'})
}

async function handleRequisitionCreation(req: NextApiRequest, res: NextApiResponse) {
  const result = requisitionSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({message: result.error.message})
  }
  const {data: {email, ...data}} = result
  if (!Registries.existForId(data.registryId)) {
    return res.status(404).json({message: 'Registry not found'})
  }
  const requisition = await prisma.requisition.create({data})
  if (email) {
    await prisma.listener.create({data: {email, requisitionId: requisition.id}})
  }
  return res.status(201).json(requisition)
}
