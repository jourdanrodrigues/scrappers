// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { OlxClient } from '@/clients/olx-client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Record<string, any>[]>
) {
  const content = await OlxClient.fetchAllCarAds();
  res.status(200).json(content);
}
