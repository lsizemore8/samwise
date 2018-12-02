// @flow strict

/**
 * This type species where the editor flows.
 * - 'center': at the center of the page.
 * - 'below': below the element.
 * - 'left': to the left the element.
 * - 'right': to the right the element.
 * - null: defaults to 'center'.
 */
export type FloatingPosition = 'left' | 'right';

/**
 * A simple main task to edit.
 */
export type SimpleMainTask = {|
  +id: number;
  +name: string;
  +tag: number;
  +date: Date;
  +complete: boolean;
  +inFocus: boolean;
|};