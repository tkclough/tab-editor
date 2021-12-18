import { Note, standardBassTuning, StringTuning } from './tab';

// Beginning of In Your Eyes by BADBADNOTGOOD
export function exampleSong(): Note[] {
  const spec = `4 A/5 1 E/5 4 A/5 1 E/5 4 A/5 1 E/5 4 A/5 2 D/7 1 D/7 D/6 D/6 2 E/8 1 A/8 2 E/8 1 A/8 2 A/8 1 D/5 D/6 2 D/7 1 A/7 D/7 D/6 D/6\
      1 E/8 2 A/8 A/8 1 E/8 A/8 E/8 2 A/8 E/8 D/5 D/6 D/7 2 D/7 1 D/7 D/6 4 D/6 2 D/5 1 D/5 2 D/5 1 A/5 D/5 A/5 D/5 A/7 E/7 A/5 2 A/7
      2 A/7 1 E/7 A/5 A/5 A/X 2 E/5 1 E/5 E/5 2 A/7 D/5 1 A/7 D/6 2 2 D/7 D/7 D/6 2 D/6 1 E/8 A/8 A/8 E/8 A/8 2 A/8 D/10 1 D/9 D/8 D/7`;

  return parseSpec(spec, standardBassTuning);
}

export function tuningNumberOfLines(tuning: StringTuning): number {
  let lines = 0;
  for (let prop in tuning) {
    if (tuning.hasOwnProperty(prop)) {
      lines += 1;
    }
  }
  return lines;
}

export function maxColumn(notes: Note[]): number {
  let max = 0;
  for (let note of notes) {
    if (note.column > max) {
      max = note.column;
    }
  }

  return max;
}

export function parseSpec(
  spec: string,
  stringNames: StringTuning,
): Note[] {
  const lineCount = tuningNumberOfLines(stringNames);
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
      if (fret.length === 1) {
        notes.push({
          text: fret,
          line: stringIndex,
          column: noteIndex,
        });
      } else {
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
      }

      noteIndex += noteLength;
    } else if ((match = part.match(noteCountRegexp))) {
      noteLength = parseInt(match[0]);
    }
  }

  notes.sort(
    (a, b) =>
      a.line + lineCount * a.column - (b.line + lineCount * b.column),
  );

  return notes;
}

export function renderTab(
  notes: Note[],
  lineCount: number,
  spacesPerLine: number,
): string[][] {
  const tab: string[][] = []; // tab[i][j] is the jth line of the ith staff line

  let line = 0,
    column = 0;
  for (const note of notes) {
    if (note.line < 0 || note.line >= lineCount) {
      continue;
    }

    const goalLine = note.line,
      goalColumn = note.column;

    // fill intermediate spaces with dashes
    while (line < goalLine || column < goalColumn) {
      const staffLine = Math.floor(column / spacesPerLine);

      if (!tab[staffLine]) {
        tab[staffLine] = [];
      }

      if (!tab[staffLine][line]) {
        tab[staffLine][line] = '';
      }

      tab[staffLine][line] += '-';

      if (line === lineCount - 1) {
        line = 0;
        column++;
      } else {
        line++;
      }
    }

    const staffLine = Math.floor(goalColumn / spacesPerLine);

    if (!tab[staffLine]) {
      tab[staffLine] = [];
    }

    if (!tab[staffLine][line]) {
      tab[staffLine][line] = '';
    }

    tab[staffLine][line] += note.text;

    if (line === lineCount - 1) {
      line = 0;
      column++;
    } else {
      line++;
    }
  }

  const lastStaffLine = Math.floor(column / spacesPerLine);
  while (Math.floor(column / spacesPerLine) === lastStaffLine) {
    if (!tab[lastStaffLine]) {
      tab[lastStaffLine] = [];
    }

    if (!tab[lastStaffLine][line]) {
      tab[lastStaffLine][line] = '';
    }

    tab[lastStaffLine][line] += '-';

    if (line === lineCount - 1) {
      line = 0;
      column++;
    } else {
      line++;
    }
  }

  return tab;
}
