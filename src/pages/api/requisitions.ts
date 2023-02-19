import type { NextApiRequest, NextApiResponse } from 'next';
import { Requisition } from '@prisma/client';
import { z } from 'zod';
import { Registries } from '@/registries';
import { Prisma } from '@/clients/prisma';

const types = Registries.getTypes();

const requisitionSchema = z.object({
  number: z.string(),
  password: z.string(),
  registryId: z.number(),
  type: z.union([
    z.literal(types[0]),
    z.literal(types[1]),
    ...types.slice(2).map((type) => z.literal(type)),
  ]),
  emails: z.array(z.string()).optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Requisition | { message: string }>
) {
  if (req.method === 'POST') return handleRequisitionCreation(req, res);
  res.status(405).json({ message: 'Method not allowed' });
}

async function handleRequisitionCreation(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const result = requisitionSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: result.error.message });
  }
  const { emails, ...data } = result.data;
  if (!Registries.existForId(data.registryId)) {
    return res.status(404).json({ message: 'Registry not found' });
  }
  const requisition = await Prisma.requisition.create({ data });
  if (Array.isArray(emails) && emails.length > 0) {
    await Prisma.listener.createMany({
      data: emails.map((email) => ({ email, requisitionId: requisition.id })),
    });
  }
  return res.status(201).json(requisition);
}
