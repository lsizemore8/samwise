// @flow

import React from 'react';
import { connect } from 'react-redux';
import { List } from 'semantic-ui-react';
import type { Dispatch } from 'redux';
import { removeColorConfig as removeColorConfigAction } from '../../store/actions';
import ColorEditor from './ColorEditor';

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
  removeColorConfig: tag => dispatch(removeColorConfigAction(tag)),
});

type Props = {|
  tag: string,
  color: string,
  removeColorConfig: (tag: string) => void
|};

type State = {| showEditor: boolean |};

class TagColorConfigItem extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      // whether to show the name editor and color picker
      showEditor: false,
    };
  }

  removeMe = () => {
    // eslint-disable-next-line
    if (!confirm('Do you want to remove this config?')) {
      return;
    }
    const { tag, removeColorConfig } = this.props;
    removeColorConfig(tag);
  };

  toggleEditor = () => {
    this.setState(s => ({ ...s, showEditor: !s.showEditor }));
  };

  render() {
    const { color, tag } = this.props;
    const { showEditor } = this.state;
    return (
      <List.Item>
        <List.Icon name="github" size="large" verticalAlign="middle" />
        <List.Content>
          <List.Header as="a" style={{ backgroundColor: color }}>{tag}</List.Header>
          <List.Description as="a">
            Color:
            {' '}
            {color}
          </List.Description>
          <button type="button" onClick={this.removeMe}>Remove me</button>
          <button type="button" onClick={this.toggleEditor}>Toggle Editor</button>
          {
            showEditor && <ColorEditor tag={tag} color={color} />
          }
        </List.Content>
      </List.Item>
    );
  }
}

const ConnectedTagColorConfigItem = connect(null, mapDispatchToProps)(TagColorConfigItem);
export default ConnectedTagColorConfigItem;
