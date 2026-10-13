export const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];

export const STATUS_META = {
  todo: { label: 'To do', bar: 'bg-todo', dot: 'bg-todo', tint: 'bg-todo/15', soft: 'bg-todo/10', ring: 'ring-todo/40', cssVar: 'todo' },
  in_progress: { label: 'In progress', bar: 'bg-progress', dot: 'bg-progress', tint: 'bg-progress/15', soft: 'bg-progress/10', ring: 'ring-progress/40', cssVar: 'progress' },
  review: { label: 'In review', bar: 'bg-review', dot: 'bg-review', tint: 'bg-review/20', soft: 'bg-review/10', ring: 'ring-review/40', cssVar: 'review' },
  done: { label: 'Done', bar: 'bg-done', dot: 'bg-done', tint: 'bg-done/15', soft: 'bg-done/10', ring: 'ring-done/40', cssVar: 'done' }
};

export const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed'];

export const PROJECT_STATUS_META = {
  planning: { label: 'Planning', tint: 'bg-sun/25', dot: 'bg-sun' },
  active: { label: 'Active', tint: 'bg-brand/15', dot: 'bg-brand' },
  on_hold: { label: 'On hold', tint: 'bg-todo/15', dot: 'bg-todo' },
  completed: { label: 'Completed', tint: 'bg-done/15', dot: 'bg-done' }
};

export const PRIORITIES = ['low', 'medium', 'high'];

export const PRIORITY_META = {
  low: { label: 'Low', tint: 'bg-todo/15', dot: 'bg-todo', rank: 0 },
  medium: { label: 'Medium', tint: 'bg-sun/25', dot: 'bg-sun', rank: 1 },
  high: { label: 'High', tint: 'bg-accent/15', dot: 'bg-accent', rank: 2 }
};

export const ROLE_META = {
  student: { label: 'Student', tint: 'bg-brand/15' },
  mentor: { label: 'Mentor', tint: 'bg-sun/25' },
  admin: { label: 'Admin', tint: 'bg-accent/15' }
};

export const AVATAR_COLORS = ['#0E7C7B', '#EF6351', '#2F80ED', '#8B5CF6', '#D97706', '#DB2777', '#16A37F', '#475569'];

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
