import { TASK_STATUSES } from './constants.js';

export function columnOf(tasks, status) {
  return tasks.filter((task) => task.status === status).sort((a, b) => a.position - b.position || a.id - b.id);
}

export function groupByStatus(tasks) {
  return Object.fromEntries(TASK_STATUSES.map((status) => [status, columnOf(tasks, status)]));
}

export function moveLocally(tasks, id, status, index) {
  const moving = tasks.find((task) => task.id === id);
  if (!moving) return tasks;
  const target = columnOf(tasks, status).filter((task) => task.id !== id);
  target.splice(Math.min(index, target.length), 0, { ...moving, status });
  const positions = new Map(target.map((task, position) => [task.id, position]));
  return tasks.map((task) => {
    if (task.id === id) return { ...task, status, position: positions.get(id), updatedAt: new Date().toISOString() };
    return positions.has(task.id) ? { ...task, position: positions.get(task.id) } : task;
  });
}

export function projectPeople(project) {
  if (!project) return [];
  const list = [...project.members];
  if (project.mentorId && !list.some((person) => person.id === project.mentorId)) {
    list.push({ id: project.mentorId, name: project.mentorName, role: 'mentor', avatarColor: '#8B5CF6' });
  }
  return list;
}
