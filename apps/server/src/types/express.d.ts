import { User } from '../user/user.entity';

declare module 'express' {
  export interface Request {
    user?: UserWithSub;
  }
}

interface UserWithSub extends User {
  sub: number;
}
