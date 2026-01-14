import ENDPOINTS from '@test/constants/endpoint.constant';
import {
  expectError,
  expectSuccess,
  expectValidationError,
  request,
} from '@test/helpers/supertest-utils';
import { createTestUser, generateAuthToken } from '@test/helpers/test-utils';
import jwt from 'jsonwebtoken';

import CONFIG from '@/apps/config';

describe('POST /api/auth/refresh-token', () => {
  describe('successful refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      const user = await createTestUser();
      const { refreshToken } = generateAuthToken(user.id, user.email);

      const response = await request().post(ENDPOINTS.auth.refreshToken).send({
        refreshToken,
      });

      const body = expectSuccess(response);
      expect(body.data).toHaveProperty('accessToken');
      expect(body.data).toHaveProperty('refreshToken');
      expect(body.data.accessToken).not.toBe(refreshToken);
    });
  });

  describe('validation errors', () => {
    it('should reject missing refresh token', async () => {
      const response = await request().post(ENDPOINTS.auth.refreshToken).send({});

      expectValidationError(response);
    });
  });

  describe('authentication errors', () => {
    it('should reject invalid refresh token', async () => {
      const response = await request().post(ENDPOINTS.auth.refreshToken).send({
        refreshToken: 'invalid-token',
      });

      expectError(response, 401, 'Invalid Or Expired Refresh Token');
    });

    it('should reject expired refresh token', async () => {
      const user = await createTestUser();
      const expiredToken = jwt.sign({ id: user.id, email: user.email }, CONFIG.JWT_SECRET, {
        expiresIn: -1,
      });

      const response = await request().post(ENDPOINTS.auth.refreshToken).send({
        refreshToken: expiredToken,
      });

      expectError(response, 401, 'Invalid Or Expired Refresh Token');
    });
  });
});
