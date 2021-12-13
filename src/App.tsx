import React, { useState } from 'react';
import './App.css';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

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

export function App() {
  const [currentPosition, setCurrentPosition] = useState({
    text: '',
    line: 0,
    position: 0,
  });

  const lineCount = 4,
    noteWidth = 18,
    noteCountPerLine = 40,
    padding = 20,
    margin = 10;

  const [notes, setNotes] = useState(exampleSong());

  const keyDownHandler = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.code === 'ArrowUp') {
      if (currentPosition.text) {
        setNotes([...notes, { ...currentPosition }]);
      }

      setCurrentPosition({
        text: '',
        line: (currentPosition.line - 1 + lineCount) % lineCount,
        position: currentPosition.position,
      });
    } else if (event.code === 'ArrowDown') {
      if (currentPosition.text) {
        setNotes([...notes, { ...currentPosition }]);
      }

      setCurrentPosition({
        text: '',
        line: (currentPosition.line + 1) % lineCount,
        position: currentPosition.position,
      });
    } else if (event.code === 'ArrowLeft') {
      if (currentPosition.text) {
        setNotes([...notes, { ...currentPosition }]);
      }

      setCurrentPosition({
        text: '',
        line: currentPosition.line,
        position: currentPosition.position - 1,
      });
    } else if (event.code === 'ArrowRight') {
      if (currentPosition.text) {
        setNotes([...notes, { ...currentPosition }]);
      }

      setCurrentPosition({
        text: '',
        line: currentPosition.line,
        position: currentPosition.position + 1,
      });
    }

    if (event.key.match(/\d/)) {
      const newText =
        currentPosition.text.length > 2
          ? event.key
          : currentPosition.text + event.key;

      setCurrentPosition({
        text: newText,
        line: currentPosition.line,
        position: currentPosition.position,
      });
    }
  };

  const setPosition = (
    staffLine: number,
    line: number,
    position: number,
  ) => {
    const absolutePosition = staffLine * noteCountPerLine + position;
    setCurrentPosition({
      text: '',
      line: line,
      position: absolutePosition,
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
        currentPosition={currentPosition}
        setPosition={setPosition}
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
        position: noteIndex,
      });

      noteIndex += noteLength;
    } else if ((match = part.match(noteCountRegexp))) {
      noteLength = parseInt(match[0]);
    }
  }

  return notes;
}

interface Note {
  text: string;
  line: number;
  position: number;
}

interface StaffProps {
  padding: number;
  margin: number;
  lineCount: number;
  noteWidth: number;
  noteCountPerLine: number;
  notes: Note[];
  currentPosition?: Note;
  setPosition(
    staffLine: number,
    line: number,
    position: number,
  ): void;
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
    setPosition,
  } = props;

  // Position notes on separate staff lines
  let staffLines: Note[][] = [];
  for (let note of notes) {
    note = { ...note };

    const staffLine = Math.floor(note.position / noteCountPerLine);
    const staffPosition = note.position % noteCountPerLine;

    if (!staffLines[staffLine]) {
      staffLines[staffLine] = [];
    }

    note.position = staffPosition;

    staffLines[staffLine].push(note);
  }

  // Figure out which staff line active position goes on
  let positionStaffLine: number | undefined,
    staffLineCurrentPosition: Note | undefined;
  if (currentPosition) {
    positionStaffLine = Math.floor(
      currentPosition.position / noteCountPerLine,
    );
    staffLineCurrentPosition = {
      text: currentPosition.text,
      line: currentPosition.line,
      position: currentPosition.position % noteCountPerLine,
    };
  }

  const staffLineElements = staffLines.map((staffLine, i) => (
    <StaffLine
      key={i}
      padding={padding}
      margin={margin}
      lineCount={lineCount}
      noteWidth={noteWidth}
      noteCount={noteCountPerLine}
      notes={staffLine}
      currentPosition={
        i === positionStaffLine ? staffLineCurrentPosition : undefined
      }
      setPosition={(line, position) => {
        setPosition(i, line, position);
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
  lineCount: number;
  noteWidth: number;
  noteCount: number;
  notes: Note[];
  currentPosition?: Note;
  setPosition(line: number, position: number): void;
}

function StaffLine(props: StaffLineProps) {
  const {
    padding,
    margin,
    lineCount,
    noteWidth,
    noteCount,
    notes,
    currentPosition,
    setPosition,
  } = props;

  const height = 2 * margin + (lineCount - 1) * padding;
  const width = noteWidth * noteCount;

  const visibleElements: JSX.Element[][] = [];

  for (let note of notes) {
    const x = note.position * noteWidth;
    const y = note.line * padding + margin + 5; // TODO magic number

    if (!visibleElements[note.line]) {
      visibleElements[note.line] = [];
    }

    visibleElements[note.line][note.position] = (
      <text
        className="staffElement"
        x={x}
        y={y}
        key={note.line * noteCount + note.position}
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
        j === currentPosition?.position;

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

      const boxClass = isSelected ? 'staffBox selected' : 'staffBox';
      boxes.push(
        <rect
          key={i * noteCount + j}
          className={boxClass}
          x={x}
          y={y - 8} // TODO magic number
          width={noteWidth}
          height={15} // TODO magic number
          stroke="black"
          strokeWidth="1"
          onClick={onBoxClick}
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
