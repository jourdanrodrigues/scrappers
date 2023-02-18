// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type {NextApiRequest, NextApiResponse} from 'next'
import prisma from '@/clients/prisma'
import Registries from '@/registries'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Record<string, any>>,
) {
  const requisitions = await prisma.requisition.findMany({
    include: {listeners: true, phases: true},
  })
  const promises = requisitions.map(async (requisition) => {
    const client = Registries.getClientById(requisition.registryId)
    if (!client) return []
    const phases = await client.fetchPhases(requisition)
    if (requisition.phases.length === phases.length) return []
    const newPhases = phases.slice(requisition.phases.length)
    await prisma.phase.createMany({
      data: newPhases.map((phase) => ({...phase, requisitionId: requisition.id})),
    })
    return newPhases
  })
  const outputs = await Promise.all(promises)
  res.status(200).json(outputs.flat())
}
