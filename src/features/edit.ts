import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Note {
  text: string;
  line: number;
  column: number;
}

export interface Region {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface EditState {
  note: Note;
  isMouseDown: boolean;
  highlightedRegion?: Region;
}

interface RegionStart {
  startLine: number;
  startColumn: number;
}

interface RegionEnd {
  endLine: number;
  endColumn: number;
}

const initialState: EditState = {
  note: {
    text: '',
    line: 0,
    column: 0,
  },
  isMouseDown: true,
};

export const editSlice = createSlice({
  name: 'edit',
  initialState,
  reducers: {
    noteChanged(state, action: PayloadAction<Note>) {
      const { text, line, column } = action.payload;
      state.note.text = text;
      state.note.line = line;
      state.note.column = column;
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
  },
});

export const {
  noteChanged,
  highlightedRegionStartChanged,
  highlightedRegionEndChanged,
  mouseDownChanged,
} = editSlice.actions;

export default editSlice.reducer;
