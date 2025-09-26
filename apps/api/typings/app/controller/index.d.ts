// This file is created by egg-ts-helper@2.1.1
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportAuth from '../../../app/controller/auth';
import ExportBtpanel from '../../../app/controller/btpanel';
import ExportProxy from '../../../app/controller/proxy';

declare module 'egg' {
  interface IController {
    auth: ExportAuth;
    btpanel: ExportBtpanel;
    proxy: ExportProxy;
  }
}
