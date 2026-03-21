import { useMutation, useQuery } from '@tanstack/react-query';
import {
  exploreV2Inventory,
  exploreV2Sales,
  getDeveloperMarketplace,
  registerDeveloperProfile,
  type DeveloperRegistrationRequest,
} from '@/api/developerExtras';

export const useDeveloperMarketplaceQuery = () =>
  useQuery({
    queryKey: ['developer', 'marketplace'],
    queryFn: getDeveloperMarketplace,
    staleTime: 300_000,
  });

export const useRegisterDeveloperMutation = () =>
  useMutation({
    mutationFn: (data: DeveloperRegistrationRequest) => registerDeveloperProfile(data),
  });

export const useDeveloperV2InventoryMutation = () =>
  useMutation({
    mutationFn: ({ oauthToken, storeId }: { oauthToken: string; storeId: string }) => exploreV2Inventory(oauthToken, storeId),
  });

export const useDeveloperV2SalesMutation = () =>
  useMutation({
    mutationFn: ({ oauthToken, storeId }: { oauthToken: string; storeId: string }) => exploreV2Sales(oauthToken, storeId),
  });
