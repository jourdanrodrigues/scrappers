import { Phase } from '@prisma/client';
import { RawPhase } from '@/clients/terceiro-client';

export function findNewPhases(
  knownPhases: Phase[],
  fetchedPhases: RawPhase[]
): RawPhase[] {
  const lastKnownPhase = knownPhases.at(-1);
  const lastFetchedPhase = fetchedPhases.at(-1);
  if (lastKnownPhase?.description === lastFetchedPhase?.description) {
    return [];
  }

  return fetchedPhases.slice(knownPhases.length);
}
