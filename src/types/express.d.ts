import { TokenPayload } from 'src/Auth/tokenPayload';

declare module 'express' {
  interface Request {
    user?: TokenPayload;
  }
}
