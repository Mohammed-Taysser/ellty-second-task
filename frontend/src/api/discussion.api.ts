import EntityService from '@/apps/entity-service';

class DiscussionService extends EntityService<
  Discussion,
  DiscussionCreatePayload,
  DiscussionUpdatePayload,
  DiscussionFilterParams
> {
  constructor() {
    super('discussion');
  }

  // End a discussion
  endDiscussion(discussionId: number) {
    return this.client.post(`/discussion/${discussionId}/end`);
  }
}

export default new DiscussionService();
