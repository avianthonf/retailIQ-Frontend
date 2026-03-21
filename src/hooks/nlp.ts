import { useMutation } from '@tanstack/react-query';
import * as nlpApi from '@/api/nlp';
import type { AiAssistantQueryRequest, AiRecommendRequest, NlpQueryRequest } from '@/types/api';

export const useNlpQueryMutation = () =>
  useMutation({ mutationFn: (data: NlpQueryRequest) => nlpApi.nlpQuery(data) });

export const useAiAssistantMutation = () =>
  useMutation({ mutationFn: (data: AiAssistantQueryRequest) => nlpApi.aiAssistantQuery(data) });

export const useAiRecommendMutation = () =>
  useMutation({ mutationFn: (data: AiRecommendRequest) => nlpApi.aiRecommend(data) });
