import React, { useEffect, useRef, useState } from "react";
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
} from "draft-js";

import AutocompleteEntry from "./AutocompleteEntry";
import SuggestionList from "./SuggestionList";

const SUGGESTIONS = [
  'application',
  'react',
  'render',
  'suggestion',
  'tougher',
  'tournament',
  'react application',
  'this is a react component',
  'react component',
  'react-component',
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

const AutocompleteEditor: React.FC = () => {
  const [editorState, setEditorState] = useState<EditorState>(
    EditorState.createEmpty(decorator),
  );

  const [isAutocompleteActive, setIsAutocompleteActive] = useState(false);
  const [matchString, setMatchString] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [filteredSuggestions, setFilteredSuggestions] = useState(SUGGESTIONS);

  const editorRef = useRef<Editor>(null);

  useEffect(() => {
    console.log('isAutocompleteActive', isAutocompleteActive);
  }, [isAutocompleteActive])

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

  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }

  const checkForTrigger = (chars: string, editorStateParam: EditorState) => {
    console.log('checkForTrigger', chars);
    const selection = editorState.getSelection();
    const content = editorState.getCurrentContent();
    const blockKey = selection.getStartKey();
    const block = content.getBlockForKey(blockKey);
    const text = block.getText();
    const cursorPos = selection.getStartOffset();


    console.log('text', text);
    console.log('cursorPos', cursorPos);
    console.log(text.charAt(cursorPos - 1));
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
    checkForTrigger(chars, editorStateParam);
    return 'not-handled';
  }

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

  return (
    <div
      onClick={focusEditor}
      className="autocomplete-editor-container"
    >
      {/* @ts-expect-error - Known issue with Draft.js types */}
      <Editor
        ref={editorRef}
        editorState={editorState}
        onChange={onChange}
        placeholder="There's no write's block here. Use <> to trigger autocomplete."
        handleBeforeInput={(chars, state) => {
          if (chars === '\b') {
            return handleBeforeInputBackspace();
          }

          return handleBeforeInput(chars, state);
        }}
        keyBindingFn={keyBindingFn}
        handleKeyCommand={handleKeyCommand}
      />
      {isAutocompleteActive && (
        <SuggestionList
          filteredSuggestions={filteredSuggestions}
          insertAutocompleteEntity={insertAutocompleteEntity}
          setHighlightedIndex={setHighlightedIndex}
          highlightedIndex={highlightedIndex}
        />
      )}
    </div>
  )
}

export default AutocompleteEditor;
