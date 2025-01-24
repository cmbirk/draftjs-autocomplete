import React from 'react';
import SuggestionEntry from './SuggestionEntry';

interface SuggestionListProps {
  filteredSuggestions: string[]; // The list of filtered suggestions to render
  insertAutocompleteEntity: (suggestion: string) => void; // The function to insert the autocomplete entity
  setHighlightedIndex: (index: number) => void; // The function to set the highlighted index
  highlightedIndex: number; // The index of the highlighted suggestion
  suggestListPosition: { // values used to position the suggestion list
    top: number;
    left: number;
  };
}

/**
 * Renders the list of autocomplete suggestions.
 */
const SuggestionList: React.FC<SuggestionListProps> = ({
  filteredSuggestions,
  insertAutocompleteEntity,
  setHighlightedIndex,
  highlightedIndex,
  suggestListPosition,
}) => {
  return (
    <div
      className="autocomplete-container"
      style={{
        position: 'absolute',
        top: suggestListPosition.top,
        left: suggestListPosition.left,
        zIndex: 1000,
      }}
    >
      {filteredSuggestions.length > 0 ? (
        filteredSuggestions.map((suggestion, idx) => (
          <SuggestionEntry
            key={suggestion}
            suggestion={suggestion}
            idx={idx}
            highlightedIndex={highlightedIndex}
            insertAutocompleteEntity={insertAutocompleteEntity}
            setHighlightedIndex={setHighlightedIndex}
          />
        ))
      ) : (
        <div className="no-suggestions">
          No suggestions
        </div>
      )}
    </div>
  )
}

export default SuggestionList;
