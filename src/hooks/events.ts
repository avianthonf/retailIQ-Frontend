import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as eventsApi from '@/api/events';

export const useEventsQuery = (params: { from?: string; to?: string } = {}) =>
  useQuery({ queryKey: ['events', 'list', params], queryFn: () => eventsApi.listEvents(params), staleTime: 60_000 });

export const useUpcomingEventsQuery = (days = 30) =>
  useQuery({ queryKey: ['events', 'upcoming', days], queryFn: () => eventsApi.getUpcomingEvents(days), staleTime: 60_000 });

export const useCreateEventMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof eventsApi.createEvent>[0]) => eventsApi.createEvent(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); },
  });
};

export const useUpdateEventMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: Parameters<typeof eventsApi.updateEvent>[1] }) => eventsApi.updateEvent(eventId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); },
  });
};

export const useDeleteEventMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => eventsApi.deleteEvent(eventId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); },
  });
};

export const useEventDemandSensingQuery = (productId: number | string) =>
  useQuery({ queryKey: ['events', 'demand-sensing', productId], queryFn: () => eventsApi.getDemandSensing(productId), staleTime: 300_000, enabled: Boolean(productId) });
