/**
 * Standard Entry Class (SEC) code. Every ACH entry carries one.
 *
 * It tells the receiving bank two things about the entry:
 *   1. whether the Receiver's account belongs to a consumer or a business, so the
 *      bank knows whether to apply consumer rules or business rules to it;
 *   2. how the Originator got the Receiver's permission for the entry.
 *
 * Read a code in that order: consumer or business first, then the consent channel.
 */
export enum SecCode {
  /**
   * Prearranged Payment and Deposit. Consumer account.
   * Permission was given in writing, for example a signed form.
   */
  PPD = 'PPD',

  /**
   * Corporate Credit or Debit. Business account.
   * Permission comes from an agreement between the two businesses.
   */
  CCD = 'CCD',

  /**
   * Internet-Initiated Entry. Consumer account.
   * Permission was given online or in a mobile app. For a WEB debit, the Originator
   * must validate the account before the first pull.
   */
  WEB = 'WEB',

  /**
   * Telephone-Initiated Entry. Consumer account.
   * Permission was given by voice on a phone call, and the Originator must keep a
   * record of that call.
   */
  TEL = 'TEL',
}

export const SEC_CODES = Object.values(SecCode);
