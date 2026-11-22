import { HttpException } from './http.exception.js';

export class NotFoundException extends HttpException {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}
