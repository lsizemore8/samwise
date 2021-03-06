import React, { KeyboardEvent, SyntheticEvent, ReactElement } from 'react';
import styles from './TagItem.css';
import ColorEditor from './ColorEditor';
import { addTag } from '../../../firebase/actions';

type State = { readonly name: string; readonly color: string };

const defaultColor = '#289de9';
const initialState: State = { name: '', color: defaultColor };

export default class OtherTagAdder extends React.PureComponent<{}, State> {
  public readonly state: State = initialState;

  private editColor = (color: string) => this.setState({ color });

  private editName = (event: SyntheticEvent<HTMLInputElement>) => this.setState({
    name: event.currentTarget.value,
  });

  private onSubmit = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }
    const { name, color } = this.state;
    addTag({
      name, color, classId: null,
    });
    this.setState(initialState);
  };

  public render(): ReactElement {
    const { name, color } = this.state;
    return (
      <li className={styles.ColorConfigItem}>
        <input
          type="text"
          className={`${styles.TagName} ${styles.AddTagName}`}
          placeholder="New Tag"
          value={name}
          onChange={this.editName}
          onKeyDown={this.onSubmit}
        />
        <ColorEditor color={color} onChange={this.editColor} />
      </li>
    );
  }
}
