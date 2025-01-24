import React from 'react';
import { ContentState } from "draft-js";

// Injected by Draft.js
export type AutocompleteEntryProps = {
  children: React.ReactNode;
  contentState: ContentState;
  entityKey: string;
}
