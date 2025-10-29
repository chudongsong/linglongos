// This file is created by egg-ts-helper@3.2.0
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportAuth from '../../../app/controller/auth.js';
import ExportDocs from '../../../app/controller/docs.js';
import ExportInit from '../../../app/controller/init.js';
import ExportPanels from '../../../app/controller/panels.js';
import ExportProxy from '../../../app/controller/proxy.js';
import ExportSessions from '../../../app/controller/sessions.js';
import ExportUi from '../../../app/controller/ui.js';

declare module 'egg' {
  interface IController {
    auth: ExportAuth;
    docs: ExportDocs;
    init: ExportInit;
    panels: ExportPanels;
    proxy: ExportProxy;
    sessions: ExportSessions;
    ui: ExportUi;
  }
}
