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

interface RegionStart {
  startLine: number;
  startColumn: number;
}

interface RegionEnd {
  endLine: number;
  endColumn: number;
}

interface Rectangle {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface CopyBuffer {
  buffer: Note[];
  width: number;
  height: number;
}

interface Tab {
  stringSpec: StringSpec;
  notes: Note[];
  activeNote: Note;
  isMouseDown: boolean;
  highlightedRegion?: Region;
  copyBuffer?: CopyBuffer;
}

interface StringSpec {
  [name: string]: number;
}

/**
 * Turn a region, which can go either direction on the screen, into a rectangle
 * that has well-ordered parameters.
 * @param region region to transform
 * @returns a rectangle equivalent to the region
 */
function normalizeRegion(region: Region): Rectangle {
  const { startLine, startColumn, endLine, endColumn } = region;
  let left, top, right, bottom;
  if (startLine < endLine) {
    top = startLine;
    bottom = endLine;
  } else {
    top = endLine;
    bottom = startLine;
  }

  if (startColumn < endColumn) {
    left = startColumn;
    right = endColumn;
  } else {
    left = endColumn;
    right = startColumn;
  }

  return { left, right, top, bottom };
}

/**
 * Find the index such that all indices greater than it appear after the
 * specified column and note (where we order according to column then line).
 * @param notes the notes to search through
 * @param targetColumn the column to look for
 * @param targetLine the line to look for
 * @returns an index satisfying above
 */
function findLastIndexLessEqual(
  notes: Note[],
  targetColumn: number,
  targetLine: number,
): number {
  if (notes.length === 0) {
    return 0;
  }

  let left = 0,
    right = notes.length - 1;
  while (right >= left) {
    const mid = left + Math.floor((right - left) / 2);
    const column = notes[mid].column,
      line = notes[mid].line;

    if (column === targetColumn && line === targetLine) {
      return mid;
    }

    if (
      column > targetColumn ||
      (column === targetColumn && line > targetLine)
    ) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  return left;
}

/**
 * Insert a note into the ordered array.
 * @param notes notes to insert into
 * @param note note to insert
 */
function insertNote(notes: Note[], note: Note): void {
  if (notes.length === 0) {
    notes.push(note);
    return;
  }

  const ix = findLastIndexLessEqual(notes, note.column, note.line);

  if (
    notes[ix].column === note.column &&
    notes[ix].line === note.line
  ) {
    notes.splice(ix, 1, note);
  } else {
    notes.splice(ix, 0, note);
  }
}

/**
 * Delete a note from the array if it exists.
 * @param notes array to delete from
 * @param targetColumn column to look for
 * @param targetLine line to look for
 */
function deleteNote(
  notes: Note[],
  targetColumn: number,
  targetLine: number,
): void {
  if (notes.length === 0) {
    return;
  }

  const ix = findLastIndexLessEqual(notes, targetColumn, targetLine);

  if (
    notes[ix].column === targetColumn &&
    notes[ix].line === targetLine
  ) {
    notes.splice(ix, 1);
  }
}

/**
 * Delete all notes within a rectangle (including the border).
 * @param notes array to delete from
 * @param rectangle rectangle to delete
 */
function deleteRectangle(notes: Note[], rectangle: Rectangle) {
  const { left, right, top, bottom } = rectangle;

  for (let i = top; i <= bottom; i++) {
    for (let j = left; j <= right; j++) {
      deleteNote(notes, j, i);
    }
  }
}

function parseSpec(spec: string, stringNames: StringSpec): Note[] {
  const noteCountRegexp = /(\d+)/;
  const noteRegexp = /(\w+)\/(\w+)/;

  let noteIndex = 0;
  let noteLength = 1;

  const specArr = spec.split(' ');

  const notes: Note[] = [];
  for (let part of specArr) {
    let match;
    if ((match = part.match(noteRegexp))) {
      const stringName = match[1];
      const fret = match[2];

      const stringIndex = stringNames[stringName];
      notes.push({
        text: fret,
        line: stringIndex,
        column: noteIndex,
      });

      noteIndex += noteLength;
    } else if ((match = part.match(noteCountRegexp))) {
      noteLength = parseInt(match[0]);
    }
  }

  return notes;
}

function copyRectangle(
  notes: Note[],
  rectangle: Rectangle,
): CopyBuffer {
  const { left, right, top, bottom } = rectangle;

  const buffer: Note[] = [];

  let firstIx = findLastIndexLessEqual(notes, left, top);
  let lastIx = findLastIndexLessEqual(notes, right, bottom);

  while (
    firstIx < notes.length &&
    (notes[firstIx].column < left ||
      (notes[firstIx].column === left && notes[firstIx].line < top))
  ) {
    firstIx++;
  }

  while (
    lastIx >= 0 &&
    (notes[lastIx].column > right ||
      (notes[lastIx].column === right && notes[lastIx].line > top))
  ) {
    --lastIx;
  }

  for (let i = firstIx; i <= lastIx; i++) {
    const column = notes[i].column,
      line = notes[i].line,
      text = notes[i].text;

    if (line < top || line > bottom) {
      continue;
    }

    if (column < left || column > right) {
      continue;
    }

    buffer.push({
      text,
      column: column - left,
      line: line - top,
    });
  }
  return {
    buffer,
    width: right - left,
    height: bottom - top,
  };
}

/**
 * EADG tuning for a bass
 */
const standardBassSpec: StringSpec = {
  E: 3,
  A: 2,
  D: 1,
  G: 0,
};

// Beginning of In Your Eyes by BADBADNOTGOOD
function exampleSong(): Note[] {
  const spec = `4 A/5 1 E/5 4 A/5 1 E/5 4 A/5 1 E/5 4 A/5 2 D/7 1 D/7 D/6 D/6 2 E/8 1 A/8 2 E/8 1 A/8 2 A/8 1 D/5 D/6 2 D/7 1 A/7 D/7 D/6 D/6\
      1 E/8 2 A/8 A/8 1 E/8 A/8 E/8 2 A/8 E/8 D/5 D/6 D/7 2 D/7 1 D/7 D/6 4 D/6 2 D/5 1 D/5 2 D/5 1 A/5 D/5 A/5 D/5 A/7 E/7 A/5 2 A/7
      2 A/7 1 E/7 A/5 A/5 A/X 2 E/5 1 E/5 E/5 2 A/7 D/5 1 A/7 D/6 2 2 D/7 D/7 D/6 2 D/6 1 E/8 A/8 A/8 E/8 A/8 2 A/8 D/10 1 D/9 D/8 D/7`;

  return parseSpec(spec, standardBassSpec);
}

const initialState: Tab = {
  notes: exampleSong(),
  stringSpec: standardBassSpec,
  activeNote: {
    text: '',
    line: 0,
    column: 0,
  },
  isMouseDown: false,
};

export const slice = createSlice({
  name: 'tab',
  initialState: initialState,
  reducers: {
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
