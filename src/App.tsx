import React from 'react';
import './App.css';
import { useAppDispatch, useAppSelector } from './app/hooks';
import {
  highlightedRegionCleared,
  highlightedRegionEndChanged,
  highlightedRegionStartChanged,
  mouseDownChanged,
  Note,
  noteAdded,
  activeNoteChanged,
  Region,
  regionCopied,
  regionCut,
  regionDeleted,
  regionPasted,
} from './features/tab';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

function fallsWithinRegion(
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

export function App() {
  const note = useAppSelector((state) => state.tab.activeNote);
  const notes = useAppSelector((state) => state.tab.notes);

  const dispatch = useAppDispatch();

  // Staff parameters
  const lineCount = 4,
    noteWidth = 18,
    noteCountPerLine = 40,
    padding = 20,
    margin = 10;

  const movePosition = (line: number, column: number): void => {
    if (note.text) {
      dispatch(noteAdded(note));
    }
    dispatch(activeNoteChanged({ text: '', line, column }));
    dispatch(highlightedRegionCleared());
  };

  // Handle staff and edit events
  const keyDownHandler = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.code === 'ArrowUp') {
      movePosition(
        (note.line - 1 + lineCount) % lineCount,
        note.column,
      );
      return false;
    } else if (event.code === 'ArrowDown') {
      movePosition((note.line + 1) % lineCount, note.column);
      return false;
    } else if (event.code === 'ArrowLeft') {
      movePosition(note.line, note.column - 1);
      return false;
    } else if (event.code === 'ArrowRight') {
      movePosition(note.line, note.column + 1);
      return false;
    } else if (event.code === 'Delete') {
      dispatch(regionDeleted());
    } else if (event.ctrlKey && event.code === 'KeyC') {
      dispatch(regionCopied());
    } else if (event.ctrlKey && event.code === 'KeyV') {
      dispatch(regionPasted());
    } else if (event.ctrlKey && event.code === 'KeyX') {
      dispatch(regionCut());
    }

    if (event.key.match(/\d/)) {
      const newText =
        note.text.length > 1 ? event.key : note.text + event.key;

      dispatch(
        activeNoteChanged({
          text: newText,
          line: note.line,
          column: note.column,
        }),
      );
    }
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
      />
    </div>
  );
}

interface StaffProps {
  padding: number;
  margin: number;
  lineCount: number;
  noteWidth: number;
  noteCountPerLine: number;
  notes: Note[];
  currentPosition?: Note;
  highlightedRegion?: Region;
}

function Staff(props: StaffProps) {
  const {
    padding,
    margin,
    lineCount,
    noteWidth,
    noteCountPerLine,
    notes,
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
  } = props;

  const dispatch = useAppDispatch();
  const note = useAppSelector((state) => state.tab.activeNote);
  const isMouseDown = useAppSelector(
    (state) => state.tab.isMouseDown,
  );
  const highlightedRegion = useAppSelector(
    (state) => state.tab.highlightedRegion,
  );

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
        i === note.line &&
        j + staffLineIndex * noteCount === note.column;

      if (isSelected && note.text && visibleElements[i]) {
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
            {note.text}
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

      const mouseDownHandler = (event: React.MouseEvent) => {
        dispatch(
          highlightedRegionStartChanged(
            i,
            j + staffLineIndex * noteCount,
          ),
        );
        dispatch(mouseDownChanged(true));
        dispatch(
          activeNoteChanged({
            text: note.text,
            line: i,
            column: j + staffLineIndex * noteCount,
          }),
        );
      };

      const mouseUpHandler = (event: React.MouseEvent) => {
        dispatch(mouseDownChanged(false));
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

        dispatch(
          highlightedRegionEndChanged(
            line,
            column + staffLineIndex * noteCount,
          ),
        );
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
          j + staffLineIndex * noteCount,
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
