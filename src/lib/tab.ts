export interface Note {
  text: string;
  line: number;
  column: number;
}

export interface StringTuning {
  [name: string]: number;
}

/**
 * EADG tuning for a bass
 */
export const standardBassTuning: StringTuning = {
  E: 3,
  A: 2,
  D: 1,
  G: 0,
};

/**
 * Find the index such that all indices greater than it appear after the
 * specified column and note (where we order according to column then line).
 * @param notes the notes to search through
 * @param targetColumn the column to look for
 * @param targetLine the line to look for
 * @returns an index satisfying above
 */
export function findLastIndexLessEqual(
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
export function insertNote(notes: Note[], note: Note): void {
  if (notes.length === 0) {
    notes.push(note);
    return;
  }

  const ix = findLastIndexLessEqual(notes, note.column, note.line);

  if (
    notes[ix]?.column === note.column &&
    notes[ix]?.line === note.line
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
export function deleteNote(
  notes: Note[],
  targetColumn: number,
  targetLine: number,
): void {
  if (notes.length === 0) {
    return;
  }

  const ix = findLastIndexLessEqual(notes, targetColumn, targetLine);

  if (
    notes[ix]?.column === targetColumn &&
    notes[ix]?.line === targetLine
  ) {
    notes.splice(ix, 1);
  }
}
