"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { PATHS, api, apiErrorCode, apiErrorMessage, apiErrorStatus } from "@/lib/api";
import { BOOKING_ACTION, buildBookingBody, classifyBookingFailure } from "@/lib/booking";
import { clearReferralCode, readReferralCode } from "@/lib/referral";

/**
 * Creates a booking and hands the browser to TIQR.
 *
 * `book` resolves to null when the redirect is underway, or to the verdict
 * when it failed — the caller needs the verdict itself, not just a boolean,
 * to react to a passcode demand.
 *
 * On success the button is deliberately never re-enabled: the redirect is
 * already underway, and a second booking fired mid-navigation would be a
 * second charge.
 */
export function useCheckout() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState(null);

  const reset = useCallback(() => setFailure(null), []);

  const book = useCallback(
    async ({ eventId, quantity = 1, passcode = "" }) => {
      setSubmitting(true);
      setFailure(null);

      try {
        const response = await api.post(
          PATHS.bookingCreate,
          buildBookingBody({ eventId, quantity, passcode, referralCode: readReferralCode() }),
        );

        const redirectTo = response.data?.redir_url;

        // A 201 with no redirect URL cannot be recovered from on this side:
        // a booking may or may not exist at TIQR and there is nowhere to send
        // the buyer to pay.
        if (!redirectTo) {
          const verdict = {
            message: "The payment page could not be opened. Please try again.",
            action: BOOKING_ACTION.NONE,
            retryable: true,
            needsPasscode: false,
          };
          setFailure(verdict);
          setSubmitting(false);
          return verdict;
        }

        // A hard navigation, not a router push: TIQR is not part of this app.
        window.location.assign(redirectTo);
        // Left submitting on purpose, so the button cannot be pressed again
        // while the browser is on its way out.
        return null;
      } catch (error) {
        const verdict = classifyBookingFailure({
          status: apiErrorStatus(error),
          code: apiErrorCode(error),
          message: apiErrorMessage(error, ""),
        });

        if (verdict.clearReferral) clearReferralCode();
        setFailure(verdict);
        setSubmitting(false);

        if (verdict.action === BOOKING_ACTION.COMPLETE_PROFILE) {
          // Shown first, then moved along, so the reason is readable.
          setTimeout(() => router.push("/profile"), 1200);
        }

        return verdict;
      }
    },
    [router],
  );

  return { book, submitting, failure, reset };
}
