// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@/clients/prisma';
import { Registries } from '@/registries';
import { RawPendency, RawPhase } from '@/clients/terceiro-client';
import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { Listener, Requisition } from '@prisma/client';
import { findNewObjects } from '@/helpers';

const sourceEmail = process.env.EMAIL_ADDRESS;
const emailPassword = process.env.EMAIL_PASSWORD;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Record<'message', string>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: sourceEmail, pass: emailPassword },
  });
  const requisitions = await Prisma.requisition.findMany({
    include: {
      listeners: true,
      phases: { orderBy: { id: 'asc' } },
      pendencies: { orderBy: { id: 'asc' } },
    },
  });

  const promises = requisitions.map(async (requisition) => {
    const client = Registries.getClientById(requisition.registryId);
    if (!client) return;

    const { phases: fetchedPhases, pendencies: fetchedPendencies } =
      await client.fetchRequisition(requisition);

    const newPendencies = findNewObjects(
      requisition.pendencies,
      fetchedPendencies
    );
    const newPhases = findNewObjects(requisition.phases, fetchedPhases);
    const promises = [];
    const requisitionId = requisition.id;
    if (newPhases.length > 0) {
      const payload = newPhases.map((phase) => ({ ...phase, requisitionId }));
      promises.push(Prisma.phase.createMany({ data: payload }));
    }
    if (newPendencies.length > 0) {
      const payload = newPendencies.map((pendency) => ({
        ...pendency,
        requisitionId,
      }));
      promises.push(Prisma.pendency.createMany({ data: payload }));
    }

    if (promises.length === 0) return;
    await Promise.all([
      ...promises,
      sendEmails(transport, requisition, newPhases, newPendencies),
    ]);
  });
  await Promise.all(promises);
  res.status(200).json({ message: 'Alerts sent.' });
}

function sendEmails(
  transport: Transporter<SMTPTransport.SentMessageInfo>,
  requisition: Requisition & { listeners: Listener[] },
  newPhases: RawPhase[],
  newPendencies: RawPendency[]
) {
  const emails = requisition.listeners.map(({ email }) => email);

  const textPieces = [];
  if (newPhases.length > 0) {
    textPieces.push(buildBody('fases', newPhases));
  }
  if (newPendencies.length > 0) {
    textPieces.push(buildBody('pendências', newPendencies));
  }

  return transport.sendMail({
    bcc: emails,
    subject: `Atualização ${requisition.number}`,
    text: textPieces.join('\n\n-------------------XXX-------------------\n\n'),
  });
}

function buildBody(label: string, items: (RawPhase | RawPendency)[]): string {
  const body = items.map((item) => item.description).join('\n');
  return `Novas ${label} da solicitação:\n\n${body}`;
}
