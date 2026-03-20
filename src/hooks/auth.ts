/**
 * src/hooks/auth.ts
 * Oracle Document sections consumed: 2, 3, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useMutation } from '@tanstack/react-query';
import * as authApi from '@/api/auth';
import type {
  ForgotPasswordRequest,
  LoginRequest,
  LogoutRequest,
  MfaSetupRequest,
  MfaVerifyRequest,
  RefreshTokenRequest,
  RegisterRequest,
  ResendOtpRequest,
  ResetPasswordRequest,
  VerifyOtpRequest,
} from '@/types/api';

export const useLoginMutation = () => useMutation({ mutationFn: (payload: LoginRequest) => authApi.login(payload) });
export const useRegisterMutation = () => useMutation({ mutationFn: (payload: RegisterRequest) => authApi.register(payload) });
export const useVerifyOtpMutation = () => useMutation({ mutationFn: (payload: VerifyOtpRequest) => authApi.verifyOtp(payload) });
export const useResendOtpMutation = () => useMutation({ mutationFn: (payload: ResendOtpRequest) => authApi.resendOtp(payload) });
export const useForgotPasswordMutation = () => useMutation({ mutationFn: (payload: ForgotPasswordRequest) => authApi.forgotPassword(payload) });
export const useResetPasswordMutation = () => useMutation({ mutationFn: (payload: ResetPasswordRequest) => authApi.resetPassword(payload) });
export const useRefreshTokenMutation = () => useMutation({ mutationFn: (payload: RefreshTokenRequest) => authApi.refreshAccessToken(payload) });
export const useLogoutMutation = () => useMutation({ mutationFn: (payload: LogoutRequest) => authApi.logout(payload) });
export const useMfaSetupMutation = () => useMutation({ mutationFn: (payload: MfaSetupRequest) => authApi.mfaSetup(payload) });
export const useMfaVerifyMutation = () => useMutation({ mutationFn: (payload: MfaVerifyRequest) => authApi.mfaVerify(payload) });
