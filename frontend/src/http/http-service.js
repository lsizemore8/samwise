// @flow strict

import { get, post, put } from '../util/http-util';
import type {
  Tag, SubTask, Task, MainTask,
} from '../store/store-types';
import type { BackendPatchLoadedDataAction } from '../store/action-types';
import { backendPatchLoadedData } from '../store/actions';
import { error } from '../util/general-util';

/**
 * Format date for backend.
 *
 * @param {Date} date date to be formatted.
 * @return {string} the formatted date.
 */
function formatDate(date: Date): string {
  const padZero = (num: number): string => {
    const s = num.toString(10);
    return s.length === 1 ? `0${s}` : s;
  };
  const dateString = `${date.getUTCFullYear()}-${padZero(date.getUTCMonth() + 1)}-${padZero(date.getUTCDate())}`;
  const timeString = `${padZero(date.getUTCHours())}:${padZero(date.getUTCMinutes())}:00`;
  return `${dateString} ${timeString}`;
}

type ServerTag = {
  +tag_id: number; +tag_name: string; +color: string;
};
type ServerTask = {
  +task_id: number;
  +content: string;
  +tag_id: number;
  +start_date: string;
  +end_date: string;
  +completed: boolean;
  +in_focus: boolean;
  +parent_task: ?number;
};

/**
 * Returns the promise of a ColorConfig.
 *
 * @return {Promise<Tag[]>} the promise of a ColorConfig.
 */
export async function httpGetTags(): Promise<Tag[]> {
  const rawTagList = await get<ServerTag[]>('/tags/all');
  return rawTagList.map((e): Tag => ({
    id: e.tag_id,
    type: 'other',
    name: e.tag_name,
    color: e.color,
  }));
}

/**
 * Create a new tag.
 *
 * @param {Tag} tag tag to create.
 * @return {Promise<Tag>} promise of the tag returned by the server.
 */
export async function httpNewTag(tag: Tag): Promise<Tag> {
  const serverTag = await post<ServerTag>('/tags/new', {
    name: tag.name, color: tag.color,
  });
  return { ...tag, id: serverTag.tag_id };
}

/**
 * Edit a tag.
 *
 * @param {Tag} tag the updated tag.
 * @return {Promise<void>} promise when done.
 */
export async function httpEditTag(tag: Tag): Promise<void> {
  const data = { tag_name: tag.name, color: tag.color };
  await post(`/tags/${tag.id}/edit`, data);
}

/**
 * Delete a tag of the given name.
 *
 * @param {number} tagId id of the tag.
 * @return {Promise<void>} promise when done.
 */
export async function httpDeleteTag(tagId: number): Promise<void> {
  await put(`/tags/${tagId}/delete`, {});
}

/**
 * Returns the promise of loaded tasks.
 *
 * @return {Promise<Task[]>}
 */
export async function httpGetTasks(): Promise<Task[]> {
  const serverTasks = await get<ServerTask[]>('/tasks/all');
  const mainTasks = new Map<number, Task>();
  const serverSubTasks = new Map<number, SubTask[]>(); // key is parent id
  serverTasks.forEach((serverTask: ServerTask) => {
    const id = serverTask.task_id;
    const name = serverTask.content;
    const complete = serverTask.completed;
    const inFocus = serverTask.in_focus;
    const parentTaskId = serverTask.parent_task;
    if (parentTaskId == null) {
      const tag: number = serverTask.tag_id;
      const date = new Date(serverTask.end_date);
      const subtaskArray = [];
      const mainTask: Task = {
        id, name, tag, date, complete, inFocus, subtaskArray,
      };
      mainTasks.set(id, mainTask);
    } else {
      const subTask: SubTask = {
        id, name, complete, inFocus,
      };
      const arr = serverSubTasks.get(parentTaskId) ?? [];
      arr.push(subTask);
      serverSubTasks.set(parentTaskId, arr);
    }
  });
  serverSubTasks.forEach((subTasks: SubTask[], parentId: number) => {
    const mainTask = mainTasks.get(parentId) ?? error('Corrupted backend!');
    mainTasks.set(parentId, { ...mainTask, subtaskArray: subTasks });
  });
  const assembledTasks: Task[] = [];
  mainTasks.forEach((task: Task) => {
    assembledTasks.push(task);
  });
  return assembledTasks;
}

/**
 * Initialize the data from the backend.
 *
 * @return {Promise<BackendPatchLoadedDataAction>} the promise of the action to perform.
 */
export async function httpInitializeData(): Promise<BackendPatchLoadedDataAction> {
  const [tags, tasks] = await Promise.all([httpGetTags(), httpGetTasks()]);
  return backendPatchLoadedData(tags, tasks);
}

/**
 * Mark a task.
 *
 * @param {number} taskId id the task.
 * @param {boolean} complete whether to mark as complete or not.
 * @return {Promise<void>} promise when done.
 */
export async function httpMarkTask(taskId: number, complete: boolean): Promise<void> {
  await put(`/tasks/${taskId}/mark`, { complete });
}

/**
 * Pin a task.
 *
 * @param {number} taskId id the task.
 * @param {boolean} inFocus whether to pin or unpin.
 * @return {Promise<void>} promise when done.
 */
export async function httpPinTask(taskId: number, inFocus: boolean): Promise<void> {
  await post(`/tasks/${taskId}/focus`, { focus: inFocus });
}

/**
 * Add a new task.
 *
 * @param {Task} task the new task to add.
 * @return {Promise<Task>} promise of the task with new information.
 */
export async function httpAddTask(task: Task): Promise<Task> {
  const data = {
    content: task.name,
    tag_id: task.tag,
    start_date: formatDate(new Date()),
    end_date: formatDate(task.date),
  };
  const serverTask = await post<{ +created: ServerTask }>('/tasks/new', data);
  return { ...task, id: serverTask.created.task_id };
}

/**
 * Delete a task with a task id.
 * Currently, it does not differentiate between main tasks and subtasks.
 *
 * @param {number} taskId the id of the task.
 * @return {Promise<void>} promise when done.
 */
export async function httpDeleteTask(taskId: number): Promise<void> {
  await put(`/tasks/${taskId}/delete`, {});
}

/**
 * Create a new subtask.
 *
 * @param {Task} mainTask the main task of the subtask's parent.
 * @param {SubTask} subTask the subtask to create.
 * @return {Promise<SubTask>} the subtask coming from server with latest information.
 */
export async function httpNewSubTask(mainTask: Task, subTask: SubTask): Promise<SubTask> {
  const {
    id, name, complete, inFocus,
  } = subTask;
  const data = {
    task_id: id,
    parent_task: mainTask.id,
    content: name,
    start_date: formatDate(new Date()),
    end_date: formatDate(mainTask.date),
    tag_id: mainTask.tag,
    completed: complete,
    in_focus: inFocus,
  };
  const serverSubTask = await post<{ +created: ServerTask }>('/tasks/new', data);
  return { ...subTask, id: serverSubTask.created.task_id };
}

/**
 * Edit an existing task.
 *
 * @param {number} taskId id of the task.
 * @param {Task} mainTask the main task to edit.
 * @return {Promise<void>} promise when done.
 */
export async function httpEditMainTask(taskId: number, mainTask: MainTask): Promise<void> {
  const {
    name, tag, date, complete, inFocus,
  } = mainTask;
  const data = {
    task_id: taskId,
    parent_task: null,
    content: name,
    start_date: formatDate(new Date()),
    end_date: formatDate(date),
    tag_id: tag,
    completed: complete,
    in_focus: inFocus,
  };
  await post(`/tasks/${taskId}/edit`, data);
}

/**
 * Edit an existing subtask.
 *
 * @param {Task} mainTask the main task of the subtask's parent.
 * @param {SubTask} subTask the subtask to edit.
 * @return {Promise<void>} promise when done.
 */
export async function httpEditSubTask(mainTask: Task, subTask: SubTask): Promise<void> {
  const {
    id, name, complete, inFocus,
  } = subTask;
  const data = {
    task_id: id,
    parent_task: mainTask.id,
    content: name,
    start_date: formatDate(new Date()),
    end_date: formatDate(mainTask.date),
    tag_id: mainTask.tag,
    completed: complete,
    in_focus: inFocus,
  };
  await post(`/tasks/${id}/edit`, data);
}

/**
 * Edit an existing task.
 *
 * @param {Task} oldTask the old task used as a reference.
 * @param {Task} newTask the new task to replace the old task.
 * @return {Promise<Task>} the edited task with the latest information from the server.
 */
export async function httpEditTask(oldTask: Task, newTask: Task): Promise<Task> {
  if (oldTask.id !== newTask.id) {
    throw new Error('Inconsistent id of old task and new task.');
  }
  const mainTaskData = {
    task_id: newTask.id,
    tag_id: newTask.tag,
    start_date: formatDate(new Date()),
    end_date: formatDate(newTask.date),
    content: newTask.name,
    completed: newTask.complete,
    in_focus: newTask.inFocus,
  };
  await post(`/tasks/${newTask.id}/edit`, mainTaskData);
  // Deal with subtasks
  const oldTasksIdSet = new Set(oldTask.subtaskArray.map(({ id }: SubTask) => id));
  const editedSubTasks: SubTask[] = [];
  const newSubTasks: SubTask[] = [];
  newTask.subtaskArray.forEach((subTask: SubTask) => {
    const { id } = subTask;
    if (oldTasksIdSet.has(id)) {
      editedSubTasks.push(subTask);
      oldTasksIdSet.delete(id);
    } else {
      newSubTasks.push(subTask);
    }
  });
  const deletedSubTasks: SubTask[] = newTask.subtaskArray.filter(({ id }) => oldTasksIdSet.has(id));
  const subTasksEditPromises = editedSubTasks.map(
    (subTask: SubTask) => httpEditSubTask(newTask, subTask).then(() => subTask),
  );
  const subTasksNewPromises = newSubTasks.map(
    (subTask: SubTask) => httpNewSubTask(newTask, subTask),
  );
  const subTasksDeletePromises = deletedSubTasks.map(
    ({ id }: SubTask) => httpDeleteTask(id),
  );
  const allDone = await Promise.all([
    ...subTasksNewPromises, ...subTasksEditPromises, ...subTasksDeletePromises,
  ]);
  const subtaskArray: SubTask[] = [];
  allDone.forEach((subtask: SubTask | void) => {
    if (subtask !== undefined) {
      subtaskArray.push(subtask);
    }
  });
  return { ...newTask, subtaskArray };
}
