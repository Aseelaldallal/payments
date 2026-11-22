import { Injectable } from '@nestjs/common';
import { ReceiverAccountType } from '../shared/domain/receiver-account-type';
import { calendarDaysBetween } from '../shared/iso-date';
import {
  EXTENDED_RETURN_WINDOW_CALENDAR_DAYS,
  REVERSAL_WINDOW_BANKING_DAYS,
  STANDARD_RETURN_WINDOW_BANKING_DAYS,
} from './domain/ach-window-policy';
import { bankingDaysBetween } from './domain/banking-calendar';
import { hasExtendedConsumerReturnWindow } from './domain/return-code';
import { AchWindowPolicyError, AchWindowPolicyErrorCode } from './errors/ach-window-policy.error';

@Injectable()
export class AchWindowPolicyService {
  /**
   * Asserts that an ACH return is within the window for its code and account type.
   *
   * @param input The dates and return attributes used to select and evaluate the window.
   */
  public assertReturnWindowOpen({
    settlementDate,
    returnDate,
    returnCode,
    receiverAccountType,
  }: {
    settlementDate: string;
    returnDate: string;
    returnCode: string;
    receiverAccountType: ReceiverAccountType;
  }): void {
    const bankingDaysElapsed = bankingDaysBetween(settlementDate, returnDate);
    const calendarDaysElapsed = calendarDaysBetween(settlementDate, returnDate);
    const hasExtendedWindow =
      receiverAccountType === ReceiverAccountType.CONSUMER && hasExtendedConsumerReturnWindow(returnCode);

    if (calendarDaysElapsed < 0) {
      throw new AchWindowPolicyError(AchWindowPolicyErrorCode.RETURN_DATE_PRECEDES_SETTLEMENT, {
        returnCode,
        settlementDate,
        returnDate,
        receiverAccountType,
      });
    }
    if (hasExtendedWindow && calendarDaysElapsed > EXTENDED_RETURN_WINDOW_CALENDAR_DAYS) {
      throw new AchWindowPolicyError(AchWindowPolicyErrorCode.EXTENDED_RETURN_WINDOW_EXPIRED, {
        returnCode,
        settlementDate,
        returnDate,
        receiverAccountType,
        calendarDaysElapsed,
      });
    }
    if (!hasExtendedWindow && bankingDaysElapsed > STANDARD_RETURN_WINDOW_BANKING_DAYS) {
      throw new AchWindowPolicyError(AchWindowPolicyErrorCode.STANDARD_RETURN_WINDOW_EXPIRED, {
        returnCode,
        settlementDate,
        returnDate,
        receiverAccountType,
        bankingDaysElapsed,
      });
    }
  }

  /**
   * Asserts that an ACH reversal is within five banking days of settlement.
   *
   * @param input The settlement and reversal dates used to evaluate the window.
   */
  public assertReversalWindowOpen({
    settlementDate,
    reversalDate,
  }: {
    settlementDate: string;
    reversalDate: string;
  }): void {
    const bankingDaysElapsed = bankingDaysBetween(settlementDate, reversalDate);

    if (bankingDaysElapsed < 0) {
      throw new AchWindowPolicyError(AchWindowPolicyErrorCode.REVERSAL_DATE_PRECEDES_SETTLEMENT, {
        settlementDate,
        reversalDate,
      });
    }
    if (bankingDaysElapsed > REVERSAL_WINDOW_BANKING_DAYS) {
      throw new AchWindowPolicyError(AchWindowPolicyErrorCode.REVERSAL_WINDOW_EXPIRED, {
        settlementDate,
        reversalDate,
        bankingDaysElapsed,
      });
    }
  }
}
