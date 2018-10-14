// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import type { OneDayTask } from './backlog-types';
import BacklogDay from './BacklogDay';
import type { State, Task } from '../../store/store-types';
import styles from './Backlog.css';

type Props = {| days: OneDayTask[] |};

const mapStateToProps = (state: State): Props => {
  const days: OneDayTask[] = [];
  const aMonthLater = new Date();
  // build a map from day to its tasks for faster access
  const day2TaskMap = (() => {
    const map: Map<string, Task[]> = new Map();
    state.mainTaskArray.forEach((task) => {
      const dateString = new Date(task.date).toLocaleDateString();
      const tasksArrOpt = map.get(dateString);
      if (tasksArrOpt == null) {
        map.set(dateString, [task]);
      } else {
        tasksArrOpt.push(task);
      }
    });
    return map;
  })();
  // display only events for next 30 days
  aMonthLater.setDate(aMonthLater.getDate() + 30);
  for (let d = new Date(); d <= aMonthLater; d.setDate(d.getDate() + 1)) {
    const date = new Date(d);
    const tasksOnThisDay = day2TaskMap.get(date.toLocaleDateString()) || [];
    const tasks = tasksOnThisDay.map((task: Task) => {
      const {
        name, id, complete, tag, subtaskArray,
      } = task;
      return {
        name, id, complete, color: state.tagColorPicker[tag], subTasks: subtaskArray,
      };
    });
    days.push({ date, tasks });
  }
  return { days };
};

/**
 * The component for displaying the entire back logs.
 *
 * @param {BacklogDay} days a collection of tasks organized according to deadline of the task.
 * @return {*} the backlog component.
 * @constructor
 */
function Backlog({ days }: Props) {
  const renderDay = (day: OneDayTask) => <BacklogDay key={day.date.toDateString()} {...day} />;
  return <div className={styles.Backlog}>{days.map(renderDay)}</div>;
}

const ConnectedBackLog = connect(
  mapStateToProps,
  null,
)(Backlog);
export default ConnectedBackLog;