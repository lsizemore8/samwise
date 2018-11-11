// @flow strict

import * as React from 'react';
import type { Node } from 'react';
import styles from './BacklogHeaderButtons.css';

type Props = {| +text: string; +onClick: () => void |};

/**
 * The class name used for the component.
 * @type {string}
 */
const className = `${styles.BacklogViewSwitcherButton} ${styles.BacklogViewSwitcherTextButton}`;

/**
 * The component used to render a text toggle in the header section of backlog.
 *
 * @param {string} text text inside the button.
 * @param {function} onClick the function when clicked.
 * @return {Node} the rendered component.
 * @constructor
 */
export default function BacklogCompletedTasksToggle({ text, onClick }: Props): Node {
  return (
    <div className={className} role="button" tabIndex={-1} onClick={onClick} onKeyDown={onClick}>
      <span className={styles.BacklogViewSwitcherButtonText}>{text}</span>
    </div>
  );
}