// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@/clients/prisma';
import { Registries } from '@/registries';
import { RawPhase } from '@/clients/terceiro-client';
import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { Listener, Phase, Requisition } from '@prisma/client';
import { findNewPhases } from '@/helpers';

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
    include: { listeners: true, phases: { orderBy: { id: 'asc' } } },
  });

  const promises = requisitions.map(async (requisition) => {
    const client = Registries.getClientById(requisition.registryId);
    if (!client) return;

    const fetchedPhases = await client.fetchPhases(requisition);

    const newPhases = findNewPhases(requisition.phases, fetchedPhases);
    if (newPhases.length === 0) return;

    const requisitionId = requisition.id;
    await Promise.all([
      Prisma.phase.createMany({
        data: newPhases.map((phase) => ({ ...phase, requisitionId })),
      }),
      sendEmails(transport, requisition, newPhases),
    ]);
  });
  await Promise.all(promises);
  res.status(200).json({ message: 'Alerts sent.' });
}

function sendEmails(
  transport: Transporter<SMTPTransport.SentMessageInfo>,
  requisition: Requisition & { listeners: Listener[]; phases: Phase[] },
  newPhases: RawPhase[]
) {
  const emails = requisition.listeners.map(({ email }) => email);
  const lastPhaseText = newPhases.at(-1)?.description;
  const phasesText = newPhases.map((phase) => phase.description).join('\n');
  const text = `Novas fases da solicitação:\n\n${phasesText}`;
  const subject = `Atualização ${requisition.number}: ${lastPhaseText}`;

  return transport.sendMail({ bcc: emails, subject, text });
}
