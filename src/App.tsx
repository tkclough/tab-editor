import React, { useState } from 'react';
import './App.css';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

// Represents a highlighted region of the staff
interface HighlightRegion {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

// A place on a staff plus content for that place
interface Note {
  text: string;
  line: number;
  column: number;
}

// Beginning of In Your Eyes by BADBADNOTGOOD
function exampleSong(): Note[] {
  const stringSpec = {
    E: 3,
    A: 2,
    D: 1,
    G: 0,
  };

  const spec = `4 A/5 1 E/5 4 A/5 1 E/5 4 A/5 1 E/5 4 A/5 2 D/7 1 D/7 D/6 D/6 2 E/8 1 A/8 2 E/8 1 A/8 2 A/8 1 D/5 D/6 2 D/7 1 A/7 D/7 D/6 D/6\
    1 E/8 2 A/8 A/8 1 E/8 A/8 E/8 2 A/8 E/8 D/5 D/6 D/7 2 D/7 1 D/7 D/6 4 D/6 2 D/5 1 D/5 2 D/5 1 A/5 D/5 A/5 D/5 A/7 E/7 A/5 2 A/7
    2 A/7 1 E/7 A/5 A/5 A/X 2 E/5 1 E/5 E/5 2 A/7 D/5 1 A/7 D/6 2 2 D/7 D/7 D/6 2 D/6 1 E/8 A/8 A/8 E/8 A/8 2 A/8 D/10 1 D/9 D/8 D/7`;

  return parseSpec(spec, stringSpec);
}

function fallsWithinRegion(
  region: HighlightRegion,
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

export function App() {
  // Staff parameters
  const lineCount = 4,
    noteWidth = 18,
    noteCountPerLine = 40,
    padding = 20,
    margin = 10;

  const [isMouseDown, setIsMouseDown] = useState(false);

  const [highlightRegion, setHighlightRegion] =
    useState<HighlightRegion | null>(null);

  const [currentNote, setCurrentNote] = useState<Note>({
    text: '',
    line: 0,
    column: 0,
  });

  const [notes, setNotes] = useState<Note[]>(exampleSong());

  // Handle staff and edit events
  const keyDownHandler = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.code === 'ArrowUp') {
      if (currentNote.text) {
        setNotes([...notes, { ...currentNote }]);
      }

      setCurrentNote({
        text: '',
        line: (currentNote.line - 1 + lineCount) % lineCount,
        column: currentNote.column,
      });
    } else if (event.code === 'ArrowDown') {
      if (currentNote.text) {
        setNotes([...notes, { ...currentNote }]);
      }

      setCurrentNote({
        text: '',
        line: (currentNote.line + 1) % lineCount,
        column: currentNote.column,
      });
    } else if (event.code === 'ArrowLeft') {
      if (currentNote.text) {
        setNotes([...notes, { ...currentNote }]);
      }

      setCurrentNote({
        text: '',
        line: currentNote.line,
        column: currentNote.column - 1,
      });
    } else if (event.code === 'ArrowRight') {
      if (currentNote.text) {
        setNotes([...notes, { ...currentNote }]);
      }

      setCurrentNote({
        text: '',
        line: currentNote.line,
        column: currentNote.column + 1,
      });
    }

    if (event.key.match(/\d/)) {
      const newText =
        currentNote.text.length > 1
          ? event.key
          : currentNote.text + event.key;

      setCurrentNote({
        text: newText,
        line: currentNote.line,
        column: currentNote.column,
      });
    }
  };

  const setHighlightRegionStart = (
    line: number,
    column: number,
  ): void => {
    setHighlightRegion({
      startColumn: column,
      startLine: line,
      endColumn: column,
      endLine: line,
    });
  };

  const setHighlightRegionEnd = (
    line: number,
    column: number,
  ): void => {
    setHighlightRegion({
      startColumn: highlightRegion?.startColumn ?? column,
      startLine: highlightRegion?.startLine ?? line,
      endColumn: column,
      endLine: line,
    });
  };

  // Callback to update the active position
  const setPosition = (
    staffLine: number,
    line: number,
    position: number,
  ) => {
    const absolutePosition = staffLine * noteCountPerLine + position;
    setCurrentNote({
      text: '',
      line: line,
      column: absolutePosition,
    });
  };

  return (
    <div className="App" tabIndex={0} onKeyDown={keyDownHandler}>
      <Staff
        padding={padding}
        margin={margin}
        lineCount={lineCount}
        noteWidth={noteWidth}
        noteCountPerLine={noteCountPerLine}
        notes={notes}
        currentPosition={currentNote}
        highlightedRegion={highlightRegion ?? undefined}
        isMouseDown={isMouseDown}
        setIsMouseDown={setIsMouseDown}
        setPosition={setPosition}
        setHighlightRegionStart={setHighlightRegionStart}
        setHighlightRegionEnd={setHighlightRegionEnd}
      />
    </div>
  );
}

interface StringSpec {
  [name: string]: number;
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

interface StaffProps {
  padding: number;
  margin: number;
  lineCount: number;
  noteWidth: number;
  noteCountPerLine: number;
  notes: Note[];
  currentPosition?: Note;
  highlightedRegion?: HighlightRegion;
  isMouseDown: boolean;
  setIsMouseDown(isMouseDown: boolean): void;
  setPosition(
    staffLine: number,
    line: number,
    position: number,
  ): void;
  setHighlightRegionStart(line: number, column: number): void;
  setHighlightRegionEnd(line: number, column: number): void;
}

function Staff(props: StaffProps) {
  const {
    padding,
    margin,
    lineCount,
    noteWidth,
    noteCountPerLine,
    notes,
    currentPosition,
    highlightedRegion,
    isMouseDown,
    setIsMouseDown,
    setPosition,
    setHighlightRegionStart,
    setHighlightRegionEnd,
  } = props;

  // Position notes on separate staff lines
  let staffLines: Note[][] = [];
  for (let note of notes) {
    note = { ...note };

    const staffLine = Math.floor(note.column / noteCountPerLine);
    const staffPosition = note.column % noteCountPerLine;

    if (!staffLines[staffLine]) {
      staffLines[staffLine] = [];
    }

    note.column = staffPosition;

    staffLines[staffLine].push(note);
  }

  const staffLineElements = staffLines.map((staffLine, i) => (
    <StaffLine
      key={i}
      padding={padding}
      margin={margin}
      lineCount={lineCount}
      staffLineIndex={i}
      noteWidth={noteWidth}
      noteCount={noteCountPerLine}
      notes={staffLine}
      currentPosition={currentPosition}
      highlightedRegion={highlightedRegion}
      isMouseDown={isMouseDown}
      setIsMouseDown={setIsMouseDown}
      setPosition={(line, position) => {
        setPosition(i, line, position);
      }}
      setHighlightRegionStart={(line, column) => {
        setHighlightRegionStart(line, column + i * noteCountPerLine);
      }}
      setHighlightRegionEnd={(line, column) => {
        setHighlightRegionEnd(line, column + i * noteCountPerLine);
      }}
    />
  ));

  return (
    <div className="staffContainer">
      <div className="staff">{staffLineElements}</div>
    </div>
  );
}

interface StaffLineProps {
  padding: number;
  margin: number;
  staffLineIndex: number;
  lineCount: number;
  noteWidth: number;
  noteCount: number;
  notes: Note[];
  currentPosition?: Note;
  highlightedRegion?: HighlightRegion;
  isMouseDown: boolean;
  setIsMouseDown(isMouseDown: boolean): void;
  setPosition(line: number, position: number): void;
  setHighlightRegionStart(line: number, column: number): void;
  setHighlightRegionEnd(line: number, column: number): void;
}

function StaffLine(props: StaffLineProps) {
  const {
    padding,
    margin,
    lineCount,
    staffLineIndex,
    noteWidth,
    noteCount,
    notes,
    currentPosition,
    highlightedRegion,
    isMouseDown,
    setIsMouseDown,
    setPosition,
    setHighlightRegionStart,
    setHighlightRegionEnd,
  } = props;

  const height = 2 * margin + (lineCount - 1) * padding;
  const width = noteWidth * noteCount;

  const visibleElements: JSX.Element[][] = [];

  for (let note of notes) {
    const x = note.column * noteWidth;
    const y = note.line * padding + margin + 5; // TODO magic number

    if (!visibleElements[note.line]) {
      visibleElements[note.line] = [];
    }

    visibleElements[note.line][note.column] = (
      <text
        className="staffElement"
        x={x}
        y={y}
        key={note.line * noteCount + note.column}
      >
        {note.text}
      </text>
    );
  }

  const boxes = [];
  for (let i = 0; i < lineCount; i++) {
    const y = margin + i * padding;
    for (let j = 0; j < noteCount; j++) {
      const x = j * noteWidth;
      if (!visibleElements[i]) {
        visibleElements[i] = [];
      }

      const isSelected =
        i === currentPosition?.line &&
        j + staffLineIndex * noteCount === currentPosition?.column;

      if (isSelected && currentPosition?.text && visibleElements[i]) {
        if (!visibleElements[i]) {
          visibleElements[i] = [];
        }

        visibleElements[i][j] = (
          <text
            className="staffElement"
            x={j * noteWidth}
            y={y + 5} // TODO magic number
            key={i * noteCount + j}
          >
            {currentPosition?.text}
          </text>
        );
      } else if (!visibleElements[i][j]) {
        visibleElements[i][j] = (
          <line
            key={i * noteCount + j}
            className="staffElement"
            x1={x}
            y1={y}
            x2={x + noteWidth}
            y2={y}
            stroke="black"
            strokeWidth="1"
            opacity="0.9"
          />
        );
      }

      // Position box
      const onBoxClick = (event: React.MouseEvent) => {
        setPosition(i, j);
      };

      const mouseDownHandler = (event: React.MouseEvent) => {
        setHighlightRegionStart(i, j);
        setIsMouseDown(true);
      };

      const mouseUpHandler = (event: React.MouseEvent) => {
        setIsMouseDown(false);
      };

      const mouseEnterHandler = (event: React.MouseEvent) => {
        if (!isMouseDown) {
          return;
        }

        if (!(event.target instanceof SVGRectElement)) {
          return;
        }

        let line = parseInt(event.target.dataset.line ?? ''),
          column = parseInt(event.target.dataset.column ?? '');

        setHighlightRegionEnd(line, column);
      };

      let boxClass = 'staffBox';
      if (isSelected) {
        boxClass += ' selected';
      }

      if (
        highlightedRegion &&
        fallsWithinRegion(
          highlightedRegion,
          i,
          j + noteCount * staffLineIndex,
        )
      ) {
        boxClass += ' highlighted';
      }

      boxes.push(
        <rect
          key={i * noteCount + j}
          className={boxClass}
          x={x}
          y={y - padding / 2}
          width={noteWidth}
          height={padding}
          stroke="none"
          onClick={onBoxClick}
          onMouseDown={mouseDownHandler}
          onMouseUp={mouseUpHandler}
          onMouseEnter={mouseEnterHandler}
          data-line={i}
          data-column={j}
        />,
      );
    }
  }

  return (
    <svg
      width={width}
      height={height}
      className="staffLine"
      xmlns={SVG_NAMESPACE}
    >
      {visibleElements.flat()}
      {boxes}
    </svg>
  );
}
