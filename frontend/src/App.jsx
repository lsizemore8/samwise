import React from 'react';
import styles from './App.css';
import TagColorConfigEditor from './components/TagColorConfigEditor/TagColorConfigEditor';
import NewTaskComponent from './components/NewTask/NewTaskComponent';
import FocusView from './components/FocusView/focusView';

export default function App() {
  return (
    <div className={styles.App}>
      Project Samwise(?)
      <TagColorConfigEditor />
      <NewTaskComponent />
      <FocusView />
    </div>
  );
}