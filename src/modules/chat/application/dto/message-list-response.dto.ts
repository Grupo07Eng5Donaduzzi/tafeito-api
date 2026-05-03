import { MessageResponseDto } from './message-response.dto';

export class MessageListResponseDto {
  data!: MessageResponseDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  hasMore!: boolean;

  constructor(data: MessageResponseDto[], total: number, page: number, pageSize: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.pageSize = pageSize;
    this.hasMore = page * pageSize < total;
  }
}
