import React, { useEffect, useRef, useState } from 'react';
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
  titleChanged,
  authorChanged,
} from './features/tab';
import { fallsWithinRegion, Region } from './lib/editing';
import { Note } from './lib/tab';
import { maxColumn, renderTab } from './lib/util';

const LETTER_WIDTH = 5; // TODO figure out how to compute from SVG text
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export function App() {
  const dispatch = useAppDispatch();
  const title = useAppSelector((state) => state.tab.present.title);
  const author = useAppSelector((state) => state.tab.present.author);
  const notes = useAppSelector((state) => state.tab.present.notes);
  const noteCountPerLine = useAppSelector(
    (state) => state.editing.notesPerLine,
  );
  const numberOfStaffLines = useAppSelector(
    (state) => state.editing.numberOfStaffLines,
  );

  const [noteCountPerLineString, setNoteCountPerLineString] =
    useState(noteCountPerLine.toString());
  const [noteCountTimeout, setNoteCountTimeout] = useState<
    number | undefined
  >();

  // Staff parameters
  const lineCount = 4,
    noteWidth = 9,
    padding = 20,
    margin = 10;

  useEffect(() => {
    const dataString = localStorage.getItem('tabData');
    if (dataString) {
      const data = JSON.parse(dataString);
      dispatch(authorChanged(data['author']));
      dispatch(titleChanged(data['title']));
      dispatch(notesChanged(data['notes']));

      const noteCountPerLine = data['noteCountPerLine'];
      let numberOfStaffLines = Math.ceil(
        maxColumn(notes) / noteCountPerLine,
      );
      if (numberOfStaffLines === 0) numberOfStaffLines = 1;

      dispatch(
        layoutChanged({
          numberOfStaffLines,
          notesPerLine: noteCountPerLine,
        }),
      );
    }
  }, []);

  const saveTab = () => {
    const data = {
      title: title,
      author: author,
      noteCountPerLine,
      notes: notes,
    };

    localStorage.setItem('tabData', JSON.stringify(data));
  };

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

  useEffect(() => {
    clearTimeout(noteCountTimeout);

    setNoteCountTimeout(
      window.setTimeout(() => {
        const notesPerLine = parseInt(noteCountPerLineString);
        if (isNaN(notesPerLine) || notesPerLine < 1) {
          return;
        }

        let numberOfStaffLines = Math.ceil(
          maxColumn(notes) / notesPerLine,
        );
        if (numberOfStaffLines === 0) {
          numberOfStaffLines = 1;
        }

        dispatch(
          layoutChanged({
            notesPerLine,
            numberOfStaffLines,
          }),
        );
      }, 500),
    );
  }, [noteCountPerLineString]);

  return (
    <div className="App">
      <EditableTitle />
      <EditableAuthor />
      <Staff
        padding={padding}
        margin={margin}
        lineCount={lineCount}
        noteWidth={noteWidth}
        noteCountPerLine={noteCountPerLine}
        numberOfStaffLines={numberOfStaffLines}
        notes={notes}
      />
      <div className="tabOptions">
        <div>
          <button onClick={saveTab}>Save</button>
          <button onClick={downloadTab}>Download Tab</button>
        </div>
        <label htmlFor="noteCountPerLineField">Notes per line:</label>
        <input
          id="noteCountPerLineField"
          type="text"
          onChange={(ev) => {
            setNoteCountPerLineString(ev.target.value);
          }}
          onBlur={(_ev) => {
            const n = parseInt(_ev.target.value);
            if (isNaN(n) || n < 1) {
              setNoteCountPerLineString(noteCountPerLine.toString());
            }
          }}
          value={noteCountPerLineString}
        />
      </div>
    </div>
  );
}

function EditableTitle() {
  // TODO figure out how to reuse code for title & author
  const dispatch = useAppDispatch();
  const title = useAppSelector((state) => state.tab.present.title);

  const [draftTitle, setDraftTitle] = useState('');
  const [editing, setEditing] = useState(false);
  const [shouldFocus, setShouldFocus] = useState(false);

  const editRef = useRef<HTMLInputElement>(null);

  const changeHandler = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setDraftTitle(event.target.value);
  };

  const clickReadonlyHandler = (_event: React.MouseEvent) => {
    setDraftTitle(title);
    setEditing(true);
    setShouldFocus(true);
  };

  const blurHandler = (_event: React.FocusEvent) => {
    if (draftTitle.length > 0) {
      dispatch(titleChanged(draftTitle));
    }

    setEditing(false);
  };

  const enterKeyHandler = (event: React.KeyboardEvent) => {
    if (event.code === 'Enter') {
      if (draftTitle.length > 0) {
        dispatch(titleChanged(draftTitle));
      }

      setEditing(false);
    }
  };

  useEffect(() => {
    if (shouldFocus && editing && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
      setShouldFocus(false);
    }
  }, [shouldFocus, editing]);

  return editing ? (
    <input
      type="text"
      value={draftTitle}
      onChange={changeHandler}
      ref={editRef}
      onBlur={blurHandler}
      onKeyPress={enterKeyHandler}
    />
  ) : (
    <h1 hidden={editing} onClick={clickReadonlyHandler}>
      {title}
    </h1>
  );
}

function EditableAuthor() {
  const dispatch = useAppDispatch();
  const author = useAppSelector((state) => state.tab.present.author);

  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [shouldFocus, setShouldFocus] = useState(false);

  const editRef = useRef<HTMLInputElement>(null);

  const changeHandler = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setDraft(event.target.value);
  };

  const clickReadonlyHandler = (_event: React.MouseEvent) => {
    setDraft(author);
    setEditing(true);
    setShouldFocus(true);
  };

  const blurHandler = (_event: React.FocusEvent) => {
    if (draft.length > 0) {
      dispatch(authorChanged(draft));
    }

    setEditing(false);
  };

  const enterKeyHandler = (event: React.KeyboardEvent) => {
    if (event.code === 'Enter') {
      if (draft.length > 0) {
        dispatch(authorChanged(draft));
      }

      setEditing(false);
    }
  };

  useEffect(() => {
    if (shouldFocus && editing && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
      setShouldFocus(false);
    }
  }, [shouldFocus, editing]);

  return editing ? (
    <input
      type="text"
      value={draft}
      onChange={changeHandler}
      ref={editRef}
      onBlur={blurHandler}
      onKeyPress={enterKeyHandler}
    />
  ) : (
    <h2 hidden={editing} onClick={clickReadonlyHandler}>
      {author}
    </h2>
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
      // Disallow navigating the page with arrows
      event.preventDefault();
    }

    if (event.ctrlKey && event.code === 'KeyC') {
      // Ctrl+C: copy the selected region into the buffer
      dispatch(regionCopied(notes));
    } else if (event.ctrlKey && event.code === 'KeyV') {
      // Ctrl+V: paste the selected region, starting at the selected position
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
      // Ctrl+X: copy the selected region, then delete it
      if (region) {
        dispatch(regionCopied(notes));
        dispatch(regionDeleted(region));
      }
    } else if (event.ctrlKey && event.code === 'KeyZ') {
      // Ctrl+Z: undo last modification to the tab
      if (event.shiftKey) {
        dispatch(ActionCreators.jump(1));
      } else {
        dispatch(ActionCreators.jump(-1));
      }
    } else if (event.ctrlKey && event.code === 'KeyA') {
      // Ctrl+Shift+Z
      dispatch(highlightedRegionStartChanged(0, 0));
      dispatch(
        highlightedRegionEndChanged(
          lineCount,
          noteCountPerLine * numberOfStaffLines,
        ),
      );
      event.preventDefault();
    } else if (event.code === 'ArrowUp' || event.code === 'KeyW') {
      // Move the position one line up, or to the previous staff line when at
      // the first line of the current one. Wrap around to the last line of the
      // last staff line if already at the first
      if (note.line === 0) {
        movePosition(
          lineCount - 1,
          (note.column - noteCountPerLine + totalColumns) %
            totalColumns,
        );

        // remove last staff line if it's empty
        const lastStaffLineFirstColumn =
          noteCountPerLine * (numberOfStaffLines - 1);
        if (
          numberOfStaffLines > 1 &&
          (notes.length === 0 ||
            notes[notes.length - 1].column < lastStaffLineFirstColumn)
        ) {
          dispatch(
            layoutChanged({
              notesPerLine: noteCountPerLine,
              numberOfStaffLines: numberOfStaffLines - 1,
            }),
          );
        }
      } else {
        movePosition(
          (note.line - 1 + lineCount) % lineCount,
          note.column,
        );
      }
    } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      // Move the position one line down, or to the next staff line when at the
      // last line of the current one. Add a new staff line if no more exist
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
    } else if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      // Move the position one to the left, wrapping around to end line
      const offset =
        (note.column - 1 + noteCountPerLine) % noteCountPerLine;
      const start =
        noteCountPerLine * Math.floor(note.column / noteCountPerLine);
      movePosition(note.line, start + offset);
    } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      // Move the position one to the right, wrapping around to start of line
      const offset = (note.column + 1) % noteCountPerLine;
      const start =
        noteCountPerLine * Math.floor(note.column / noteCountPerLine);
      movePosition(note.line, start + offset);
    } else if (event.code === 'Delete') {
      // Delete: delete the highlighted region or selected position
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
    } else if (
      event.key.length === 1 &&
      (event.key.match(/^\d$/) ||
        event.key === 'x' ||
        event.key === 'h' ||
        event.key === '\\' ||
        event.key === '/')
    ) {
      console.log(event.key);
      // Digits get inserted at the current position
      dispatch(
        noteAdded({
          text: event.key,
          line: note.line,
          column: note.column,
        }),
      );

      // Move to the next column if not at the end of the line
      if (note.column % noteCountPerLine < noteCountPerLine - 1) {
        const offset = (note.column + 1) % noteCountPerLine;
        const start =
          noteCountPerLine *
          Math.floor(note.column / noteCountPerLine);

        dispatch(
          activeNoteChanged({
            text: '',
            line: note.line,
            column: start + offset,
          }),
        );
        dispatch(highlightedRegionCleared());
      }
    }
  };

  // Position notes on separate staff lines
  let staffLines: Note[][] = [];
  for (let i = 0; i < numberOfStaffLines; i++) {
    staffLines.push([]);
  }

  // Add notes to the proper staff lines
  for (let note of notes) {
    note = { ...note };

    const staffLine = Math.floor(note.column / noteCountPerLine);
    const staffPosition = note.column % noteCountPerLine;

    // Skip notes that are out of bounds
    if (
      staffLine >= numberOfStaffLines ||
      note.line < 0 ||
      note.line >= lineCount
    ) {
      continue;
    }

    // Put note on right column for this line
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
    const y = note.line * padding + margin + LETTER_WIDTH;

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
            y={y + LETTER_WIDTH}
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

      const mouseDownHandler = (_event: React.MouseEvent) => {
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

      const mouseUpHandler = (_event: React.MouseEvent) => {
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
