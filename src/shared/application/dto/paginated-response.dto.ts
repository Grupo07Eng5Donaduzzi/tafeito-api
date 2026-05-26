export class PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;

  static of<T>(
    data: T[],
    total: number,
    page: number,
    pageSize: number,
  ): PaginatedResponseDto<T> {
    const dto = new PaginatedResponseDto<T>();
    dto.data = data;
    dto.total = total;
    dto.page = page;
    dto.pageSize = pageSize;
    dto.hasMore = page * pageSize < total;
    return dto;
  }
}
