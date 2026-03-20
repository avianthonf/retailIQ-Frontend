/**
 * src/utils/pagination.ts
 * Oracle Document sections consumed: 5, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
export interface PageParams {
  page: number;
  page_size: number;
}

export const buildPageParams = (page: number, perPage: number) => ({
  page,
  page_size: perPage,
});

export const extractPaginationMeta = <T extends { page?: number; page_size?: number; total?: number; pages?: number; next_cursor?: string | null; meta?: Record<string, unknown> | null }>(response: T) => ({
  page: response.page,
  page_size: response.page_size,
  total: response.total,
  pages: response.pages,
  next_cursor: response.next_cursor,
  meta: response.meta,
});

export const getNextPageParam = <T extends { next_cursor?: string | null; pages?: number; page?: number }>(lastPage: T) => lastPage.next_cursor ?? undefined;
