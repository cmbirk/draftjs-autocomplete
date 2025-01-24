import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Editor,
  EditorState,
  ContentState,
  ContentBlock,
  CharacterMetadata,
  CompositeDecorator,
  DraftHandleValue,
  Modifier,
  RichUtils,
  SelectionState,
  getDefaultKeyBinding,
  getVisibleSelectionRect,
} from "draft-js";

import AutocompleteEntry from './AutocompleteEntry';
import SuggestionList from './SuggestionList';

// Hardcoded suggestion list for autocomplete
const SUGGESTIONS = [
  'Ideaflow is a super-fast, searchable stack of your thoughts',
  'Hashtags (#)',
  'Relations (+)',
  'Create a new note with Cmd + K',
  'Add hashtags with # to group related notes',
  'Use + to add relations between notes',
  'Voice Notes in Ideaflow',
  'Importing your Notes',
  'Mobile Quickstart',
  'How to format text',
  'How to insert images',
  'Power-user Workflows',
  'Blog-writing Workflow',
  'Conversation Notes Workflow and Examples',
  'Using #@ Mention',
  'When to Use Hashtags vs References',
  'Zones - a more Implicit trick',
  'Using Ideaflow as a Microblog',
  'Some More Tips',
  'Ideaflow supports importing notes'
];


// Find AUTOCOMPLETE entities in a given content block and
// trigger decorator callback to highlight them
const findAutocompleteEntities = (
  contentBlock: ContentBlock,
  callback: (start: number, end: number) => void,
  contentState: ContentState,
) => {
  contentBlock.findEntityRanges(
    (character: CharacterMetadata) => {
      const entityKey = character.getEntity();
      if (entityKey === null) return false;

      const entity = contentState.getEntity(entityKey);
      return entity.getType() === 'AUTOCOMPLETE';
    }, callback);
}

// Decorator to render autocomplete entities
const decorator = new CompositeDecorator([
  {
    strategy: findAutocompleteEntities,
    component: AutocompleteEntry,
  },
])

/**
 * The main component for the autocomplete editor.
 */
const AutocompleteEditor: React.FC = () => {

  // Editor state
  const [editorState, setEditorState] = useState<EditorState>(
    EditorState.createEmpty(decorator),
  );

  // Autocomplete state
  const [isAutocompleteActive, setIsAutocompleteActive] = useState(false);
  const [matchString, setMatchString] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [filteredSuggestions, setFilteredSuggestions] = useState(SUGGESTIONS);
  const [suggestListPosition, setSuggestListPosition] = useState({
    top: 0,
    left: 0,
  });

  // Editor reference
  const editorRef = useRef<Editor>(null);

  // Calculate the position of the suggestion list rendered as a portal
  const calculateSuggestListPosition = (editorState: EditorState) => {
    const selectionRect = getVisibleSelectionRect(document);
    if (!selectionRect) {
      return { top: 0, left: 0 };
    }

    return {
      top: selectionRect.bottom,
      left: selectionRect.left,
    };
  };

  // useEffect call to calculate the position of the suggestion list
  // While this hook has the editorState as a dependency,
  // it shouldn't be a performance issue as the hook immediately returns
  // if the autocomplete is not active.
  useEffect(() => {
    if (!isAutocompleteActive) return;


    const position = calculateSuggestListPosition(editorState);
    setSuggestListPosition(position)

    const handleReposition = () => {
      const newPosition = calculateSuggestListPosition(editorState);
      setSuggestListPosition(newPosition);
    }

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition);
    }
  }, [isAutocompleteActive, editorState])

  // useEffect call to filter the suggestions based on the matchString
  useEffect(() => {
    if (matchString.length > 0) {
      const filtered = SUGGESTIONS.filter((suggestion) =>
        suggestion.toLowerCase().startsWith(matchString.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions(SUGGESTIONS);
    }

    setHighlightedIndex(0);
  }, [matchString]);

  // Focus the editor
  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }

  // Handle the autocomplete text trigger of "<>"
  const handleAutocompleteTrigger = (chars: string, editorStateParam: EditorState) => {

    // Get the editor state, current selection, and the block text
    const selection = editorState.getSelection();
    const content = editorState.getCurrentContent();
    const blockKey = selection.getStartKey();
    const block = content.getBlockForKey(blockKey);
    const text = block.getText();
    const cursorPos = selection.getStartOffset();

    // Check if the last character entered would complete '<>'
    if (chars === '>' && cursorPos > 0 && text.charAt(cursorPos - 1) === '<') {
      setIsAutocompleteActive(true);
      setMatchString('');

      return 'handled';
    }

    return 'not-handled';
  }

  const handleBeforeInput = (
    chars: string,
    editorStateParam: EditorState,
  ): DraftHandleValue => {
    handleAutocompleteTrigger(chars, editorStateParam);
    return 'not-handled';
  }

  // Remove entire entity if backspace pressed
  const handleBeforeInputBackspace = (): DraftHandleValue => {
    const selection = editorState.getSelection();

    if (!selection.isCollapsed()) return 'not-handled';

    const offset = selection.getStartOffset();
    const blockKey = selection.getStartKey();
    const content = editorState.getCurrentContent();
    const block = content.getBlockForKey(blockKey);

    if (offset > 0) {
      const charBefore = block.getCharacterList().get(offset - 1);
      if (!charBefore) return 'not-handled';

      const entityKey = charBefore.getEntity();
      if (entityKey) {
        const entity = content.getEntity(entityKey);
        if (entity.getType() === 'AUTOCOMPLETE') {
          const entitySelection = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: offset - 1,
            focusOffset: offset,
          });

          const newContentState = Modifier.removeRange(
            content,
            entitySelection,
            'backward'
          );

          const newEditorState = EditorState.push(
            editorState,
            newContentState,
            'remove-range'
          );

          setEditorState(
            EditorState.forceSelection(
              newEditorState,
              newContentState.getSelectionAfter(),
            )
          );

          return 'handled';
        }
      }
    }

    return 'not-handled';
  }

  // Handle backspace and other input separately
  const handleEditorBeforeInput = (
    chars: string,
    editorStateParam: EditorState,
  ): DraftHandleValue => {
    if (chars === '\b') {
      return handleBeforeInputBackspace();
    }

    return handleBeforeInput(chars, editorStateParam);
  };

  // onChange handler for the editor to check for autocomplete
  const onChange = (newState: EditorState) => {
    if (isAutocompleteActive) {
      const selection = newState.getSelection();
      const content = newState.getCurrentContent();
      const blockKey = selection.getStartKey();
      const blockText = content.getBlockForKey(blockKey).getText();

      const lastTriggerIndex = blockText.lastIndexOf('<>');
      if (lastTriggerIndex !== -1) {
        const cursorPos = selection.getStartOffset();
        const substring = blockText.slice(lastTriggerIndex + 2, cursorPos);

        if (substring.includes('\n')) {
          setIsAutocompleteActive(false);
          setMatchString('');
        } else {
          setMatchString(substring);
        }
      } else {
        setIsAutocompleteActive(false);
        setMatchString('');
      }
    }

    setEditorState(newState);
  }

  // Insert the autocomplete entity as a new entity in the editor
  const insertAutocompleteEntity = (text: string) => {
    let contentState = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const blockKey = selection.getStartKey();
    const blockText = contentState.getBlockForKey(blockKey).getText();

    const lastTriggerIndex = blockText.lastIndexOf('<>');
    if (lastTriggerIndex === -1) return;

    const start = lastTriggerIndex;
    const end = selection.getStartOffset();
    const entityRange = SelectionState.createEmpty(blockKey).merge({
      anchorOffset: start,
      focusOffset: end,
    });

    contentState = Modifier.removeRange(contentState, entityRange, 'backward');
    contentState = contentState.createEntity('AUTOCOMPLETE', 'IMMUTABLE', {
      text: text,
    });

    const entityKey = contentState.getLastCreatedEntityKey();
    const newContentState = Modifier.insertText(
      contentState,
      contentState.getSelectionAfter(),
      text,
      undefined,
      entityKey,
    );

    let newEditorState = EditorState.push(
      editorState,
      newContentState,
      'insert-characters',
    );

    newEditorState = EditorState.forceSelection(
      newEditorState,
      newContentState.getSelectionAfter(),
    )

    setEditorState(newEditorState);

    setIsAutocompleteActive(false);
    setMatchString('');
  }

  // Key binding function to handle autocomplete key commands
  const keyBindingFn = (e: React.KeyboardEvent): string | null => {
    if (isAutocompleteActive) {
      if (e.key === 'ArrowDown') return 'autocomplete-down';
      if (e.key === 'ArrowUp') return 'autocomplete-up';
      if (e.key === 'Enter') return 'autocomplete-enter';
      if (e.key === 'Tab') return 'autocomplete-enter';
      if (e.key === 'Escape') return 'autocomplete-escape';
    }

    return getDefaultKeyBinding(e);
  }

  // Handle key commands for autocomplete
  const handleKeyCommand = (
    command: string,
    editorStateParam: EditorState
  ): DraftHandleValue => {
    if (isAutocompleteActive) {
      if (command === 'autocomplete-down') {
        setHighlightedIndex((prev) =>
          prev === filteredSuggestions.length - 1 ? 0 : prev + 1
        );
        return 'handled';
      }

      if (command === 'autocomplete-up') {
        setHighlightedIndex((prev) =>
          prev === 0 ? filteredSuggestions.length - 1 : prev - 1
        );
        return 'handled';
      }

      if (command === 'autocomplete-enter') {
        if (filteredSuggestions.length > 0) {
          insertAutocompleteEntity(filteredSuggestions[highlightedIndex]);
        } else {
          insertAutocompleteEntity(matchString);
        }

        return 'handled';
      }

      if (command === 'autocomplete-escape') {
        setIsAutocompleteActive(false);
        setMatchString('');
        return 'handled';
      }

      const newState = RichUtils.handleKeyCommand(editorStateParam, command);

      if (newState) {
        setEditorState(newState);
        return 'handled';
      }
    }

    return 'not-handled';
  }

  // Render the editor and the suggestion list as a portal
  return (
    <div
      onClick={focusEditor}
      className="autocomplete-editor-container"
    >
      {/* @ts-expect-error - Issue with Draft.js types */}
      <Editor
        ref={editorRef}
        editorState={editorState}
        onChange={onChange}
        placeholder="Writer's block? Use <> to trigger autocomplete."
        handleBeforeInput={handleEditorBeforeInput}
        keyBindingFn={keyBindingFn}
        handleKeyCommand={handleKeyCommand}
      />
      {isAutocompleteActive && createPortal(
        <SuggestionList
          filteredSuggestions={filteredSuggestions}
          insertAutocompleteEntity={insertAutocompleteEntity}
          setHighlightedIndex={setHighlightedIndex}
          highlightedIndex={highlightedIndex}
          suggestListPosition={suggestListPosition}
        />, document.getElementById('portal-root') || document.body
      )}
    </div>
  )
}

export default AutocompleteEditor;
