import React from "react";
import type { AutocompleteEntryProps } from "@/types";

// Rendering autocomplete entity
const AutocompleteEntry = (props: AutocompleteEntryProps) => {
  return (
    <span style={{ color: "gray", padding: '0 4px' }}>
      {props.children}
    </span>
  )
}

export default AutocompleteEntry;
