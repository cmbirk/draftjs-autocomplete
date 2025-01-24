import React from 'react';

interface SuggestionListProps {
  filteredSuggestions: string[];
  insertAutocompleteEntity: (suggestion: string) => void;
  setHighlightedIndex: (index: number) => void;
  highlightedIndex: number;
  suggestListPosition: {
    top: number;
    left: number;
  };
}

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
          <div
            key={suggestion}
            onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
              // onMouseDown to prevent editor blur
              e.preventDefault();
              insertAutocompleteEntity(suggestion);
            }}
            onMouseEnter={() => setHighlightedIndex(idx)}
            style={{
              padding: '5px 10px',
              backgroundColor: idx === highlightedIndex ? '#bde4ff' : 'transparent',
              cursor: 'pointer',
            }}
          >
            {suggestion}
          </div>
        ))
      ) : (
        <div style={{ padding: '5px 10px', fontStyle: 'italic', color: '#999' }}>
          No suggestions
        </div>
      )}
    </div>
  )
}

export default SuggestionList;
