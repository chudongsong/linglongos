// This file is created by egg-ts-helper@3.2.0
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExtendContext from '../../../app/extend/context.js';
type ExtendContextType = typeof ExtendContext;
declare module 'egg' {
  interface Context extends ExtendContextType { }
}