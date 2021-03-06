import React, { ReactElement } from 'react';
import PinFilled from '../../../assets/svgs/pin-2-dark-filled.svg';
import PinOutline from '../../../assets/svgs/pin-2-dark-outline.svg';
import DeleteDark from '../../../assets/svgs/XDark.svg';
import styles from './FutureViewTask.css';
import { SubTask } from '../../../store/store-types';
import CheckBox from '../../UI/CheckBox';
import { editSubTask, removeSubTask } from '../../../firebase/actions';

type Props = {
  readonly subTask: SubTask;
  readonly mainTaskId: string;
  readonly mainTaskCompleted: boolean;
};

/**
 * The component used to render one subtask in future view day.
 */
function FutureViewSubTask({ subTask, mainTaskId, mainTaskCompleted }: Props): ReactElement | null {
  if (subTask == null) {
    return null;
  }
  const { name, complete, inFocus } = subTask;
  const onCompleteChange = (): void => editSubTask(subTask.id, { complete: !complete });
  const onFocusChange = (): void => editSubTask(subTask.id, { inFocus: !inFocus });
  const onRemove = (): void => removeSubTask(mainTaskId, subTask.id);
  return (
    <div className={styles.SubTask}>
      <CheckBox
        className={styles.TaskCheckBox}
        checked={mainTaskCompleted || complete}
        disabled={mainTaskCompleted}
        inverted
        onChange={onCompleteChange}
      />
      <span
        className={styles.TaskText}
        style={(mainTaskCompleted || complete) ? { textDecoration: 'line-through' } : {}}
      >
        {name}
      </span>
      {inFocus
        ? <PinFilled onClick={onFocusChange} className={styles.TaskIcon} />
        : <PinOutline onClick={onFocusChange} className={styles.TaskIcon} />
      }
      <DeleteDark className={styles.TaskIcon} onClick={onRemove} />
    </div>
  );
}

const Memoized = React.memo(FutureViewSubTask);
export default Memoized;
