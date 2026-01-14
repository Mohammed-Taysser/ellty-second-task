import ENDPOINTS from '@test/constants/endpoint.constant';
import {
  authenticatedRequest,
  expectError,
  expectSuccess,
  request,
} from '@test/helpers/supertest-utils';
import { createTestUser, generateAuthToken } from '@test/helpers/test-utils';

describe('DELETE /api/users/:userId', () => {
  it('should delete own user', async () => {
    const user = await createTestUser();
    const authToken = generateAuthToken(user.id, user.email).accessToken;

    const response = await authenticatedRequest(
      'delete',
      `${ENDPOINTS.user}/${user.id}`,
      authToken
    );

    const body = expectSuccess(response);
    expect(body.data.id).toBe(user.id);
    expect(body.data.email).toBe(user.email);
  });

  it('should return 404 for non-existent user', async () => {
    const user = await createTestUser();
    const authToken = generateAuthToken(user.id, user.email).accessToken;

    const response = await authenticatedRequest('delete', `${ENDPOINTS.user}/999999`, authToken);

    expectError(response, 404, 'User not found');
  });

  it('should forbid deleting another user', async () => {
    const owner = await createTestUser();
    const otherUser = await createTestUser();
    const authToken = generateAuthToken(otherUser.id, otherUser.email).accessToken;

    const response = await authenticatedRequest(
      'delete',
      `${ENDPOINTS.user}/${owner.id}`,
      authToken
    );

    expectError(response, 403, 'You do not have permission to delete this user');
  });

  it('should require authentication', async () => {
    const user = await createTestUser();

    const response = await request().delete(`${ENDPOINTS.user}/${user.id}`);

    expectError(response, 401);
  });
});
