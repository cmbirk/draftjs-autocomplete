import React from 'react';

interface SuggestionEntryProps {
  suggestion: string; // The suggestion to render
  idx: number; // The index of the suggestion
  highlightedIndex: number; // The index of the highlighted suggestion
  insertAutocompleteEntity: (suggestion: string) => void; // The function to insert the autocomplete entity
  setHighlightedIndex: (index: number) => void; // The function to set the highlighted index
}

/**
 * Renders a suggestion entry in the SuggestionList component
 */
const SuggestionEntry: React.FC<SuggestionEntryProps> = ({
  suggestion,
  idx,
  highlightedIndex,
  insertAutocompleteEntity,
  setHighlightedIndex,
}) => {
  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        insertAutocompleteEntity(suggestion);
      }}
      onMouseEnter={() => setHighlightedIndex(idx)}
      className={`suggestion-entry ${idx === highlightedIndex ? 'highlighted' : ''}`}
    >
      {suggestion}
    </div>
  );
};

export default SuggestionEntry;
