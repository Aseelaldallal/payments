/**
 * ACH return reason codes the platform has seen on its exceptions file.
 * Descriptions only. What each code is allowed to do to a payment,
 * and for how long, is not written anywhere in this codebase yet.
 */
export const RETURN_CODES: Record<string, string> = {
  R01: 'Insufficient funds',
  R02: 'Account closed',
  R03: 'No account / unable to locate account',
  R04: 'Invalid account number',
  R05: 'Unauthorized debit to consumer account using corporate SEC code',
  R07: 'Authorization revoked by customer',
  R08: 'Payment stopped',
  R09: 'Uncollected funds',
  R10: 'Customer advises originator is not known or not authorized',
  R11: 'Customer advises entry not in accordance with the terms of the authorization',
  R16: 'Account frozen',
  R20: 'Non-transaction account',
  R29: 'Corporate customer advises not authorized',
};

export function isKnownReturnCode(code: string): boolean {
  return Object.prototype.hasOwnProperty.call(RETURN_CODES, code);
}
