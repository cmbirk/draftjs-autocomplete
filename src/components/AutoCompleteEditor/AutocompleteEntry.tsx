import React from "react";
import { ContentState } from "draft-js";
interface AutocompleteEntryProps {
  children: React.ReactNode;
  contentState: ContentState;
  entityKey: string;
}

// Rendering autocomplete entity
const AutocompleteEntry = (props: AutocompleteEntryProps) => {
  return (
    <span style={{ color: "gray", padding: '0 4px' }}>
      {props.children}
    </span>
  )
}

export default AutocompleteEntry;
