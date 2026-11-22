import { isMac } from './dom';

export interface ShortcutHelp {
  keys: string[][];
  label: string;
}

export interface ShortcutGroup {
  title: string;
  items: ShortcutHelp[];
}

const MOD = isMac ? '⌘' : 'Ctrl';
const ALT = isMac ? '⌥' : 'Alt';

/** Shown in the cheatsheet. Each inner array is one key combination; alternatives are separate arrays. */
export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'General',
    items: [
      { keys: [['N']], label: 'New task' },
      { keys: [['/']], label: 'Search tasks' },
      { keys: [['1'], ['2'], ['3']], label: 'All / Active / Done' },
      { keys: [['T']], label: 'Toggle theme' },
      { keys: [['U'], [MOD, 'Z']], label: 'Undo delete' },
      { keys: [['?']], label: 'Show shortcuts' },
      { keys: [['Esc']], label: 'Cancel / leave field' },
    ],
  },
  {
    title: 'Tasks',
    items: [
      { keys: [['J'], ['↓']], label: 'Next task' },
      { keys: [['K'], ['↑']], label: 'Previous task' },
      { keys: [['X'], ['Space']], label: 'Complete / reopen' },
      { keys: [['E'], ['Enter']], label: 'Edit task' },
      { keys: [['Del'], ['⌫']], label: 'Delete task' },
      { keys: [[ALT, '↑'], [ALT, '↓']], label: 'Move task up / down' },
    ],
  },
  {
    title: 'Quick add',
    items: [
      { keys: [['#tag']], label: 'Add a tag' },
      { keys: [['!high'], ['!med'], ['!low']], label: 'Set priority' },
    ],
  },
];
