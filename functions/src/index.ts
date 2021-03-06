import { EventContext, firestore as firestoreFunction } from 'firebase-functions';
import { firestore, initializeApp } from 'firebase-admin';
import {
  FirestoreSubTask,
  FirestoreTag,
  FirestoreTask,
  UserActionRecord,
  UserActionStat
} from './types';

initializeApp();

const TAG_DOC = 'samwise-tags/{tagId}';
const TASK_DOC = 'samwise-tasks/{taskId}';
const SUBTASK_DOC = 'samwise-subtasks/{subTaskId}';

const userActions = () => firestore().collection('samwise-user-actions');

const getTime = (context: EventContext): firestore.Timestamp => {
  const d = new Date(context.timestamp);
  d.setUTCMinutes(0, 0, 0);
  return firestore.Timestamp.fromDate(d);
};

const getUserActionQuery = (user: string, time: firestore.Timestamp): firestore.Query => {
  let q: firestore.Query = userActions();
  q = q.where('user', '==', user);
  q = q.where('time', '==', time);
  return q;
};

const emptyActions: UserActionStat = {
  createTag: 0,
  editTag: 0,
  deleteTag: 0,
  createTask: 0,
  createSubTask: 0,
  deleteTask: 0,
  deleteSubTask: 0,
  editTask: 0,
  completeTask: 0,
  focusTask: 0,
  completeFocusedTask: 0
};

const updateRecord = (
  user: string, context: EventContext,
  getNewActionStat: () => UserActionStat,
  updateActionStat: (actions: UserActionStat) => UserActionStat
): void => {
  const time = getTime(context);
  firestore().runTransaction(async (transaction) => {
    const querySnapshot = await transaction.get(getUserActionQuery(user, time));
    if (querySnapshot.size === 0) {
      const record: UserActionRecord = { user, time, actions: getNewActionStat() };
      transaction.create(userActions().doc(), record);
    } else {
      const existingDoc = querySnapshot.docs[0];
      const existingRecord = existingDoc.data() as UserActionRecord;
      const actions: UserActionStat = updateActionStat(existingRecord.actions);
      transaction.update(userActions().doc(existingDoc.id), { actions });
    }
  }).then(() => {
    // Do nothing here
  }).catch(reason => console.log(reason));
};

/*
 * --------------------------------------------------------------------------------
 * Section 1: Tags Listeners
 * --------------------------------------------------------------------------------
 */

export const tagsOnCreate = firestoreFunction.document(TAG_DOC)
  .onCreate((snapshot, context) => {
    const { owner } = snapshot.data() as FirestoreTag;
    updateRecord(
      owner,
      context,
      () => ({ ...emptyActions, createTag: 1 }),
      (actions) => ({ ...actions, createTag: actions.createTag + 1 })
    );
    return null;
  });

export const tagsOnUpdate = firestoreFunction.document(TAG_DOC)
  .onUpdate((snapshot, context) => {
    const { after } = snapshot;
    if (after === undefined) {
      return;
    }
    const { owner } = after.data() as FirestoreTag;
    updateRecord(
      owner,
      context,
      () => ({ ...emptyActions, editTag: 1 }),
      (actions) => ({ ...actions, editTag: actions.editTag + 1 })
    );
    return null;
  });

export const tagsOnDelete = firestoreFunction.document(TAG_DOC)
  .onDelete((snapshot, context) => {
    const { owner } = snapshot.data() as FirestoreTag;
    updateRecord(
      owner,
      context,
      () => ({ ...emptyActions, deleteTag: 1 }),
      (actions) => ({ ...actions, deleteTag: actions.deleteTag + 1 })
    );
    return null;
  });

/*
 * --------------------------------------------------------------------------------
 * Section 2: Tasks Listeners
 * --------------------------------------------------------------------------------
 */

export const tasksOnCreate = firestoreFunction.document(TASK_DOC)
  .onCreate((snapshot, context) => {
    const { owner } = snapshot.data() as FirestoreTask;
    updateRecord(
      owner,
      context,
      () => ({ ...emptyActions, createTask: 1 }),
      (actions) => ({ ...actions, createTask: actions.createTask + 1 })
    );
    return null;
  });

export const tasksOnUpdate = firestoreFunction.document(TASK_DOC)
  .onUpdate((snapshot, context) => {
    const { before, after } = snapshot;
    if (before === undefined || after === undefined) {
      return;
    }
    const beforeData = before.data() as FirestoreTask;
    const afterData = after.data() as FirestoreTask;
    const user = afterData.owner;
    let editTaskIncrease = 0;
    let completeTaskIncrease = 0;
    let focusTaskIncrease = 0;
    let completeFocusedTaskIncrease = 0;
    if (afterData.name !== beforeData.name) {
      editTaskIncrease = 1;
    } else {
      const { date, tag } = afterData;
      if (!date.isEqual(beforeData.date) || tag !== beforeData.tag) {
        editTaskIncrease = 1;
      }
    }
    if (!beforeData.complete && afterData.complete) {
      completeTaskIncrease = 1;
    }
    if (!beforeData.inFocus && afterData.inFocus) {
      focusTaskIncrease = 1;
    }
    if (beforeData.inFocus && afterData.inFocus && !beforeData.complete && afterData.complete) {
      completeFocusedTaskIncrease = 1;
    }
    updateRecord(
      user,
      context,
      () => ({
        ...emptyActions,
        editTask: editTaskIncrease,
        completeTask: completeTaskIncrease,
        focusTask: focusTaskIncrease,
        completeFocusedTask: completeFocusedTaskIncrease
      }),
      (actions) => ({
        ...actions,
        editTask: actions.editTask + editTaskIncrease,
        completeTask: actions.completeTask + completeTaskIncrease,
        focusTask: actions.focusTask + focusTaskIncrease,
        completeFocusedTask: actions.completeFocusedTask + completeFocusedTaskIncrease
      })
    );
    return null;
  });

export const tasksOnDelete = firestoreFunction.document(TASK_DOC)
  .onDelete((snapshot, context) => {
    const { owner } = snapshot.data() as (FirestoreTask | FirestoreSubTask);
    updateRecord(
      owner,
      context,
      () => ({ ...emptyActions, deleteTask: 1 }),
      (actions) => ({ ...actions, deleteTask: actions.deleteTask + 1 })
    );
    return null;
  });

/*
 * --------------------------------------------------------------------------------
 * Section 3: SubTasks Listeners
 * --------------------------------------------------------------------------------
 */

export const subTasksOnCreate = firestoreFunction.document(SUBTASK_DOC)
  .onCreate((snapshot, context) => {
    const { owner } = snapshot.data() as FirestoreSubTask;
    updateRecord(
      owner,
      context,
      () => ({ ...emptyActions, createSubTask: 1 }),
      (actions) => ({ ...actions, createSubTask: actions.createSubTask + 1 })
    );
    return null;
  });

export const subTasksOnUpdate = firestoreFunction.document(SUBTASK_DOC)
  .onUpdate((snapshot, context) => {
    const { before, after } = snapshot;
    if (before === undefined || after === undefined) {
      return;
    }
    const beforeData = before.data() as FirestoreSubTask;
    const afterData = after.data() as FirestoreSubTask;
    const user = afterData.owner;
    const editTaskIncrease = afterData.name !== beforeData.name ? 1 : 0;
    const completeTaskIncrease = !beforeData.complete && afterData.complete ? 1 : 0;
    const focusTaskIncrease = !beforeData.inFocus && afterData.inFocus ? 1 : 0;
    const completeFocusedTaskIncrease = (
      beforeData.inFocus && afterData.inFocus && !beforeData.complete && afterData.complete
    ) ? 1 : 0;
    updateRecord(
      user,
      context,
      () => ({
        ...emptyActions,
        editTask: editTaskIncrease,
        completeTask: completeTaskIncrease,
        focusTask: focusTaskIncrease,
        completeFocusedTask: completeFocusedTaskIncrease
      }),
      (actions) => ({
        ...actions,
        editTask: actions.editTask + editTaskIncrease,
        completeTask: actions.completeTask + completeTaskIncrease,
        focusTask: actions.focusTask + focusTaskIncrease,
        completeFocusedTask: actions.completeFocusedTask + completeFocusedTaskIncrease
      })
    );
    return null;
  });

export const subTasksOnDelete = firestoreFunction.document(SUBTASK_DOC)
  .onDelete((snapshot, context) => {
    const { owner } = snapshot.data() as FirestoreSubTask;
    updateRecord(
      owner,
      context,
      () => ({ ...emptyActions, deleteSubTask: 1 }),
      (actions) => ({ ...actions, deleteSubTask: actions.deleteSubTask + 1 })
    );
    return null;
  });
