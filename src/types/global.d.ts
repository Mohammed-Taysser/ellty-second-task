type ErrorContent = string | Record<string, unknown> | unknown[];

interface UserTokenPayload {
  id: string;
  email: string;
}
