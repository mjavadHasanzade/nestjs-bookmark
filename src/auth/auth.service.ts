import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  login() {
    return {
      msg: ' I have signed in',
    };
  }
  signup() {
    return {
      msg: ' I have signed up',
    };
  }
}
