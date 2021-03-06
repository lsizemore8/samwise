import { Map } from 'immutable';
import {
  PatchCourses,
  PatchSubTasks,
  PatchTags,
  PatchTasks,
  PatchSettings,
  PatchBannerMessageStatus,
} from './action-types';
import { Course, Tag, Task, SubTask, Settings, BannerMessageStatus } from './store-types';

export const patchTags = (created: Tag[], edited: Tag[], deleted: string[]): PatchTags => ({
  type: 'PATCH_TAGS', created, edited, deleted,
});

export const patchTasks = (created: Task[], edited: Task[], deleted: string[]): PatchTasks => ({
  type: 'PATCH_TASKS', created, edited, deleted,
});

export const patchSubTasks = (
  created: SubTask[], edited: SubTask[], deleted: string[],
): PatchSubTasks => ({
  type: 'PATCH_SUBTASKS', created, edited, deleted,
});

export const patchSettings = (settings: Settings): PatchSettings => ({
  type: 'PATCH_SETTINGS', settings,
});

export const patchBannerMessageStatus = (
  change: BannerMessageStatus,
): PatchBannerMessageStatus => ({
  type: 'PATCH_BANNER_MESSAGES', change,
});

export const patchCourses = (courses: Map<string, Course[]>): PatchCourses => ({
  type: 'PATCH_COURSES', courses,
});
