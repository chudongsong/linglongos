import auth from './auth';
import desktop from './desktop';

export const models = { auth, desktop };

export type RootModel = typeof models;