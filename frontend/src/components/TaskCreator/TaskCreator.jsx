// @flow strict

import React from 'react';
import type { Node } from 'react';
import { Icon } from 'semantic-ui-react';
import Delete from '../../assets/svgs/X.svg';
import 'react-toastify/dist/ReactToastify.css';
import styles from './TaskCreator.css';
import TagPicker from './TagPicker';
import DatePicker from './DatePicker';
import FocusPicker from './FocusPicker';
import { randomId } from '../../util/general-util';
import type { Task, SubTask } from '../../store/store-types';
import { NONE_TAG_ID } from '../../util/tag-util';
import { replaceSubTask } from '../../util/task-util';
import { isToday } from '../../util/datetime-util';
import { addTask } from '../../firebase/actions';

type State = {|
  ...$Diff<Task, {| +order: number |}>;
  +opened: boolean;
  +tagPickerOpened: boolean;
  +datePickerOpened: boolean;
  +datePicked: boolean;
  +needToSwitchFocus: boolean;
|};

/**
 * The placeholder text in the main task input box.
 * @type {string}
 */
const PLACEHOLDER_TEXT = 'What do you have to do?';
/**
 * Generate the initial state.
 * @return {State}
 */
const initialState = (): State => ({
  id: randomId(),
  name: '',
  tag: NONE_TAG_ID, // the id of the None tag.
  date: new Date(),
  complete: false,
  inFocus: false,
  subtasks: [],
  opened: false,
  tagPickerOpened: false,
  datePickerOpened: false,
  datePicked: false,
  needToSwitchFocus: false,
});

export default class TaskCreator extends React.PureComponent<{||}, State> {
  state: State = initialState();

  /*
   * --------------------------------------------------------------------------------
   * Part 1: Openers & Closers
   * --------------------------------------------------------------------------------
   */

  /**
   * Open the new task editor.
   */
  openNewTask = () => this.setState({ opened: true });

  /**
   * Close (collapse) the new task editor.
   */
  closeNewTask = () => this.setState({ opened: false });

  /**
   * Open the tag picker and close the date picker.
   */
  openTagPicker = () => this.setState(({ tagPickerOpened }: State) => ({
    tagPickerOpened: !tagPickerOpened,
    datePickerOpened: false,
  }));

  /**
   * Open the date picker and close the tag picker.
   */
  openDatePicker = () => this.setState(({ datePickerOpened }: State) => ({
    datePickerOpened: !datePickerOpened,
    tagPickerOpened: false,
  }));

  /*
   * --------------------------------------------------------------------------------
   * Part 2: Manager functions when finished editing.
   * --------------------------------------------------------------------------------
   */

  /**
   * Focus on the task name, if possible.
   */
  focusTaskName = () => {
    if (this.addTask) {
      this.addTask.focus();
    }
  };

  /**
   * Handle on potential save.
   *
   * @param e the event that signals a potential save action.
   */
  handleSave = (e?: SyntheticEvent<HTMLElement>) => {
    if (e != null) {
      e.preventDefault();
    }
    const {
      name, tag, date, complete, inFocus, subtasks,
    } = this.state;
    if (name === '') {
      return;
    }
    const newSubTasks = subtasks
      .filter(subTask => subTask.name !== '') // remove empty subtasks
      .map((s, order) => ({ ...s, order })); // normalize orders: use current sequence as order;
    const autoInFocus = inFocus || isToday(date); // Put task in focus is the due date is today.
    const newTask = {
      name, tag, date, complete, inFocus: autoInFocus, subtasks: newSubTasks,
    };
    // Add the task to the store.
    addTask(newTask);
    // Reset the state.
    this.setState({ ...initialState() });
    this.closeNewTask();
    if (this.addTask) {
      this.addTask.blur();
    }
  };

  /*
   * --------------------------------------------------------------------------------
   * Part 3: Various Editors
   * --------------------------------------------------------------------------------
   */

  /**
   * Edit the task name.
   *
   * @param e the event that contains the new task name.
   */
  editTaskName = (e: SyntheticEvent<HTMLInputElement>) => this.setState(
    { name: e.currentTarget.value },
    this.focusTaskName,
  );

  /**
   * Edit the tag.
   *
   * @param {string} tag the new tag.
   */
  editTag = (tag: string) => this.setState({ tag, tagPickerOpened: false }, this.focusTaskName);

  /**
   * Edit the date.
   *
   * @param {Date} date the new date, or null for today.
   */
  editDate = (date: Date | null) => this.setState(
    { date: date || new Date(), datePickerOpened: false, datePicked: Boolean(date) },
    this.focusTaskName,
  );

  /**
   * Toggle the pin status.
   * @param {boolean} inFocus the new in-focus status.
   */
  togglePin = (inFocus: boolean) => this.setState({ inFocus }, this.focusTaskName);

  /**
   * Add a new subtask.
   *
   * @param e the event that contains the new name for new sub-task.
   */
  addNewSubTask = (e: SyntheticEvent<HTMLInputElement>) => {
    const newSubTaskName = e.currentTarget.value;
    if (newSubTaskName === '') {
      return;
    }
    this.setState(({ subtasks }: State) => ({
      subtasks: [...subtasks, {
        id: String(subtasks.length),
        order: 0, // some random order, will be ignored anyway
        name: newSubTaskName,
        complete: false,
        inFocus: false,
      }],
      needToSwitchFocus: true,
    }));
  };

  /**
   * Edit a subtask.
   *
   * @param {string} subtaskId id of the subtask to edit.
   * @return {Function<SyntheticEvent<HTMLInputElement>, void>} the event handler.
   */
  editSubTask = (subtaskId: string) => (e: SyntheticEvent<HTMLInputElement>) => {
    const name = e.currentTarget.value;
    this.setState(({ subtasks }: State) => ({
      subtasks: replaceSubTask(subtasks, subtaskId, s => ({ ...s, name })),
    }));
  };

  /**
   * Potentially submit a subtask.
   *
   * @param {SyntheticKeyboardEvent<HTMLInputElement>} e the keyboard event.
   */
  submitSubTask = (e: SyntheticKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      this.handleSave();
    }
  };

  /**
   * Delete a subtask.
   *
   * @param {string} subtaskId id of the subtask to delete.
   * @return {Function<SyntheticEvent<HTMLInputElement>, void>} the event handler.
   */
  deleteSubTask = (subtaskId: string) => (e: SyntheticEvent<HTMLButtonElement>) => {
    e.preventDefault();
    this.setState(({ subtasks }: State) => ({
      subtasks: subtasks.filter(s => s.id !== subtaskId),
    }));
  };

  /**
   * Reset the task.
   */
  resetTask = () => this.setState({ ...initialState() }, this.focusTaskName);

  addTask: ?HTMLInputElement;

  /**
   * Renders the editor for all the other info except main task name.
   *
   * @return {Node} the rendered other info editor.
   */
  renderOtherInfoEditor(): Node {
    const { opened } = this.state;
    if (!opened) {
      return null;
    }
    const {
      tag, date, inFocus, subtasks,
      tagPickerOpened, datePickerOpened, datePicked, needToSwitchFocus,
    } = this.state;
    const existingSubTaskEditor = ({ id, name }: SubTask, i: number, arr: SubTask[]) => {
      const refHandler = (inputElementRef) => {
        if (i === arr.length - 1 && needToSwitchFocus && inputElementRef != null) {
          inputElementRef.focus();
          this.setState({ needToSwitchFocus: false });
        }
      };
      return (
        <li key={id}>
          <button type="button" tabIndex={-1} onClick={this.deleteSubTask(id)}>
            <span style={{ backgroundImage: `url(${Delete})` }} />
          </button>
          <input
            type="text"
            ref={refHandler}
            value={name}
            onChange={this.editSubTask(id)}
            onKeyDown={this.submitSubTask}
          />
        </li>
      );
    };
    return (
      <div className={styles.NewTaskActive}>
        <FocusPicker pinned={inFocus} onPinChange={this.togglePin} />
        <TagPicker
          tag={tag}
          opened={tagPickerOpened}
          onTagChange={this.editTag}
          onPickerOpened={this.openTagPicker}
        />
        <DatePicker
          date={date}
          opened={datePickerOpened}
          datePicked={datePicked}
          onDateChange={this.editDate}
          onPickerOpened={this.openDatePicker}
        />
        <button tabIndex={-1} type="submit" className={styles.SubmitNewTask}>
          <Icon name="arrow alternate circle right outline" color="black" />
        </button>
        <div className={styles.NewTaskModal}>
          <ul>{subtasks.map(existingSubTaskEditor)}</ul>
          <Icon name="plus" />
          <input type="text" placeholder="Add a Subtask" value="" onChange={this.addNewSubTask} />
          <button type="button" className={styles.ResetButton} onClick={this.resetTask}>
            {'Clear'}
          </button>
        </div>
      </div>
    );
  }

  render(): Node {
    const { name, opened } = this.state;
    const toggleDisplayStyle = opened ? {} : { display: 'none' };
    // Click this component, new task component closes.
    const newTaskCloser = (
      <div
        onClick={this.closeNewTask}
        role="presentation"
        className={styles.CloseNewTask}
        style={toggleDisplayStyle}
      />
    );
    const mainTaskNameEditor = (
      <input
        required
        type="text"
        value={name}
        onChange={this.editTaskName}
        className={styles.NewTaskComponent}
        placeholder={opened ? '' : PLACEHOLDER_TEXT}
        ref={(e) => { this.addTask = e; }}
      />
    );
    return (
      <div>
        {newTaskCloser}
        <form className={styles.NewTaskWrap} onSubmit={this.handleSave} onFocus={this.openNewTask}>
          {mainTaskNameEditor}
          {this.renderOtherInfoEditor()}
        </form>
      </div>
    );
  }
}
