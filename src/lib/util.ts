import { Note, standardBassTuning, StringTuning } from './tab';

/**
 * Excerpt of tab of "In Your Eyes" by BADBADNOTGOOD.
 * @returns note array of tab
 */
export function exampleSong(): Note[] {
  const spec = `4 A/5 1 E/5 4 A/5 1 E/5 4 A/5 1 E/5 4 A/5 2 D/7 1 D/7 D/6 D/6 2 E/8 1 A/8 2 E/8 1 A/8 2 A/8 1 D/5 D/6 2 D/7 1 A/7 D/7 D/6 D/6\
      1 E/8 2 A/8 A/8 1 E/8 A/8 E/8 2 A/8 E/8 D/5 D/6 D/7 2 D/7 1 D/7 D/6 4 D/6 2 D/5 1 D/5 2 D/5 1 A/5 D/5 A/5 D/5 A/7 E/7 A/5 2 A/7
      2 A/7 1 E/7 A/5 A/5 A/X 2 E/5 1 E/5 E/5 2 A/7 D/5 1 A/7 D/6 2 2 D/7 D/7 D/6 2 D/6 1 E/8 A/8 A/8 E/8 A/8 2 A/8 D/10 1 D/9 D/8 D/7`;

  const tab = parseSpec(spec, standardBassTuning);
  if (tab === null) {
    return [];
  }

  return tab;
}

/**
 * Get number of lines from a tuning.
 * @param tuning tuning to check
 * @returns number of lines
 */
export function tuningNumberOfLines(tuning: StringTuning): number {
  let lines = 0;
  for (let prop in tuning) {
    if (tuning.hasOwnProperty(prop)) {
      lines += 1;
    }
  }
  return lines;
}

/**
 * Find max column within the notes
 * @param notes
 * @returns the max column
 */
export function maxColumn(notes: Note[]): number {
  // TODO take advantage of sorting of notes
  let max = 0;
  for (let note of notes) {
    if (note.column > max) {
      max = note.column;
    }
  }

  return max;
}

/**
 * Parse a spec of the following format. A spec is composed of notes of the form
 * <string>/<fret> and note length updates <new note length>. A note length
 * update sets the current number of columns.
 * @param spec spec to parse
 * @param stringNames string tuning to use
 * @returns parsed notes
 */
export function parseSpec(
  spec: string,
  stringNames: StringTuning,
): Note[] | null {
  const lineCount = tuningNumberOfLines(stringNames);
  const noteCountRegexp = /(\d+)/; // note length update is just a number
  const noteRegexp = /(\w+)\/(\w+)/; // note is format <string>/<fret>

  let noteIndex = 0;
  let noteLength = 1;

  const specArr = spec.split(' ');

  const notes: Note[] = [];
  for (let part of specArr) {
    if (part === '') {
      continue;
    }

    let match;
    if ((match = part.match(noteRegexp))) {
      const stringName = match[1];
      const fret = match[2];

      const stringIndex = stringNames[stringName];
      if (fret.length === 1) {
        // Single-length notes are inserted as-is
        notes.push({
          text: fret,
          line: stringIndex,
          column: noteIndex,
        });
      } else if (fret.length === 2) {
        // Double-length notes are inserted as two notes. The first character
        // is a note on this column while the second is a note on the next
        // column
        notes.push({
          text: fret[0],
          line: stringIndex,
          column: noteIndex,
        });
        notes.push({
          text: fret[1],
          line: stringIndex,
          column: noteIndex + 1,
        });
      } else {
        return null;
      }

      noteIndex += noteLength;
    } else if ((match = part.match(noteCountRegexp))) {
      noteLength = parseInt(match[0]);
    } else {
      return null;
    }
  }

  notes.sort(
    (a, b) =>
      a.line + lineCount * a.column - (b.line + lineCount * b.column),
  );

  return notes;
}

/**
 * Render a tab into string format.
 * @param notes internal note structure
 * @param lineCount number of lines per staff line
 * @param spacesPerLine number of spaces for notes per line
 * @returns a string[][] tab, where tab[i][j] is the jth line of the ith staff
 * line
 */
export function renderTab(
  notes: Note[],
  lineCount: number,
  spacesPerLine: number,
): string[][] {
  const tab: string[][] = [];
  let line = 0,
    column = 0;

  const insertAndMove = (text: string, staffLine: number): void => {
    // Ensure that there's a string corresponding to this line on this staff line
    if (!tab[staffLine]) {
      tab[staffLine] = [];
    }

    if (!tab[staffLine][line]) {
      tab[staffLine][line] = '';
    }

    tab[staffLine][line] += text;

    // Move on to next position
    if (line === lineCount - 1) {
      // reset line
      line = 0;
      column++;
    } else {
      line++;
    }
  };

  for (const note of notes) {
    if (note.line < 0 || note.line >= lineCount) {
      continue;
    }

    const goalLine = note.line,
      goalColumn = note.column;

    // fill intermediate spaces with dashes
    while (line < goalLine || column < goalColumn) {
      insertAndMove('-', Math.floor(column / spacesPerLine));
    }

    insertAndMove(note.text, Math.floor(goalColumn / spacesPerLine));
  }

  const lastStaffLine = Math.floor(column / spacesPerLine);
  while (Math.floor(column / spacesPerLine) === lastStaffLine) {
    insertAndMove('-', lastStaffLine);
  }

  return tab;
}
