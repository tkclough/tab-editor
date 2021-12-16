import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  Region,
  CopyBuffer,
  RegionStart,
  RegionEnd,
  deleteRectangle,
  normalizeRegion,
  copyRectangle,
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

const initialState: Tab = {
  notes: notes,
  stringSpec: standardBassTuning,
  activeNote: {
    text: '',
    line: 0,
    column: 0,
  },
  isMouseDown: false,
  notesPerLine,
  numberOfStaffLines,
};

export const slice = createSlice({
  name: 'tab',
  initialState: initialState,
  reducers: {
    notesChanged(state, action: PayloadAction<Note[]>) {
      state.notes = action.payload;
    },
    noteAdded(state, action: PayloadAction<Note>) {
      insertNote(state.notes, action.payload);
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
    regionDeleted(state) {
      if (!state.highlightedRegion) {
        return;
      }

      deleteRectangle(
        state.notes,
        normalizeRegion(state.highlightedRegion),
      );
    },
    regionCopied(state) {
      if (!state.highlightedRegion) {
        return;
      }

      const rectangle = normalizeRegion(state.highlightedRegion);
      state.copyBuffer = copyRectangle(state.notes, rectangle);
    },
    regionPasted(state) {
      if (!state.copyBuffer) {
        return;
      }

      const { column: currentColumn, line: currentLine } =
        state.activeNote;
      const rectangle = {
        left: currentColumn,
        right: currentColumn + state.copyBuffer.width,
        top: currentLine,
        bottom: currentLine + state.copyBuffer.height,
      };

      deleteRectangle(state.notes, rectangle);

      // TODO dealing with out of bounds notes
      for (const { column, line, text } of state.copyBuffer.buffer) {
        const translatedNote = {
          text,
          column: currentColumn + column,
          line: currentLine + line,
        };
        insertNote(state.notes, translatedNote);
      }
    },
    regionCut(state) {
      if (!state.highlightedRegion) {
        return;
      }

      const rectangle = normalizeRegion(state.highlightedRegion);

      state.copyBuffer = copyRectangle(state.notes, rectangle);
      deleteRectangle(state.notes, rectangle);
    },
  },
});

export const {
  notesChanged,
  noteAdded,
  regionDeleted,
  activeNoteChanged,
  highlightedRegionCleared,
  highlightedRegionEndChanged,
  highlightedRegionStartChanged,
  mouseDownChanged,
  regionCopied,
  regionPasted,
  regionCut,
} = slice.actions;

export default slice.reducer;
