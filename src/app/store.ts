import { configureStore } from '@reduxjs/toolkit';
import tabReducer from '../features/tab';
import editReducer from '../features/edit';

const store = configureStore({
  reducer: {
    tab: tabReducer,
    edit: editReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
