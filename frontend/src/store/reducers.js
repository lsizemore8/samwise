// @flow strict

import type { Action, EditTaskAction, RemoveTaskAction } from './action-types';
import type {
  State, SubTask, Tag, Task,
} from './store-types';
import { emitUndoRemoveTaskToast } from '../util/toast-util';
import {
  httpAddTask,
  httpDeleteTag,
  httpDeleteTask,
  httpEditTag,
  httpEditTask,
  httpNewTag,
  httpPinTask,
} from '../http/http-service';
import { dispatchAction } from './store';
import {
  backendPatchExistingTask as backendPatchExistingTaskAction,
  backendPatchNewTag,
  backendPatchNewTask as backendPatchNewTaskAction,
} from './actions';
import type { AppUser } from '../util/firebase-util';

const defaultNoneTag: Tag = {
  id: -1, type: 'other', name: 'None', color: 'gray',
};

/**
 * Returns the initial state given an app user.
 *
 * @param {AppUser} appUser the user of the app.
 * @return {State} the initial state of the application.
 */
const initialState = (appUser: AppUser): State => ({
  appUser,
  mainTaskArray: [],
  tags: [
    defaultNoneTag,
    {
      id: 0, type: 'other', name: 'Personal', color: '#9D4AA9',
    },
    {
      id: 1, type: 'other', name: 'Project Team', color: '#FF8A8A',
    },
    {
      id: 2, type: 'class', name: 'CS1110', color: 'red',
    },
  ],
  bearStatus: 'neutral',
  undoCache: { lastDeletedTask: null },
});

// function to update the bear's status
// eslint-disable-next-line no-unused-vars
function recalculateBearStatus(focusTaskArray) {
  if (focusTaskArray.isComplete) {
    return 'happy';
  }
  if (focusTaskArray.justFinishedTask) {
    return 'has fish';
  }
  if (focusTaskArray.howComplete < 0.1) {
    return 'hungry';
  }
  if (focusTaskArray.hasOverDueTask === 1) {
    return 'hibernating';
  }
  if (focusTaskArray.isAllOverDue || focusTaskArray.hasOverDueTask >= 1) {
    return 'leaving';
  }
  return 'neutral';
}

/**
 * Change the completion status of a main task.
 *
 * @param {Task[]} mainTaskArray the main task array to modify.
 * @param {number} taskID id of the task to change completion status.
 * @return {Task[]} the new task array with task's completion status inverted.
 */
function markTask(mainTaskArray: Task[], taskID: number): Task[] {
  return mainTaskArray.map((task: Task) => {
    if (task.id !== taskID) {
      return task;
    }
    const newTask = {
      ...task,
      complete: !task.complete,
      subtaskArray: task.subtaskArray.map(subTask => ({
        ...subTask, complete: !task.complete,
      })),
    };
    httpEditTask(task, newTask).then(t => dispatchAction(backendPatchExistingTaskAction(t)));
    return newTask;
  });
}

/**
 * Change the completion status of a subtask.
 *
 * @param mainTaskArray the main task array to modify.
 * @param taskID id of the parent task of the subtask.
 * @param subtaskID the id of the subtask.
 * @return {Task[]} the new task array with subtask's completion status inverted.
 */
function markSubtask(mainTaskArray: Task[], taskID: number, subtaskID: number): Task[] {
  return mainTaskArray.map((task: Task) => {
    if (task.id !== taskID) {
      return task;
    }
    const subtaskArray = task.subtaskArray.map((subTask: SubTask) => {
      if (subTask.id !== subtaskID) {
        return subTask;
      }
      httpPinTask(subTask.id, !subTask.complete).then(() => {});
      return { ...subTask, complete: !subTask.complete };
    });
    return { ...task, subtaskArray };
  });
}

/**
 * Change the in-focus status of a main task.
 *
 * @param {Task[]} mainTaskArray the main task array to modify.
 * @param {number} taskID id of the task to change completion status.
 * @return {Task[]} the new task array with task's in-focus status inverted.
 */
function toggleTaskPin(mainTaskArray: Task[], taskID: number): Task[] {
  return mainTaskArray.map((task: Task) => {
    if (task.id !== taskID) {
      return task;
    }
    const newTask = {
      ...task,
      inFocus: !task.inFocus,
      subtaskArray: task.subtaskArray.map(subTask => ({
        ...subTask, inFocus: false,
      })),
    };
    httpEditTask(task, newTask).then(t => dispatchAction(backendPatchExistingTaskAction(t)));
    return newTask;
  });
}

/**
 * Change the in-focus status of a subtask.
 *
 * @param mainTaskArray the main task array to modify.
 * @param taskID id of the parent task of the subtask.
 * @param subtaskID the id of the subtask.
 * @return {Task[]} the new task array with subtask's in-focus inverted.
 */
function toggleSubtaskPin(mainTaskArray: Task[], taskID: number, subtaskID: number): Task[] {
  return mainTaskArray.map((task: Task) => {
    if (task.id !== taskID) {
      return task;
    }
    const subtaskArray = task.subtaskArray.map((subTask: SubTask) => {
      if (subTask.id !== subtaskID) {
        return subTask;
      }
      httpPinTask(subTask.id, !subTask.inFocus).then(() => {});
      return { ...subTask, inFocus: !subTask.inFocus };
    });
    return { ...task, subtaskArray };
  });
}

/**
 * Add a new task.
 *
 * @param {State} prevState the previous state.
 * @param {Task} newTask the new task.
 * @return {State} the new state.
 */
function addTask(prevState: State, newTask: Task): State {
  httpAddTask(newTask).then(t => dispatchAction(backendPatchNewTaskAction(newTask.id, t)));
  return {
    ...prevState,
    mainTaskArray: [...prevState.mainTaskArray, newTask],
  };
}

/**
 * The reducer for remove a main task.
 *
 * @param {State} prevState the previous state.
 * @param {RemoveTaskAction} action the action of removing task.
 * @return {[Task[], Task | null]} the new task array with the specified task remove.
 */
function removeTaskReducer(prevState: State, action: RemoveTaskAction): State {
  let lastDeletedTask: Task | null = null;
  const { taskId, undoable } = action;
  httpDeleteTask(taskId).then(() => {});
  const mainTaskArray = prevState.mainTaskArray.filter((task: Task) => {
    if (task.id !== taskId) {
      return true;
    }
    lastDeletedTask = task;
    return false;
  });
  if (undoable) {
    const undoCache = { ...prevState.undoCache, lastDeletedTask };
    if (lastDeletedTask != null) {
      emitUndoRemoveTaskToast(lastDeletedTask);
    }
    return { ...prevState, mainTaskArray, undoCache };
  }
  const undoCache = { ...prevState.undoCache, lastDeletedTask: null };
  return { ...prevState, mainTaskArray, undoCache };
}

/**
 * Remove a subtask.
 *
 * @param mainTaskArray the main task array to modify.
 * @param taskID id of the parent task of the subtask.
 * @param subtaskID the id of the subtask.
 * @return {Task[]} the new task array with the specified subtask removed.
 */
function removeSubtask(mainTaskArray: Task[], taskID: number, subtaskID: number): Task[] {
  return mainTaskArray.map((task: Task) => {
    if (task.id !== taskID) {
      return task;
    }
    const subtaskArray = [];
    task.subtaskArray.forEach((subTask: SubTask) => {
      if (subTask.id === subtaskID) {
        httpDeleteTask(subtaskID).then(() => {});
      } else {
        subtaskArray.push(subTask);
      }
    });
    return { ...task, subtaskArray };
  });
}

/**
 * Reducer from an old state with old task to a new state with one task edited.
 *
 * @param {State} state the old state.
 * @param {EditTaskAction} action the reduce action to edit a task.
 * @return {State} the new state.
 */
function editTask(state: State, action: EditTaskAction) {
  const t = action.task;
  const newTask = {
    ...t,
    subtaskArray: t.subtaskArray.map((subTask: SubTask) => ({
      ...subTask,
      complete: t.complete || subTask.complete,
      inFocus: !t.inFocus && subTask.inFocus,
    })),
  };
  const mainTaskArray = state.mainTaskArray.map<Task>((task: Task) => {
    if (task.id !== newTask.id) {
      return task;
    }
    httpEditTask(task, newTask).then(st => dispatchAction(backendPatchExistingTaskAction(st)));
    return newTask;
  });
  return { ...state, mainTaskArray };
}

/**
 * Undo the operation of delete task.
 *
 * @param {State} state the old state.
 * @return {State} the new state after the undo.
 */
function undoDeleteTask(state: State): State {
  const { mainTaskArray, undoCache } = state;
  const { lastDeletedTask } = undoCache;
  if (lastDeletedTask === null) {
    return state;
  }
  httpAddTask(lastDeletedTask).then(
    task => dispatchAction(backendPatchNewTaskAction(lastDeletedTask.id, task)),
  );
  return {
    ...state,
    mainTaskArray: [...mainTaskArray, lastDeletedTask],
    undoCache: { ...undoCache, lastDeletedTask: null },
  };
}

/**
 * Let the backend patch a a new task.
 *
 * @param {State} state the old state.
 * @param {number} tempNewTaskId the temp new task id.
 * @param {Task} task the new task to patch.
 * @return {State} the new state.
 */
function backendPatchNewTask(state: State, tempNewTaskId: number, task: Task): State {
  return {
    ...state,
    mainTaskArray: state.mainTaskArray.map(oldTask => (
      oldTask.id === tempNewTaskId ? task : oldTask
    )),
  };
}

/**
 * Let the backend patch an existing task.
 *
 * @param {State} state the old state.
 * @param {Task} task the task to patch.
 * @return {State} the new state.
 */
function backendPatchExistingTask(state: State, task: Task): State {
  return {
    ...state,
    mainTaskArray: state.mainTaskArray.map(oldTask => (
      oldTask.id === task.id ? task : oldTask
    )),
  };
}

/**
 * The root reducer creator.
 *
 * @param {AppUser} appUser the user of the app.
 * @return the root reducer.
 */
const rootReducer = (appUser: AppUser): ((state: (State | void), action: Action) => State) => {
  const startState = initialState(appUser);
  return (state: State = startState, action: Action): State => {
    switch (action.type) {
      case 'ADD_TAG':
        httpNewTag(action.tag).then(t => dispatchAction(backendPatchNewTag(action.tag.id, t)));
        return { ...state, tags: [...state.tags, action.tag] };
      case 'EDIT_TAG':
        httpEditTag(action.tag).then(() => {});
        return {
          ...state,
          tags: state.tags.map((oldTag: Tag) => (
            oldTag.id === action.tag.id ? action.tag : oldTag
          )),
        };
      case 'REMOVE_TAG':
        httpDeleteTag(action.tagId).then(() => {});
        return {
          ...state, tags: state.tags.filter((oldTag: Tag) => (oldTag.id !== action.tagId)),
        };
      case 'ADD_NEW_TASK':
        return addTask(state, action.data);
      case 'EDIT_TASK':
        return editTask(state, action);
      case 'MARK_TASK':
        return { ...state, mainTaskArray: markTask(state.mainTaskArray, action.id) };
      case 'MARK_SUBTASK':
        return {
          ...state, mainTaskArray: markSubtask(state.mainTaskArray, action.id, action.subtask),
        };
      case 'TOGGLE_TASK_PIN':
        return {
          ...state,
          mainTaskArray: toggleTaskPin(state.mainTaskArray, action.taskId),
        };
      case 'TOGGLE_SUBTASK_PIN':
        return {
          ...state,
          mainTaskArray: toggleSubtaskPin(state.mainTaskArray, action.taskId, action.subtaskId),
        };
      case 'REMOVE_TASK':
        return removeTaskReducer(state, action);
      case 'REMOVE_SUBTASK':
        return {
          ...state,
          mainTaskArray: removeSubtask(state.mainTaskArray, action.taskId, action.subtaskId),
        };
      case 'UNDO_DELETE_TASK':
        return undoDeleteTask(state);
      case 'CLEAR_UNDO_DELETE_TASK':
        return {
          ...state, undoCache: { ...state.undoCache, lastDeletedTask: null },
        };
      case 'BACKEND_PATCH_NEW_TASK':
        return backendPatchNewTask(state, action.tempNewTaskId, action.task);
      case 'BACKEND_PATCH_EXISTING_TASK':
        return backendPatchExistingTask(state, action.task);
      case 'BACKEND_PATCH_LOADED_DATA':
        return { ...state, tags: [defaultNoneTag, ...action.tags], mainTaskArray: action.tasks };
      default:
        return state;
    }
  };
};

export default rootReducer;
