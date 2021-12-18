import { Note, deleteNote, findLastIndexLessEqual } from './tab';

export interface Region {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface RegionStart {
  startLine: number;
  startColumn: number;
}

export interface RegionEnd {
  endLine: number;
  endColumn: number;
}

export interface Rectangle {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface CopyBuffer {
  buffer: Note[];
  width: number;
  height: number;
}

/**
 * Determine whether a given position is within a region.
 * @param region
 * @param line line position
 * @param column column position
 * @returns
 */
export function fallsWithinRegion(
  region: Region,
  line: number,
  column: number,
): boolean {
  if (
    region.startLine <= line &&
    line <= region.endLine &&
    region.startColumn <= column &&
    column <= region.endColumn
  ) {
    return true;
  }

  if (
    region.endLine <= line &&
    line <= region.startLine &&
    region.endColumn <= column &&
    column <= region.startColumn
  ) {
    return true;
  }

  return false;
}

/**
 * Turn a region, which can go either direction on the screen, into a rectangle
 * that has well-ordered parameters.
 * @param region region to transform
 * @returns a rectangle equivalent to the region
 */
export function normalizeRegion(region: Region): Rectangle {
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
 * Delete all notes within a rectangle (including the border).
 * @param notes array to delete from
 * @param rectangle rectangle to delete
 */
export function deleteRectangle(notes: Note[], rectangle: Rectangle) {
  const { left, right, top, bottom } = rectangle;

  for (let i = top; i <= bottom; i++) {
    for (let j = left; j <= right; j++) {
      deleteNote(notes, j, i);
    }
  }
}

/**
 * Copy notes from a rectangle into a copy buffer.
 * @param notes notes to copy from
 * @param rectangle rectangle of notes to copy from
 * @returns the new copy buffer
 */
export function copyRectangle(
  notes: Note[],
  rectangle: Rectangle,
): CopyBuffer {
  const { left, right, top, bottom } = rectangle;

  const buffer: Note[] = [];

  // Find index in notes corresponding to first note within rectangle
  let firstIx = findLastIndexLessEqual(notes, left, top);
  // Find index in notes corresponding to last note within rectangle
  let lastIx = findLastIndexLessEqual(notes, right, bottom);

  // Move forward until within the rectangle
  while (
    firstIx < notes.length &&
    (notes[firstIx].column < left ||
      (notes[firstIx].column === left && notes[firstIx].line < top))
  ) {
    firstIx++;
  }

  // Move backward until within rectangle
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

    // Note is translated so top left is (0, 0)
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
