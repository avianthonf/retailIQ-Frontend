import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { developerExtrasApi, type DeveloperRegistrationRequest } from '@/api/developerExtras';

export const developerExtrasKeys = {
  all: ['developer-extras'] as const,
  marketplace: () => [...developerExtrasKeys.all, 'marketplace'] as const,
};

export const useDeveloperMarketplaceQuery = () =>
  useQuery({
    queryKey: developerExtrasKeys.marketplace(),
    queryFn: () => developerExtrasApi.getMarketplace(),
    staleTime: 300000,
  });

export const useRegisterDeveloperMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeveloperRegistrationRequest) => developerExtrasApi.registerDeveloper(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerExtrasKeys.marketplace() });
    },
  });
};
