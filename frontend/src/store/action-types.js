// @flow strict

import type { ActionCreators as ReduxActionCreators, Dispatch as ReduxDispatch } from 'redux';
import type { SubTask, Task } from './store-types';

export type TagColorConfigEditAction = { type: 'EDIT_COLOR_CONFIG'; tag: string; color: string; };
export type TagColorConfigRemoveAction = { type: 'REMOVE_COLOR_CONFIG'; tag: string; };

export type TagColorConfigAction = TagColorConfigEditAction | TagColorConfigRemoveAction;

export type AddNewTaskAction = { type: 'ADD_NEW_TASK'; data: Task; };
export type AddNewSubTaskAction = { type: 'ADD_SUBTASK'; id: number; data: SubTask; }
export type EditTaskAction = { type: 'EDIT_TASK'; task: Task; };

export type MarkTaskAction = { type: 'MARK_TASK'; id: number; };
export type MarkSubTaskAction = { type: 'MARK_SUBTASK'; id: number; subtask: number };

export type ToggleTaskPinAction = { type: 'TOGGLE_TASK_PIN'; taskId: number; };
export type ToggleSubTaskPinAction = {
  type: 'TOGGLE_SUBTASK_PIN'; taskId: number; subtaskId: number;
};

export type RemoveTaskAction = { type: 'REMOVE_TASK'; taskId: number; };
export type RemoveSubTaskAction = { type: 'REMOVE_SUBTASK'; taskId: number; subtaskId: number; };

export type UndoAction = { type: 'UNDO_ACTION' };

type TaskAction =
  | AddNewTaskAction
  | AddNewSubTaskAction
  | EditTaskAction
  | MarkTaskAction
  | MarkSubTaskAction
  | ToggleTaskPinAction
  | ToggleSubTaskPinAction
  | RemoveTaskAction
  | RemoveSubTaskAction;

export type Action = TagColorConfigAction | TaskAction | UndoAction;

export type ActionProps = { [actionName: string]: (...args: Array<any>) => Action };
export type Dispatch = ReduxDispatch<Action>;
export type ActionCreators = ReduxActionCreators<string, Action>;
export type MapDispatchToProps<OP> = (d: Dispatch, op: OP) => { ...OP, ...ActionProps };
