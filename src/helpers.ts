import { Pendency, Phase } from '@prisma/client';
import { RawPendency, RawPhase } from '@/clients/terceiro-client';

export function findNewObjects(
  known: (Phase | Pendency)[],
  fetched: (RawPhase | RawPendency)[]
): RawPhase[] {
  const lastKnown = known.at(-1);
  const lastFetched = fetched.at(-1);
  if (lastKnown?.description === lastFetched?.description) {
    return [];
  }

  return fetched.slice(known.length);
}
