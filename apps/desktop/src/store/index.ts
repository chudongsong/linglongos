import { init } from '@rematch/core';
import { models } from '../models';

export const store = init({
  models,
});

export type Store = typeof store;
export type Dispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export default store;