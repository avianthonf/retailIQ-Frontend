/**
 * src/api/auth.ts
 * Oracle Document sections consumed: 2, 3, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { request } from '@/api/client';
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  LogoutResponse,
  MfaSetupRequest,
  MfaSetupResponse,
  MfaVerifyRequest,
  MfaVerifyResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
  ResendOtpRequest,
  ResendOtpResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '@/types/api';

export const login = (payload: LoginRequest) => request<LoginResponse>({ url: '/api/v1/auth/login', method: 'POST', data: payload });
export const register = (payload: RegisterRequest) => request<RegisterResponse>({ url: '/api/v1/auth/register', method: 'POST', data: payload });
export const verifyOtp = (payload: VerifyOtpRequest) => request<VerifyOtpResponse>({ url: '/api/v1/auth/verify-otp', method: 'POST', data: payload });
export const resendOtp = (payload: ResendOtpRequest) => request<ResendOtpResponse>({ url: '/api/v1/auth/resend-otp', method: 'POST', data: payload });
export const forgotPassword = (payload: ForgotPasswordRequest) => request<ForgotPasswordResponse>({ url: '/api/v1/auth/forgot-password', method: 'POST', data: payload });
export const resetPassword = (payload: ResetPasswordRequest) => request<ResetPasswordResponse>({ url: '/api/v1/auth/reset-password', method: 'POST', data: payload });
export const refreshAccessToken = (payload: RefreshTokenRequest) => request<RefreshTokenResponse>({ url: '/api/v1/auth/refresh', method: 'POST', data: payload });
export const logout = (payload: LogoutRequest = {}) => request<LogoutResponse>({ url: '/api/v1/auth/logout', method: 'DELETE', data: payload });
export const mfaSetup = (payload: MfaSetupRequest) => request<MfaSetupResponse>({ url: '/api/v1/auth/mfa/setup', method: 'POST', data: payload });
export const mfaVerify = (payload: MfaVerifyRequest) => request<MfaVerifyResponse>({ url: '/api/v1/auth/mfa/verify', method: 'POST', data: payload });
