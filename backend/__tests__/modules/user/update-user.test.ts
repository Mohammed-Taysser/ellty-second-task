import ENDPOINTS from '@test/constants/endpoint.constant';
import {
  authenticatedRequest,
  expectError,
  expectSuccess,
  request,
} from '@test/helpers/supertest-utils';
import { createTestUser, generateAuthToken } from '@test/helpers/test-utils';

describe('PATCH /api/users/:userId', () => {
  it('should update own user details', async () => {
    const user = await createTestUser();
    const authToken = generateAuthToken(user.id, user.email).accessToken;

    const updatedName = 'Updated Name';
    const response = await authenticatedRequest('patch', `${ENDPOINTS.user}/${user.id}`, authToken).send({
      name: updatedName,
    });

    const body = expectSuccess(response);
    expect(body.data.id).toBe(user.id);
    expect(body.data.name).toBe(updatedName);
  });

  it('should return 404 for non-existent user', async () => {
    const user = await createTestUser();
    const authToken = generateAuthToken(user.id, user.email).accessToken;

    const response = await authenticatedRequest(
      'patch',
      `${ENDPOINTS.user}/999999`,
      authToken
    ).send({
      name: 'Updated Name',
    });

    expectError(response, 404, 'User not found');
  });

  it('should forbid updating another user', async () => {
    const owner = await createTestUser();
    const otherUser = await createTestUser();
    const authToken = generateAuthToken(otherUser.id, otherUser.email).accessToken;

    const response = await authenticatedRequest(
      'patch',
      `${ENDPOINTS.user}/${owner.id}`,
      authToken
    ).send({
      name: 'Not allowed',
    });

    expectError(response, 403, 'You do not have permission to update this user');
  });

  it('should require authentication', async () => {
    const user = await createTestUser();

    const response = await request()
      .patch(`${ENDPOINTS.user}/${user.id}`)
      .send({ name: 'Updated Name' });

    expectError(response, 401);
  });
});
