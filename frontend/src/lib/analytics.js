import { toISODate } from './dates.js';

export function computeOverview({ projects, tasks, users }, user) {
  const today = toISODate(new Date());
  const inSeven = (() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return toISODate(date);
  })();

  const open = tasks.filter((task) => task.status !== 'done');
  const countBy = (list, key, values) => Object.fromEntries(values.map((value) => [value, list.filter((item) => item[key] === value).length]));

  const done = tasks.length - open.length;
  const weekly = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const iso = toISODate(date);
    return {
      date: iso,
      created: tasks.filter((task) => toISODate(new Date(task.createdAt)) === iso).length,
      completed: tasks.filter((task) => task.status === 'done' && toISODate(new Date(task.updatedAt)) === iso).length
    };
  });

  const projectProgress = projects.map((project) => {
    const own = tasks.filter((task) => task.projectId === project.id);
    const finished = own.filter((task) => task.status === 'done').length;
    return {
      id: project.id,
      title: project.title,
      status: project.status,
      total: own.length,
      done: finished,
      progress: own.length ? Math.round((finished / own.length) * 100) : 0
    };
  });

  return {
    totals: {
      projects: projects.length,
      activeProjects: projects.filter((project) => project.status === 'active').length,
      tasks: tasks.length,
      done,
      open: open.length,
      overdue: open.filter((task) => task.dueDate && task.dueDate < today).length,
      dueSoon: open.filter((task) => task.dueDate && task.dueDate >= today && task.dueDate <= inSeven).length,
      myOpen: open.filter((task) => task.assigneeId === user.id).length,
      completionRate: tasks.length ? Math.round((done / tasks.length) * 100) : 0
    },
    statusCounts: countBy(tasks, 'status', ['todo', 'in_progress', 'review', 'done']),
    priorityCounts: countBy(open, 'priority', ['low', 'medium', 'high']),
    projectProgress,
    weekly,
    upcoming: open
      .filter((task) => task.dueDate)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id - b.id)
      .slice(0, 6)
      .map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        projectId: task.projectId,
        projectTitle: task.projectTitle,
        assigneeName: task.assigneeName
      })),
    usersByRole: user.role === 'admin' && users
      ? users.reduce((acc, item) => ({ ...acc, [item.role]: (acc[item.role] || 0) + 1 }), {})
      : {}
  };
}
