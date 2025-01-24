import React from 'react';
import { ContentState } from "draft-js";

// Injected by Draft.js
export interface AutocompleteEntryProps {
  children: React.ReactNode;
  contentState: ContentState;
  entityKey: string;
}
