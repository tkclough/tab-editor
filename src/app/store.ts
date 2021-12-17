import { configureStore } from '@reduxjs/toolkit';
import editReducer from '../features/editing';
import tabReducer from '../features/tab';
import undoable from 'redux-undo';

const store = configureStore({
  reducer: {
    editing: editReducer,
    tab: undoable(tabReducer, {
      limit: 10,
    }),
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
