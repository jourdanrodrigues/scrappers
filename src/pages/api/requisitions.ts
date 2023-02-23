import type { NextApiRequest, NextApiResponse } from 'next';
import { Requisition } from '@prisma/client';
import { z } from 'zod';
import { Registries } from '@/registries';
import { Prisma } from '@/clients/prisma';
import { findNewObjects } from '@/helpers';
import { RawPendency, RawPhase } from '@/clients/terceiro-client';

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
  let fetchedPhases: RawPhase[];
  let fetchedPendencies: RawPendency[];
  try {
    const requisition = await client.fetchRequisition(data);
    fetchedPhases = requisition.phases;
    fetchedPendencies = requisition.pendencies;
  } catch (error) {
    return res.status(400).json({ message: 'Solicitação inválida.' });
  }

  const requisition = await Prisma.requisition.upsert({
    include: { phases: true, pendencies: true },
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
  const promises: Promise<any>[] = [];

  const newPendencies = findNewObjects(
    requisition.pendencies,
    fetchedPendencies
  );
  const newPhases = findNewObjects(requisition.phases, fetchedPhases);
  if (newPhases.length > 0) {
    promises.push(
      Prisma.phase.createMany({
        data: newPhases.map((phase) => ({ ...phase, requisitionId })),
      })
    );
  }
  if (newPendencies.length > 0) {
    promises.push(
      Prisma.pendency.createMany({
        data: newPendencies.map((pendency) => ({ ...pendency, requisitionId })),
      })
    );
  }

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
