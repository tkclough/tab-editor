import { Note, standardBassTuning, StringTuning } from './tab';

// Beginning of In Your Eyes by BADBADNOTGOOD
export function exampleSong(): Note[] {
  const spec = `4 A/5 1 E/5 4 A/5 1 E/5 4 A/5 1 E/5 4 A/5 2 D/7 1 D/7 D/6 D/6 2 E/8 1 A/8 2 E/8 1 A/8 2 A/8 1 D/5 D/6 2 D/7 1 A/7 D/7 D/6 D/6\
      1 E/8 2 A/8 A/8 1 E/8 A/8 E/8 2 A/8 E/8 D/5 D/6 D/7 2 D/7 1 D/7 D/6 4 D/6 2 D/5 1 D/5 2 D/5 1 A/5 D/5 A/5 D/5 A/7 E/7 A/5 2 A/7
      2 A/7 1 E/7 A/5 A/5 A/X 2 E/5 1 E/5 E/5 2 A/7 D/5 1 A/7 D/6 2 2 D/7 D/7 D/6 2 D/6 1 E/8 A/8 A/8 E/8 A/8 2 A/8 D/10 1 D/9 D/8 D/7`;

  return parseSpec(spec, standardBassTuning);
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
