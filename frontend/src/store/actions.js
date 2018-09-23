// @flow

export type Action = { type: string };

export type TagColorConfigAction = Action & { tag: string, color?: string };

/**
 * Edit color config is an action that can be used to add OR edit a color config in the store.
 *
 * @param {string} tag tag of the config, which is usually a class name (e.g. CS 2112)
 * @param {string} color color of the config, which should be a valid color in CSS
 * (e.g. 'red' or '#000000')
 * @return {{type: string, tag: string, color: string}} the edit color action.
 */
export const editColorConfig = (tag: string, color: string): TagColorConfigAction => ({
  type: 'EDIT_COLOR_CONFIG', tag, color,
});

/**
 * Remove color config is an action that can be used to remove a color config from the store.
 *
 * @param {string} tag tag of the config to remove, which is usually a class name (e.g. CS 2112)
 * @return {{type: string, tag: string}} the remove color action.
 */
export const removeColorConfig = (tag: string): TagColorConfigAction => ({
  type: 'REMOVE_COLOR_CONFIG', tag,
});

export const addTask = (data: any) => ({ type: 'ADD_NEW_TASK', data });
