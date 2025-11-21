import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';

import ennValidation from '@/apps/config';
import { UnauthorizedError } from '@/utils/errors.utils';

class TokenService {
  private readonly SECRET = ennValidation.JWT_SECRET;
  private readonly ACCESS_EXPIRY = ennValidation.JWT_ACCESS_EXPIRES_IN;
  private readonly REFRESH_EXPIRY = ennValidation.JWT_REFRESH_EXPIRES_IN;

  private preparePayload(payload: UserTokenPayload): UserTokenPayload {
    return {
      id: payload.id,
      email: payload.email,
    };
  }

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  signAccessToken(payload: UserTokenPayload): string {
    return jwt.sign(this.preparePayload(payload), this.SECRET, {
      expiresIn: this.ACCESS_EXPIRY,
    });
  }

  signRefreshToken(payload: UserTokenPayload): string {
    return jwt.sign(this.preparePayload(payload), this.SECRET, {
      expiresIn: this.REFRESH_EXPIRY,
    });
  }

  verifyToken<T extends JwtPayload = JwtPayload>(token: string): T {
    try {
      return jwt.verify(token, this.SECRET) as T;
    } catch (error) {
      // Convert all JWT errors to UnauthorizedError
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      if (error instanceof jwt.NotBeforeError) {
        throw new UnauthorizedError('Token not yet valid');
      }
      // Re-throw any other unexpected errors
      throw error;
    }
  }
}

const tokenService = new TokenService();

export default tokenService;
