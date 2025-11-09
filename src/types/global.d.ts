type ErrorContent = string | Record<string, unknown> | unknown[];

interface UserTokenPayload {
  id: number;
  email: string;
}
