import ENDPOINTS from '@test/constants/endpoint.constant';
import {
  authenticatedRequest,
  expectError,
  expectSuccess,
  request,
} from '@test/helpers/supertest-utils';
import { createTestDiscussion, createTestUser, generateAuthToken } from '@test/helpers/test-utils';

describe('DELETE /api/discussion/:discussionId', () => {
  it('should delete a discussion', async () => {
    const user = await createTestUser();
    const authToken = generateAuthToken(user.id, user.email).accessToken;
    const discussion = await createTestDiscussion({ createdBy: user.id });

    const response = await authenticatedRequest(
      'delete',
      `${ENDPOINTS.discussion}/${discussion.id}`,
      authToken
    );

    const body = expectSuccess(response);
    expect(body.data.id).toBe(discussion.id);
    expect(body.data.title).toBe(discussion.title);
  });

  it('should return 404 for non-existent discussion', async () => {
    const user = await createTestUser();
    const authToken = generateAuthToken(user.id, user.email).accessToken;

    const response = await authenticatedRequest(
      'delete',
      `${ENDPOINTS.discussion}/999999`,
      authToken
    );

    expectError(response, 404, 'Discussion not found');
  });

  it('should require authentication', async () => {
    const user = await createTestUser();
    const discussion = await createTestDiscussion({ createdBy: user.id });

    const response = await request().delete(`${ENDPOINTS.discussion}/${discussion.id}`);

    expectError(response, 401);
  });

  it('should forbid deleting a discussion created by another user', async () => {
    const owner = await createTestUser();
    const otherUser = await createTestUser();
    const authToken = generateAuthToken(otherUser.id, otherUser.email).accessToken;
    const discussion = await createTestDiscussion({ createdBy: owner.id });

    const response = await authenticatedRequest(
      'delete',
      `${ENDPOINTS.discussion}/${discussion.id}`,
      authToken
    );

    expectError(response, 403, 'You do not have permission to delete this discussion');
  });
});
