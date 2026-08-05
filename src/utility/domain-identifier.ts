import { randomInt } from 'node:crypto';
import AppConstants from './app-constants';

type RandomIndexGenerator = (maxExclusive: number) => number;

export class DomainIdentifierGenerationError extends Error {
  constructor(prefix: string) {
    super(
      `Unable to generate an available ${prefix} identifier after ${AppConstants.DOMAIN_IDENTIFIER_MAX_ATTEMPTS} attempts`,
    );
    this.name = DomainIdentifierGenerationError.name;
  }
}

export function createDomainIdentifier(
  prefix: string,
  date: Date = new Date(),
  randomIndex: RandomIndexGenerator = randomInt,
): string {
  let suffix = '';

  for (
    let index = 0;
    index < AppConstants.DOMAIN_IDENTIFIER_SUFFIX_LENGTH;
    index += 1
  ) {
    suffix +=
      AppConstants.DOMAIN_IDENTIFIER_ALPHABET[
        randomIndex(AppConstants.DOMAIN_IDENTIFIER_ALPHABET.length)
      ];
  }

  return `${prefix}-${date.getUTCFullYear()}-${suffix}`;
}

export async function generateAvailableDomainIdentifier(
  prefix: string,
  isTaken: (candidate: string) => Promise<boolean>,
  date: Date = new Date(),
  randomIndex: RandomIndexGenerator = randomInt,
): Promise<string> {
  for (
    let attempt = 0;
    attempt < AppConstants.DOMAIN_IDENTIFIER_MAX_ATTEMPTS;
    attempt += 1
  ) {
    const candidate = createDomainIdentifier(prefix, date, randomIndex);

    if (!(await isTaken(candidate))) {
      return candidate;
    }
  }

  throw new DomainIdentifierGenerationError(prefix);
}
