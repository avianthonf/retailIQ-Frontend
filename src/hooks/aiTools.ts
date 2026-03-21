import { useMutation } from '@tanstack/react-query';
import {
  analyzeShelfScan,
  digitizeReceiptFromUrl,
  generateAiForecast,
  optimizeAiPricing,
  type AiForecastRequest,
  type AiImageRequest,
  type AiPricingOptimizeRequest,
} from '@/api/aiTools';

export const useAiForecastMutation = () =>
  useMutation({
    mutationFn: (data: AiForecastRequest) => generateAiForecast(data),
  });

export const useAiPricingOptimizeMutation = () =>
  useMutation({
    mutationFn: (data: AiPricingOptimizeRequest) => optimizeAiPricing(data),
  });

export const useAiShelfScanMutation = () =>
  useMutation({
    mutationFn: (data: AiImageRequest) => analyzeShelfScan(data),
  });

export const useAiReceiptDigitizeMutation = () =>
  useMutation({
    mutationFn: (data: AiImageRequest) => digitizeReceiptFromUrl(data),
  });
