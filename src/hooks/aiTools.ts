import { useMutation } from '@tanstack/react-query';
import {
  analyzeShelfScan,
  digitizeReceiptFromUrl,
  generateAiForecast,
  queryAiAssistantV2,
  optimizeAiPricing,
  recommendAiV2,
  type AiForecastRequest,
  type AiImageRequest,
  type AiPricingOptimizeRequest,
  type AiV2NlpQueryRequest,
  type AiV2RecommendRequest,
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

export const useAiV2QueryMutation = () =>
  useMutation({
    mutationFn: (data: AiV2NlpQueryRequest) => queryAiAssistantV2(data),
  });

export const useAiV2RecommendMutation = () =>
  useMutation({
    mutationFn: (data: AiV2RecommendRequest = {}) => recommendAiV2(data),
  });
