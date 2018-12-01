// @flow strict

import React from 'react';
import type { Node } from 'react';
import { connect } from 'react-redux';
import { Icon } from 'semantic-ui-react';
import styles from './BacklogTask.css';
import {
  markSubtask as markSubtaskAction,
  removeSubTask as removeSubTaskAction,
  toggleSubTaskPin as toggleSubTaskPinAction,
} from '../../store/actions';
import type { SubTask } from '../../store/store-types';
import type {
  MarkSubTaskAction, RemoveSubTaskAction, ToggleSubTaskPinAction,
} from '../../store/action-types';
import CheckBox from '../UI/CheckBox';

type Props = {|
  ...SubTask;
  +mainTaskId: number;
  +markSubtask: (taskId: number, subTaskId: number) => MarkSubTaskAction;
  +toggleSubTaskPin: (taskId: number, subTaskId: number) => ToggleSubTaskPinAction;
  +removeSubTask: (taskId: number, subTaskId: number) => RemoveSubTaskAction;
|};

const actionCreators = {
  markSubtask: markSubtaskAction,
  toggleSubTaskPin: toggleSubTaskPinAction,
  removeSubTask: removeSubTaskAction,
};

/**
 * The component used to render one subtask in backlog day.
 *
 * @param props the props to render.
 * @return {Node} the rendered element.
 * @constructor
 */
function BacklogSubTask(props: Props): Node {
  const {
    name, id, mainTaskId, complete, inFocus,
    markSubtask, toggleSubTaskPin, removeSubTask,
  } = props;
  return (
    <div className={styles.BacklogSubTask}>
      <CheckBox
        className={styles.BacklogTaskCheckBox}
        checked={complete}
        inverted
        onChange={() => markSubtask(mainTaskId, id)}
      />
      <span
        className={styles.BacklogTaskText}
        style={complete ? { textDecoration: 'line-through' } : {}}
      >
        {name}
      </span>
      <Icon
        name={inFocus ? 'bookmark' : 'bookmark outline'}
        className={styles.BacklogTaskIcon}
        onClick={() => toggleSubTaskPin(mainTaskId, id)}
      />
      <Icon
        name="delete"
        className={styles.BacklogTaskIcon}
        onClick={() => removeSubTask(mainTaskId, id)}
      />
    </div>
  );
}

const ConnectedBacklogSubTask = connect(null, actionCreators)(BacklogSubTask);
export default ConnectedBacklogSubTask;
