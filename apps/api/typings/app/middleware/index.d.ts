// This file is created by egg-ts-helper@3.2.0
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportAuth from '../../../app/middleware/auth.js';
import ExportBt from '../../../app/middleware/bt.js';
import ExportCommon from '../../../app/middleware/common.js';
import ExportErrorHandler from '../../../app/middleware/errorHandler.js';
import ExportRequestId from '../../../app/middleware/requestId.js';
import ExportStaticAuth from '../../../app/middleware/staticAuth.js';
import ExportStaticFiles from '../../../app/middleware/staticFiles.js';

declare module 'egg' {
  interface IMiddleware {
    auth: typeof ExportAuth;
    bt: typeof ExportBt;
    common: typeof ExportCommon;
    errorHandler: typeof ExportErrorHandler;
    requestId: typeof ExportRequestId;
    staticAuth: typeof ExportStaticAuth;
    staticFiles: typeof ExportStaticFiles;
  }
}
