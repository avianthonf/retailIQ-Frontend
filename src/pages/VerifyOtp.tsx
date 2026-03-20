/**
 * src/pages/VerifyOtp.tsx
 * Oracle Document sections consumed: 2, 3, 8, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell } from '@/components/layout/AuthShell';
import { verifyOtpSchema, type VerifyOtpFormValues } from '@/types/schemas';
import { useResendOtpMutation, useVerifyOtpMutation } from '@/hooks/auth';
import { normalizeApiError } from '@/utils/errors';
import { extractFieldErrors } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';
import { persistAuthTokens } from '@/utils/session';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mobileNumber = searchParams.get('mobile_number') ?? '';
  const redirect = searchParams.get('redirect') ?? '/dashboard';
  const addToast = uiStore((state) => state.addToast);
  const verifyOtpMutation = useVerifyOtpMutation();
  const resendOtpMutation = useResendOtpMutation();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { mobile_number: mobileNumber, otp: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerMessage(null);
    try {
      const result = await verifyOtpMutation.mutateAsync(values);
      persistAuthTokens({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        user_id: result.user_id,
        role: result.role,
        store_id: result.store_id,
      });
      addToast({ title: 'Account verified', message: 'OTP verification succeeded.', variant: 'success' });
      navigate(redirect, { replace: true });
    } catch (error) {
      const apiError = normalizeApiError(error);
      if (apiError.status === 422) {
        extractFieldErrors(apiError.fields, setError);
        return;
      }

      setServerMessage(apiError.message);
    }
  });

  const resendOtp = async () => {
    try {
      const result = await resendOtpMutation.mutateAsync({ mobile_number: mobileNumber || undefined, contact: mobileNumber || undefined });
      addToast({ title: 'OTP resent', message: `Try again in ${result.resend_after}s.`, variant: 'info' });
    } catch (error) {
      setServerMessage(normalizeApiError(error).message);
    }
  };

  return (
    <AuthShell title="Verify your OTP" subtitle="Enter the code sent to your mobile number to activate the account.">
      <form className="stack" onSubmit={onSubmit} noValidate>
        <label className="field">
          <span>Mobile number</span>
          <input className="input" type="tel" autoComplete="tel" {...register('mobile_number')} />
          {errors.mobile_number ? <span className="muted">{errors.mobile_number.message}</span> : null}
        </label>
        <label className="field">
          <span>OTP</span>
          <input className="input" inputMode="numeric" autoComplete="one-time-code" {...register('otp')} />
          {errors.otp ? <span className="muted">{errors.otp.message}</span> : null}
        </label>
        {serverMessage ? <div className="muted">{serverMessage}</div> : null}
        <div className="button-row">
          <button className="button" type="submit" disabled={isSubmitting || verifyOtpMutation.isPending}>
            {isSubmitting || verifyOtpMutation.isPending ? 'Verifying…' : 'Verify OTP'}
          </button>
          <button className="button button--secondary" type="button" onClick={resendOtp} disabled={resendOtpMutation.isPending}>
            Resend OTP
          </button>
          <button className="button button--ghost" type="button" onClick={() => navigate('/login')}>
            Back to login
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
