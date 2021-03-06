import React, { ReactElement } from 'react';
import { ToastContainer } from 'react-toastify';
import styles from './App.module.css';
import Onboard from './components/TitleBar/Onboarding/Onboard';
import TaskCreator from './components/TaskCreator/TaskCreator';
import TaskView from './components/TaskView';
import TitleBar from './components/TitleBar/TitleBar';

/**
 * The top level app component.
 */
export default function App(): ReactElement {
  return (
    <div>
      <Onboard />
      <ToastContainer className={styles.Toast} />
      <TitleBar />
      <TaskCreator />
      <TaskView />
    </div>
  );
}
