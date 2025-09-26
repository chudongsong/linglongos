// This file is created by egg-ts-helper@2.1.1
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportAuth from '../../../app/middleware/auth';
import ExportCommonMiddleware from '../../../app/middleware/commonMiddleware';
import ExportErrorHandler from '../../../app/middleware/error_handler';
import ExportLogger from '../../../app/middleware/logger';

declare module 'egg' {
  interface IMiddleware {
    auth: typeof ExportAuth;
    commonMiddleware: typeof ExportCommonMiddleware;
    errorHandler: typeof ExportErrorHandler;
    logger: typeof ExportLogger;
  }
}
