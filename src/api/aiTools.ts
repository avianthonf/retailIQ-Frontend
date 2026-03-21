import { requestEnvelope } from '@/api/client';

export interface AiForecastRequest {
  product_id: number | string;
}

export interface AiPricingOptimizeRequest {
  product_ids: Array<number | string>;
}

export interface AiImageRequest {
  image_url: string;
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
