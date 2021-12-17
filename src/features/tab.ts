import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  CopyBuffer,
  deleteRectangle,
  normalizeRegion,
  Region,
} from '../lib/editing';
import {
  insertNote,
  Note,
  standardBassTuning,
  StringTuning,
} from '../lib/tab';
import { exampleSong, maxColumn } from '../lib/util';

export interface Tab {
  stringSpec: StringTuning;
  notes: Note[];
}

const notes = exampleSong();

const initialState: Tab = {
  stringSpec: standardBassTuning,
  notes,
};

export interface PasteAction {
  startColumn: number;
  startLine: number;
  copyBuffer: CopyBuffer;
}

export const slice = createSlice({
  name: 'tab',
  initialState,
  reducers: {
    notesChanged(state, action: PayloadAction<Note[]>) {
      state.notes = action.payload;
    },
    noteAdded(state, action: PayloadAction<Note>) {
      insertNote(state.notes, action.payload);
    },
    regionDeleted(state, action: PayloadAction<Region>) {
      const rectangle = normalizeRegion(action.payload);
      deleteRectangle(state.notes, rectangle);
    },
    regionPasted(state, action: PayloadAction<PasteAction>) {
      const { startColumn, startLine, copyBuffer } = action.payload;

      const rectangle = {
        left: startColumn,
        right: startColumn + copyBuffer.width,
        top: startLine,
        bottom: startLine + copyBuffer.height,
      };

      deleteRectangle(state.notes, rectangle);

      for (const { column, line, text } of copyBuffer.buffer) {
        const translatedNote = {
          text,
          column: startColumn + column,
          line: startLine + line,
        };
        insertNote(state.notes, translatedNote);
      }
    },
  },
});

export const {
  notesChanged,
  noteAdded,
  regionDeleted,
  regionPasted,
} = slice.actions;

export default slice.reducer;
