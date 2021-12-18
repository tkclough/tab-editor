import React, { useEffect } from 'react';
import { ActionCreators } from 'redux-undo';
import './App.css';
import { useAppDispatch, useAppSelector } from './app/hooks';
import {
  highlightedRegionCleared,
  highlightedRegionEndChanged,
  highlightedRegionStartChanged,
  mouseDownChanged,
  activeNoteChanged,
  regionCopied,
  staffLineAdded,
  layoutChanged,
} from './features/editing';
import {
  noteAdded,
  regionDeleted,
  regionPasted,
  notesChanged,
} from './features/tab';
import { Region } from './lib/editing';
import { Note } from './lib/tab';
import { maxColumn, renderTab } from './lib/util';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export function App() {
  const dispatch = useAppDispatch();
  const notes = useAppSelector((state) => state.tab.present.notes);
  const noteCountPerLine = useAppSelector(
    (state) => state.editing.notesPerLine,
  );
  const numberOfStaffLines = useAppSelector(
    (state) => state.editing.numberOfStaffLines,
  );

  // Staff parameters
  const lineCount = 4,
    noteWidth = 9,
    padding = 20,
    margin = 10;

  useEffect(() => {
    const data = localStorage.getItem('tabData');
    let parsed;
    if (data !== null && (parsed = JSON.parse(data))) {
      dispatch(notesChanged(parsed));
    }
  }, []);

  const downloadTab = () => {
    let content = '';
    const rendered = renderTab(notes, lineCount, noteCountPerLine);
    for (let i = 0; i < rendered.length; i++) {
      const staffLine = rendered[i];
      for (let j = 0; j < staffLine.length; j++) {
        content += staffLine[j] + '\n';
      }
      content += '\n';
    }

    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(content),
    );
    element.setAttribute('download', 'tab.txt');

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  };

  const noteCountChangeHandler = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const notesPerLine = parseInt(event.target.value);
    const numberOfStaffLines = Math.ceil(
      maxColumn(notes) / notesPerLine,
    );
    dispatch(
      layoutChanged({
        notesPerLine,
        numberOfStaffLines,
      }),
    );
  };

  return (
    <div className="App">
      <button onClick={downloadTab}>Download</button>
      <input
        type="text"
        onChange={noteCountChangeHandler}
        value={noteCountPerLine}
      />
      <Staff
        padding={padding}
        margin={margin}
        lineCount={lineCount}
        noteWidth={noteWidth}
        noteCountPerLine={noteCountPerLine}
        numberOfStaffLines={numberOfStaffLines}
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
  numberOfStaffLines: number;
  notes: Note[];
  currentPosition?: Note;
  highlightedRegion?: Region;
}

function Staff(props: StaffProps) {
  const dispatch = useAppDispatch();
  const note = useAppSelector((state) => state.editing.activeNote);
  const region = useAppSelector(
    (state) => state.editing.highlightedRegion,
  );
  const copyBuffer = useAppSelector(
    (state) => state.editing.copyBuffer,
  );

  const {
    padding,
    margin,
    lineCount,
    noteWidth,
    noteCountPerLine,
    numberOfStaffLines,
    notes,
  } = props;

  const totalColumns = noteCountPerLine * numberOfStaffLines;

  const movePosition = (line: number, column: number): void => {
    if (note.text.length > 0) {
      dispatch(noteAdded(note));
    }
    dispatch(activeNoteChanged({ text: '', line, column }));
    dispatch(highlightedRegionCleared());
  };

  // Handle staff and edit events
  const keyDownHandler = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(
        event.code,
      ) > -1
    ) {
      event.preventDefault();
    }
    if (event.code === 'ArrowUp') {
      if (note.line === 0) {
        movePosition(
          lineCount - 1,
          (note.column - noteCountPerLine + totalColumns) %
            totalColumns,
        );
      } else {
        movePosition(
          (note.line - 1 + lineCount) % lineCount,
          note.column,
        );
      }
      return false;
    } else if (event.code === 'ArrowDown') {
      if (note.line === lineCount - 1) {
        if (
          Math.floor(note.column / noteCountPerLine) ===
          numberOfStaffLines - 1
        ) {
          dispatch(staffLineAdded());
        }

        movePosition(0, note.column + noteCountPerLine);
      } else {
        movePosition((note.line + 1) % lineCount, note.column);
      }
      return false;
    } else if (event.code === 'ArrowLeft') {
      const offset =
        (note.column - 1 + noteCountPerLine) % noteCountPerLine;
      const start =
        noteCountPerLine * Math.floor(note.column / noteCountPerLine);
      movePosition(note.line, start + offset);
      return false;
    } else if (event.code === 'ArrowRight') {
      const offset = (note.column + 1) % noteCountPerLine;
      const start =
        noteCountPerLine * Math.floor(note.column / noteCountPerLine);
      movePosition(note.line, start + offset);
      return false;
    } else if (event.code === 'Delete') {
      if (region) {
        dispatch(regionDeleted(region));
      } else {
        const region: Region = {
          startColumn: note.column,
          endColumn: note.column,
          startLine: note.line,
          endLine: note.column,
        };
        dispatch(regionDeleted(region));
      }
    } else if (event.ctrlKey && event.code === 'KeyC') {
      dispatch(regionCopied(notes));
    } else if (event.ctrlKey && event.code === 'KeyV') {
      if (copyBuffer) {
        dispatch(
          regionPasted({
            startColumn: note.column,
            startLine: note.line,
            copyBuffer,
          }),
        );
      }
    } else if (event.ctrlKey && event.code === 'KeyX') {
      if (region) {
        dispatch(regionCopied(notes));
        dispatch(regionDeleted(region));
      }
    } else if (event.ctrlKey && event.code === 'KeyZ') {
      if (event.shiftKey) {
        dispatch(ActionCreators.jump(1));
      } else {
        dispatch(ActionCreators.jump(-1));
      }
    } else if (event.ctrlKey && event.code === 'KeyA') {
      dispatch(highlightedRegionStartChanged(0, 0));
      dispatch(
        highlightedRegionEndChanged(
          lineCount,
          noteCountPerLine * numberOfStaffLines,
        ),
      );
      event.preventDefault();
    }

    if (event.key.match(/\d/)) {
      dispatch(
        noteAdded({
          text: event.key,
          line: note.line,
          column: note.column,
        }),
      );
      const offset = (note.column + 1) % noteCountPerLine;
      const start =
        noteCountPerLine * Math.floor(note.column / noteCountPerLine);

      dispatch(
        activeNoteChanged({
          text: '',
          line: note.line,
          column: start + offset,
        }),
      );
      dispatch(highlightedRegionCleared());
    }
  };

  // Position notes on separate staff lines
  let staffLines: Note[][] = [];
  for (let i = 0; i < numberOfStaffLines; i++) {
    staffLines.push([]);
  }

  for (let note of notes) {
    note = { ...note };

    const staffLine = Math.floor(note.column / noteCountPerLine);
    const staffPosition = note.column % noteCountPerLine;

    if (staffLine >= numberOfStaffLines) {
      continue;
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
    <div
      className="staffContainer"
      onKeyDown={keyDownHandler}
      tabIndex={0}
    >
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
  const note = useAppSelector((state) => state.editing.activeNote);
  const isMouseDown = useAppSelector(
    (state) => state.editing.isMouseDown,
  );
  const highlightedRegion = useAppSelector(
    (state) => state.editing.highlightedRegion,
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
function fallsWithinRegion(
  highlightedRegion: Region,
  i: number,
  arg2: number,
) {
  throw new Error('Function not implemented.');
}
