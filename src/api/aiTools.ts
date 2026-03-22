import { requestEnvelope } from '@/api/client';
import type { AiRecommendation } from '@/types/models';

export interface AiForecastRequest {
  product_id: number | string;
}

export interface AiPricingOptimizeRequest {
  product_ids: Array<number | string>;
}

export interface AiImageRequest {
  image_url: string;
}

export interface AiV2NlpQueryRequest {
  query: string;
}

export interface AiV2NlpQueryResponse {
  response: string;
}

export interface AiV2RecommendRequest {
  user_id?: number;
}

export interface AiV2RecommendResponse {
  recommendations: AiRecommendation[];
}

export const generateAiForecast = async (data: AiForecastRequest) => {
  const envelope = await requestEnvelope<unknown>({ url: '/api/v2/ai/forecast', method: 'POST', data });
  return envelope.data;
};

export const optimizeAiPricing = async (data: AiPricingOptimizeRequest) => {
  const envelope = await requestEnvelope<unknown>({ url: '/api/v2/ai/pricing/optimize', method: 'POST', data });
  return envelope.data;
};

export const analyzeShelfScan = async (data: AiImageRequest) => {
  const envelope = await requestEnvelope<{ analysis?: unknown }>({ url: '/api/v2/ai/vision/shelf-scan', method: 'POST', data });
  return envelope.data;
};

export const digitizeReceiptFromUrl = async (data: AiImageRequest) => {
  const envelope = await requestEnvelope<unknown>({ url: '/api/v2/ai/vision/receipt', method: 'POST', data });
  return envelope.data;
};

export const queryAiAssistantV2 = async (data: AiV2NlpQueryRequest) => {
  const envelope = await requestEnvelope<AiV2NlpQueryResponse>({ url: '/api/v2/ai/nlp/query', method: 'POST', data });
  return envelope.data;
};

export const recommendAiV2 = async (data: AiV2RecommendRequest = {}) => {
  const envelope = await requestEnvelope<AiV2RecommendResponse>({ url: '/api/v2/ai/recommend', method: 'POST', data });
  return envelope.data;
};
