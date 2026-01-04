import ENDPOINTS from '@test/constants/endpoint.constant';
import {
  authenticatedRequest,
  expectError,
  expectSuccess,
  request,
} from '@test/helpers/supertest-utils';
import { createTestDiscussion, createTestUser, generateAuthToken } from '@test/helpers/test-utils';

describe('PATCH /api/discussion/:discussionId', () => {
  it('should update discussion title', async () => {
    const user = await createTestUser();
    const authToken = generateAuthToken(user.id, user.email).accessToken;
    const discussion = await createTestDiscussion({ createdBy: user.id });

    const updatedTitle = 'Updated Title';
    const response = await authenticatedRequest(
      'patch',
      `${ENDPOINTS.discussion}/${discussion.id}`,
      authToken
    ).send({
      title: updatedTitle,
    });

    const body = expectSuccess(response);
    expect(body.data.title).toBe(updatedTitle);
  });

  it('should return 404 for non-existent discussion', async () => {
    const user = await createTestUser();
    const authToken = generateAuthToken(user.id, user.email).accessToken;

    const response = await authenticatedRequest(
      'patch',
      `${ENDPOINTS.discussion}/999999`,
      authToken
    );

    expectError(response, 404, 'Discussion not found');
  });

  it('should require authentication', async () => {
    const user = await createTestUser();
    const discussion = await createTestDiscussion({ createdBy: user.id });

    const response = await request()
      .patch(`${ENDPOINTS.discussion}/${discussion.id}`)
      .send({ title: 'Updated Title' });

    expectError(response, 401);
  });

  it('should forbid updating discussion created by another user', async () => {
    const owner = await createTestUser();
    const otherUser = await createTestUser();
    const authToken = generateAuthToken(otherUser.id, otherUser.email).accessToken;
    const discussion = await createTestDiscussion({ createdBy: owner.id });

    const response = await authenticatedRequest(
      'patch',
      `${ENDPOINTS.discussion}/${discussion.id}`,
      authToken
    ).send({ title: 'Not allowed' });

    expectError(response, 403, 'You do not have permission to update this discussion');
  });
});
