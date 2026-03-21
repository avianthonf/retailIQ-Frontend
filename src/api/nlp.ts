import { request } from '@/api/client';
import type {
  AiAssistantQueryRequest,
  AiAssistantQueryResponse,
  AiRecommendRequest,
  AiRecommendResponse,
  NlpQueryRequest,
  NlpQueryResponse,
} from '@/types/api';

const NLP_BASE = '/api/v1/nlp';

export const nlpQuery = (data: NlpQueryRequest) =>
  request<NlpQueryResponse>({ url: NLP_BASE, method: 'POST', data });

export const aiAssistantQuery = (data: AiAssistantQueryRequest) =>
  request<AiAssistantQueryResponse>({ url: `${NLP_BASE}/v2/ai/nlp/query`, method: 'POST', data });

export const aiRecommend = (data: AiRecommendRequest = {}) =>
  request<AiRecommendResponse>({ url: `${NLP_BASE}/v2/ai/recommend`, method: 'POST', data });
