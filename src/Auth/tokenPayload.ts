export interface TokenPayload {
  sub: number;
  email: string;
  iat?: number;
  exp?: number;
}
