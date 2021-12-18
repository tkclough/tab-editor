import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  Region,
  CopyBuffer,
  RegionStart,
  RegionEnd,
  normalizeRegion,
  copyRectangle,
} from '../lib/editing';
import { Note } from '../lib/tab';
import { exampleSong, maxColumn } from '../lib/util';

export interface EditorState {
  activeNote: Note;
  isMouseDown: boolean;
  highlightedRegion?: Region;
  copyBuffer?: CopyBuffer;
  notesPerLine: number;
  numberOfStaffLines: number;
}

const notesPerLine = 40;
const notes = exampleSong();
const numberOfStaffLines = Math.ceil(maxColumn(notes) / notesPerLine);

const initialState: EditorState = {
  activeNote: {
    text: '',
    line: 0,
    column: 0,
  },
  isMouseDown: false,
  notesPerLine,
  numberOfStaffLines,
};

export interface LayoutChangedAction {
  notesPerLine: number;
  numberOfStaffLines: number;
}

export const slice = createSlice({
  name: 'editing',
  initialState: initialState,
  reducers: {
    layoutChanged(state, action: PayloadAction<LayoutChangedAction>) {
      const { notesPerLine, numberOfStaffLines } = action.payload;
      state.notesPerLine = notesPerLine;
      state.numberOfStaffLines = numberOfStaffLines;
    },

    staffLineAdded(state) {
      state.numberOfStaffLines += 1;
    },

    activeNoteChanged(state, action: PayloadAction<Note>) {
      const { text, line, column } = action.payload;
      state.activeNote.text = text;
      state.activeNote.line = line;
      state.activeNote.column = column;
    },

    highlightedRegionCleared(state) {
      delete state.highlightedRegion;
    },

    highlightedRegionStartChanged: {
      reducer(state, action: PayloadAction<RegionStart>) {
        const { startLine, startColumn } = action.payload;

        state.highlightedRegion = {
          startColumn,
          startLine,
          endColumn: startColumn,
          endLine: startLine,
        };
      },
      prepare(startLine: number, startColumn: number) {
        return {
          payload: {
            startLine,
            startColumn,
          },
        };
      },
    },

    highlightedRegionEndChanged: {
      reducer(state, action: PayloadAction<RegionEnd>) {
        const { endLine, endColumn } = action.payload;

        state.highlightedRegion = {
          startColumn:
            state.highlightedRegion?.startColumn ?? endColumn,
          startLine: state.highlightedRegion?.startLine ?? endLine,
          endColumn: endColumn,
          endLine: endLine,
        };
      },
      prepare(endLine: number, endColumn: number) {
        return {
          payload: {
            endLine,
            endColumn,
          },
        };
      },
    },
    mouseDownChanged(state, action: PayloadAction<boolean>) {
      state.isMouseDown = action.payload;
    },
    regionCopied(state, action: PayloadAction<Note[]>) {
      if (!state.highlightedRegion) {
        return;
      }

      const rectangle = normalizeRegion(state.highlightedRegion);
      state.copyBuffer = copyRectangle(action.payload, rectangle);
    },
  },
});

export const {
  staffLineAdded,
  activeNoteChanged,
  highlightedRegionCleared,
  highlightedRegionEndChanged,
  highlightedRegionStartChanged,
  mouseDownChanged,
  layoutChanged,
  regionCopied,
} = slice.actions;

export default slice.reducer;
