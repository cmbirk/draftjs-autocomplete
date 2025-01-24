import React from 'react';
import { ContentState } from 'draft-js';
interface AutocompleteEntryProps {
  children: React.ReactNode;
  contentState: ContentState;
  entityKey: string;
}

/**
 * Renders the completed autocomplete entity in the editor.
 */
const AutocompleteEntry = (props: AutocompleteEntryProps) => {
  return (
    <span className="autocomplete-entry">
      {props.children}
    </span>
  )
}

export default AutocompleteEntry;
