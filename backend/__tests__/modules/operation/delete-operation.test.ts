import ENDPOINTS from '@test/constants/endpoint.constant';
import {
  authenticatedRequest,
  expectError,
  expectSuccess,
  request,
} from '@test/helpers/supertest-utils';
import { createTestDiscussion, createTestOperation, createTestUser, generateAuthToken } from '@test/helpers/test-utils';

describe('DELETE /api/operation/:operationId', () => {
  it('should delete an operation', async () => {
    const user = await createTestUser();
    const authToken = generateAuthToken(user.id, user.email).accessToken;
    const discussion = await createTestDiscussion({ createdBy: user.id });
    const operation = await createTestOperation({
      discussionId: discussion.id,
      createdBy: user.id,
    });

    const response = await authenticatedRequest(
      'delete',
      `${ENDPOINTS.operation}/${operation.id}`,
      authToken
    );

    const body = expectSuccess(response);
    expect(body.data).toBeNull();
  });

  it('should forbid deleting an operation created by another user', async () => {
    const owner = await createTestUser();
    const otherUser = await createTestUser();
    const authToken = generateAuthToken(otherUser.id, otherUser.email).accessToken;
    const discussion = await createTestDiscussion({ createdBy: owner.id });
    const operation = await createTestOperation({
      discussionId: discussion.id,
      createdBy: owner.id,
    });

    const response = await authenticatedRequest(
      'delete',
      `${ENDPOINTS.operation}/${operation.id}`,
      authToken
    );

    expectError(response, 403, 'You do not have permission to delete this operation');
  });

  it('should require authentication', async () => {
    const user = await createTestUser();
    const discussion = await createTestDiscussion({ createdBy: user.id });
    const operation = await createTestOperation({
      discussionId: discussion.id,
      createdBy: user.id,
    });

    const response = await request().delete(`${ENDPOINTS.operation}/${operation.id}`);

    expectError(response, 401);
  });
});
