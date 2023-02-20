import type { NextApiRequest, NextApiResponse } from 'next';
import { Phase, Requisition } from '@prisma/client';
import { z } from 'zod';
import { Registries } from '@/registries';
import { Prisma } from '@/clients/prisma';

const types = Registries.getTypes();

const requisitionSchema = z.object({
  number: z.string(),
  password: z.string(),
  registryId: z.coerce.number(),
  type: z.coerce
    .number()
    .refine((value) => types.has(value), { message: 'Tipo inválido' }),
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
    return res.status(400).json(result.error);
  }
  const { emails, ...data } = result.data;
  const client = Registries.getClientById(data.registryId);
  if (!client) {
    return res.status(404).json({ message: 'Cartório desconheido.' });
  }
  let phases: Omit<Phase, 'id' | 'requisitionId'>[];
  try {
    phases = await client.fetchPhases(data);
  } catch (error) {
    return res.status(400).json({ message: 'Solicitação inválida.' });
  }

  const requisition = await Prisma.requisition.upsert({
    where: {
      requisitionPerRegistry: {
        registryId: data.registryId,
        number: data.number,
      },
    },
    update: data,
    create: data,
  });

  const requisitionId = requisition.id;
  const promises: Promise<any>[] = [
    Prisma.phase.createMany({
      data: phases.map((phase) => ({ ...phase, requisitionId })),
    }),
  ];

  if (Array.isArray(emails) && emails.length > 0) {
    const uniqueEmails = [...new Set(emails)];
    promises.push(
      Prisma.listener
        .findMany({ where: { requisitionId, email: { in: uniqueEmails } } })
        .then((listeners) => new Set(listeners.map(({ email }) => email)))
        .then((existingEmails) => {
          const data = uniqueEmails
            .filter((email) => !existingEmails.has(email))
            .map((email) => ({ email, requisitionId }));
          return Prisma.listener.createMany({ data });
        })
    );
  }

  await Promise.all(promises);
  return res.status(201).json({ message: 'Solicitação adicionada.' });
}
