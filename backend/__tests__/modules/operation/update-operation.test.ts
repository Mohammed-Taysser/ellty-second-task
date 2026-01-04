import { OPERATION_TYPE } from '@prisma';
import ENDPOINTS from '@test/constants/endpoint.constant';
import { authenticatedRequest, expectError, expectSuccess } from '@test/helpers/supertest-utils';
import {
  createTestDiscussion,
  createTestOperation,
  createTestUser,
  generateAuthToken,
} from '@test/helpers/test-utils';

describe('PATCH /api/operation/:id', () => {
  describe('successful updates', () => {
    it('should update operation value', async () => {
      const user = await createTestUser();
      const authToken = generateAuthToken(user.id, user.email).accessToken;

      const discussion = await createTestDiscussion({
        createdBy: user.id,
        startingValue: 100,
      });
      const operation = await createTestOperation({
        discussionId: discussion.id,
        value: 10,
        createdBy: user.id,
      });

      const response = await authenticatedRequest(
        'patch',
        `${ENDPOINTS.operation}/${operation.id}`,
        authToken
      ).send({
        value: 20,
      });

      const body = expectSuccess(response);
      expect(body.data.value).toBe(20);
      expect(body.data.afterValue).toBe(120); // Recalculated
    });

    it('should update operation type', async () => {
      const user = await createTestUser();
      const authToken = generateAuthToken(user.id, user.email).accessToken;

      const discussion = await createTestDiscussion({
        createdBy: user.id,
        startingValue: 100,
      });
      const operation = await createTestOperation({
        discussionId: discussion.id,
        operationType: OPERATION_TYPE.ADD,
        value: 50,
        createdBy: user.id,
      });

      const response = await authenticatedRequest(
        'patch',
        `${ENDPOINTS.operation}/${operation.id}`,
        authToken
      ).send({
        operationType: OPERATION_TYPE.MULTIPLY,
      });

      const body = expectSuccess(response);
      expect(body.data.operationType).toBe(OPERATION_TYPE.MULTIPLY);
      expect(body.data.afterValue).toBe(5000); // 100 * 50
    });

    it('should update operation title', async () => {
      const user = await createTestUser();
      const authToken = generateAuthToken(user.id, user.email).accessToken;

      const discussion = await createTestDiscussion({ createdBy: user.id });
      const operation = await createTestOperation({
        discussionId: discussion.id,
        createdBy: user.id,
        title: 'Old Title',
      });

      const response = await authenticatedRequest(
        'patch',
        `${ENDPOINTS.operation}/${operation.id}`,
        authToken
      ).send({
        title: 'New Title',
      });

      const body = expectSuccess(response);
      expect(body.data.title).toBe('New Title');
    });

    it('should update both value and operation type', async () => {
      const user = await createTestUser();
      const authToken = generateAuthToken(user.id, user.email).accessToken;

      const discussion = await createTestDiscussion({
        createdBy: user.id,
        startingValue: 100,
      });
      const operation = await createTestOperation({
        discussionId: discussion.id,
        operationType: OPERATION_TYPE.ADD,
        value: 10,
        createdBy: user.id,
      });

      const response = await authenticatedRequest(
        'patch',
        `${ENDPOINTS.operation}/${operation.id}`,
        authToken
      ).send({
        operationType: OPERATION_TYPE.SUBTRACT,
        value: 25,
      });

      const body = expectSuccess(response);
      expect(body.data.operationType).toBe(OPERATION_TYPE.SUBTRACT);
      expect(body.data.value).toBe(25);
      expect(body.data.afterValue).toBe(75); // 100 - 25
    });
  });

  describe('error handling', () => {
    it('should return 404 for non-existent operation', async () => {
      const user = await createTestUser();
      const authToken = generateAuthToken(user.id, user.email).accessToken;

      const response = await authenticatedRequest(
        'patch',
        `${ENDPOINTS.operation}/99999`,
        authToken
      ).send({
        value: 10,
      });

      expectError(response, 404);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject division by zero', async () => {
      const user = await createTestUser();
      const authToken = generateAuthToken(user.id, user.email).accessToken;

      const discussion = await createTestDiscussion({ createdBy: user.id });
      const operation = await createTestOperation({
        discussionId: discussion.id,
        createdBy: user.id,
      });

      const response = await authenticatedRequest(
        'patch',
        `${ENDPOINTS.operation}/${operation.id}`,
        authToken
      ).send({
        operationType: OPERATION_TYPE.DIVIDE,
        value: 0,
      });

      expectError(response, 400, 'Cannot divide by zero');
      expect(response.status).toBe(400);
    });

    it('should reject division by zero during update', async () => {
      const user = await createTestUser();
      const authToken = generateAuthToken(user.id, user.email).accessToken;
      const discussion = await createTestDiscussion({ createdBy: user.id });
      const operation = await createTestOperation({
        discussionId: discussion.id,
        operationType: OPERATION_TYPE.DIVIDE,
        value: 5,
        createdBy: user.id,
      });

      const response = await authenticatedRequest(
        'patch',
        `${ENDPOINTS.operation}/${operation.id}`,
        authToken
      ).send({
        value: 0, // Division by zero
      });

      expectError(response, 400, 'Cannot divide by zero');
      expect(response.status).toBe(400);
    });

    it('should reject invalid operation type', async () => {
      const user = await createTestUser();
      const authToken = generateAuthToken(user.id, user.email).accessToken;

      const discussion = await createTestDiscussion({ createdBy: user.id });
      const operation = await createTestOperation({
        discussionId: discussion.id,
        createdBy: user.id,
      });

      const response = await authenticatedRequest(
        'patch',
        `${ENDPOINTS.operation}/${operation.id}`,
        authToken
      ).send({
        operationType: 'INVALID',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('authentication', () => {
    it('should require authentication', async () => {
      const user = await createTestUser();
      const discussion = await createTestDiscussion({ createdBy: user.id });
      const operation = await createTestOperation({
        discussionId: discussion.id,
        createdBy: user.id,
      });

      const response = await authenticatedRequest(
        'patch',
        `${ENDPOINTS.operation}/${operation.id}`,
        ''
      ).send({
        value: 10,
      });

      expect(response.status).toBe(401);
    });

    it('should forbid updating an operation created by another user', async () => {
      const owner = await createTestUser();
      const otherUser = await createTestUser();
      const authToken = generateAuthToken(otherUser.id, otherUser.email).accessToken;
      const discussion = await createTestDiscussion({ createdBy: owner.id });
      const operation = await createTestOperation({
        discussionId: discussion.id,
        createdBy: owner.id,
      });

      const response = await authenticatedRequest(
        'patch',
        `${ENDPOINTS.operation}/${operation.id}`,
        authToken
      ).send({
        value: 99,
      });

      expectError(response, 403, 'You do not have permission to update this operation');
    });
  });

  describe('tree recalculation', () => {
    it('should recalculate child operations when parent updated', async () => {
      const user = await createTestUser();
      const authToken = generateAuthToken(user.id, user.email).accessToken;

      const discussion = await createTestDiscussion({
        createdBy: user.id,
        startingValue: 100,
      });

      const parent = await createTestOperation({
        discussionId: discussion.id,
        operationType: OPERATION_TYPE.ADD,
        value: 50,
        createdBy: user.id,
      });

      const child = await createTestOperation({
        discussionId: discussion.id,
        parentId: parent.id,
        operationType: OPERATION_TYPE.MULTIPLY,
        value: 2,
        createdBy: user.id,
      });

      // Update parent value
      await authenticatedRequest('patch', `${ENDPOINTS.operation}/${parent.id}`, authToken).send({
        value: 100,
      });

      // Fetch child to verify it was recalculated
      const childResponse = await authenticatedRequest(
        'get',
        `${ENDPOINTS.operation}/${child.id}`,
        authToken
      );

      const body = expectSuccess(childResponse);
      expect(body.data.beforeValue).toBe(200); // 100 + 100
      expect(body.data.afterValue).toBe(400); // 200 * 2
    });
  });
});
