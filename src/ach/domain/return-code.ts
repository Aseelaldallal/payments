/**
 * ACH return reason codes the platform has seen on its exceptions file.
 */

const RETURN_CODES = {
  R01: {
    description: 'Insufficient funds',
    extendedConsumerWindow: false,
  },
  R02: {
    description: 'Account closed',
    extendedConsumerWindow: false,
  },
  R03: {
    description: 'No account / unable to locate account',
    extendedConsumerWindow: false,
  },
  R04: {
    description: 'Invalid account number',
    extendedConsumerWindow: false,
  },
  R05: {
    description: 'Unauthorized debit to consumer account using corporate SEC code',
    extendedConsumerWindow: true,
  },
  R07: {
    description: 'Authorization revoked by customer',
    extendedConsumerWindow: true,
  },
  R08: {
    description: 'Payment stopped',
    extendedConsumerWindow: false,
  },
  R09: {
    description: 'Uncollected funds',
    extendedConsumerWindow: false,
  },
  R10: {
    description: 'Customer advises originator is not known or not authorized',
    extendedConsumerWindow: true,
  },
  R11: {
    description: 'Customer advises entry not in accordance with the terms of the authorization',
    extendedConsumerWindow: true,
  },
  R16: {
    description: 'Account frozen',
    extendedConsumerWindow: false,
  },
  R20: {
    description: 'Non-transaction account',
    extendedConsumerWindow: false,
  },
  R29: {
    description: 'Corporate customer advises not authorized',
    extendedConsumerWindow: false,
  },
} as const;

/** Returns whether the code is present in the platform's ACH return-code catalog. */
function isKnownReturnCode(code: string): code is keyof typeof RETURN_CODES {
  return Object.prototype.hasOwnProperty.call(RETURN_CODES, code);
}

/** Returns whether the code receives the extended window for a consumer account. */
export function hasExtendedConsumerReturnWindow(code: string): boolean {
  return isKnownReturnCode(code) && RETURN_CODES[code].extendedConsumerWindow;
}
