import { ApiError } from './errors.js';
import { createSeed } from './mockData.js';
import { computeOverview } from '../lib/analytics.js';
import { AVATAR_COLORS } from '../lib/constants.js';

const DB_KEY = 'pf_mock_db';
const TOKEN_KEY = 'pf_token';
const LATENCY = 320;

const wait = (ms = LATENCY) => new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 120));
const clone = (value) => JSON.parse(JSON.stringify(value));

function load() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    localStorage.removeItem(DB_KEY);
  }
  const seed = createSeed();
  localStorage.setItem(DB_KEY, JSON.stringify(seed));
  return seed;
}

const save = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db));
const nextId = (db, key) => db.seq[key]++;
const publicUser = ({ password: _password, ...user }) => user;

function currentUser(db) {
  const token = localStorage.getItem(TOKEN_KEY) || '';
  const id = Number(token.replace('mock.', ''));
  const user = db.users.find((item) => item.id === id);
  if (!user) throw new ApiError(401, 'Sign in to continue');
  return user;
}

const canSee = (db, user, project) =>
  user.role === 'admin' ||
  project.ownerId === user.id ||
  project.mentorId === user.id ||
  db.members.some((member) => member.projectId === project.id && member.userId === user.id);

const visibleProjects = (db, user) => db.projects.filter((project) => canSee(db, user, project));

function projectAccess(db, user, id) {
  const project = db.projects.find((item) => item.id === Number(id));
  if (!project || !canSee(db, user, project)) throw new ApiError(404, 'Project not found');
  const isAdmin = user.role === 'admin';
  return {
    project,
    canManage: isAdmin || project.ownerId === user.id || project.mentorId === user.id,
    canDelete: isAdmin || project.ownerId === user.id
  };
}

function viewProject(db, project) {
  const owner = db.users.find((user) => user.id === project.ownerId);
  const mentor = db.users.find((user) => user.id === project.mentorId);
  const own = db.tasks.filter((task) => task.projectId === project.id);
  const count = (status) => own.filter((task) => task.status === status).length;
  const members = db.members
    .filter((member) => member.projectId === project.id)
    .map((member) => db.users.find((user) => user.id === member.userId))
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((user) => ({ id: user.id, name: user.name, role: user.role, avatarColor: user.avatarColor }));
  return {
    ...project,
    ownerName: owner?.name,
    mentorName: mentor?.name ?? null,
    members,
    taskCounts: { total: own.length, todo: count('todo'), in_progress: count('in_progress'), review: count('review'), done: count('done') },
    progress: own.length ? Math.round((count('done') / own.length) * 100) : 0
  };
}

function viewTask(db, task) {
  const project = db.projects.find((item) => item.id === task.projectId);
  const assignee = db.users.find((user) => user.id === task.assigneeId);
  return {
    ...task,
    projectTitle: project?.title,
    assigneeName: assignee?.name ?? null,
    assigneeColor: assignee?.avatarColor ?? null,
    commentCount: db.comments.filter((comment) => comment.taskId === task.id).length
  };
}

const sortTasks = (a, b) => {
  const order = { todo: 0, in_progress: 1, review: 2, done: 3 };
  return a.projectId - b.projectId || order[a.status] - order[b.status] || a.position - b.position || a.id - b.id;
};

function visibleTasks(db, user) {
  const ids = new Set(visibleProjects(db, user).map((project) => project.id));
  return db.tasks.filter((task) => ids.has(task.projectId)).sort(sortTasks).map((task) => viewTask(db, task));
}

function notify(db, userIds, payload, actorId) {
  [...new Set(userIds.filter((id) => id && id !== actorId))].forEach((userId) => {
    db.notifications.unshift({ id: nextId(db, 'notification'), userId, read: false, createdAt: new Date().toISOString(), ...payload });
  });
}

function people(db, projectId) {
  const project = db.projects.find((item) => item.id === projectId);
  return { ownerId: project.ownerId, mentorId: project.mentorId, memberIds: db.members.filter((m) => m.projectId === projectId).map((m) => m.userId) };
}

function assertAssignable(db, projectId, assigneeId) {
  if (!assigneeId) return;
  const { ownerId, mentorId, memberIds } = people(db, projectId);
  if (![ownerId, mentorId, ...memberIds].includes(assigneeId)) {
    throw new ApiError(400, 'Assign tasks to people who are part of this project');
  }
}

function required(value, message) {
  if (!value || !String(value).trim()) throw new ApiError(400, message);
  return String(value).trim();
}

function normalizePositions(db, status, orderedIds) {
  orderedIds.forEach((id, index) => {
    const task = db.tasks.find((item) => item.id === id);
    task.position = index;
    task.status = status;
  });
}

async function run(work, { auth = true } = {}) {
  await wait();
  const db = load();
  const user = auth ? currentUser(db) : null;
  const result = work(db, user);
  save(db);
  return clone(result ?? null);
}

export const mockApi = {
  mode: 'demo',
  auth: {
    login: ({ email, password }) =>
      run((db) => {
        const user = db.users.find((item) => item.email === String(email).trim().toLowerCase());
        if (!user || user.password !== password) throw new ApiError(401, 'Email or password is incorrect');
        return { token: `mock.${user.id}`, user: publicUser(user) };
      }, { auth: false }),
    register: ({ name, email, password, role }) =>
      run((db) => {
        required(name, 'Enter your full name');
        const address = required(email, 'Enter a valid email address').toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(address)) throw new ApiError(400, 'Enter a valid email address');
        if (!password || password.length < 8) throw new ApiError(400, 'Use at least 8 characters');
        if (db.users.some((user) => user.email === address)) throw new ApiError(409, 'An account with this email already exists');
        const user = {
          id: nextId(db, 'user'), name: name.trim(), email: address, password, role: role === 'mentor' ? 'mentor' : 'student',
          bio: '', avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)], createdAt: new Date().toISOString()
        };
        db.users.push(user);
        return { token: `mock.${user.id}`, user: publicUser(user) };
      }, { auth: false }),
    me: () => run((db, user) => publicUser(user))
  },
  users: {
    list: (params = {}) =>
      run((db) =>
        db.users
          .filter((user) => (!params.role || user.role === params.role) && (!params.search || `${user.name} ${user.email}`.toLowerCase().includes(params.search.toLowerCase())))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(publicUser)
      ),
    updateMe: (data) =>
      run((db, user) => {
        if (data.name !== undefined) user.name = required(data.name, 'Enter your full name');
        if (data.bio !== undefined) user.bio = data.bio.trim().slice(0, 400);
        if (data.avatarColor !== undefined) user.avatarColor = data.avatarColor;
        return publicUser(user);
      }),
    changePassword: ({ currentPassword, newPassword }) =>
      run((db, user) => {
        if (user.password !== currentPassword) throw new ApiError(400, 'Your current password is incorrect');
        if (!newPassword || newPassword.length < 8) throw new ApiError(400, 'Use at least 8 characters');
        user.password = newPassword;
        return { message: 'Password updated' };
      }),
    setRole: (id, role) =>
      run((db, user) => {
        if (user.role !== 'admin') throw new ApiError(403, 'You do not have permission to do that');
        if (id === user.id) throw new ApiError(400, 'You cannot change your own role');
        const target = db.users.find((item) => item.id === id);
        if (!target) throw new ApiError(404, 'User not found');
        target.role = role;
        return publicUser(target);
      }),
    remove: (id) =>
      run((db, user) => {
        if (user.role !== 'admin') throw new ApiError(403, 'You do not have permission to do that');
        if (id === user.id) throw new ApiError(400, 'You cannot delete your own account');
        db.users = db.users.filter((item) => item.id !== id);
        db.projects = db.projects.filter((project) => project.ownerId !== id);
        const alive = new Set(db.projects.map((project) => project.id));
        db.projects.forEach((project) => { if (project.mentorId === id) project.mentorId = null; });
        db.members = db.members.filter((member) => member.userId !== id && alive.has(member.projectId));
        db.tasks = db.tasks.filter((task) => alive.has(task.projectId));
        db.tasks.forEach((task) => { if (task.assigneeId === id) task.assigneeId = null; });
        db.comments = db.comments.filter((comment) => comment.userId !== id && db.tasks.some((task) => task.id === comment.taskId));
        db.notifications = db.notifications.filter((item) => item.userId !== id);
      })
  },
  projects: {
    list: (params = {}) =>
      run((db, user) =>
        visibleProjects(db, user)
          .filter((project) => (!params.status || project.status === params.status) &&
            (!params.search || `${project.title} ${project.description}`.toLowerCase().includes(params.search.toLowerCase())))
          .sort((a, b) => b.id - a.id)
          .map((project) => viewProject(db, project))
      ),
    get: (id) => run((db, user) => viewProject(db, projectAccess(db, user, id).project)),
    create: (data) =>
      run((db, user) => {
        const title = required(data.title, 'Give the project a title of at least 3 characters');
        if (title.length < 3) throw new ApiError(400, 'Give the project a title of at least 3 characters');
        let mentorId = data.mentorId ?? null;
        if (user.role !== 'student' && data.mentorId === undefined) mentorId = user.id;
        const project = {
          id: nextId(db, 'project'), title, description: (data.description || '').trim(), status: data.status || 'planning',
          ownerId: user.id, mentorId, dueDate: data.dueDate || null, createdAt: new Date().toISOString()
        };
        db.projects.push(project);
        [...new Set([user.id, ...(data.memberIds || [])])].forEach((userId) => db.members.push({ projectId: project.id, userId }));
        notify(db, [mentorId, ...(data.memberIds || [])], { type: 'project', message: `${user.name} added you to "${title}"`, link: `/projects/${project.id}` }, user.id);
        return viewProject(db, project);
      }),
    update: (id, data) =>
      run((db, user) => {
        const { project, canManage } = projectAccess(db, user, id);
        if (!canManage) throw new ApiError(403, 'Only the project owner or mentor can edit this project');
        ['title', 'description', 'status', 'dueDate', 'mentorId'].forEach((key) => {
          if (data[key] !== undefined) project[key] = data[key];
        });
        return viewProject(db, project);
      }),
    remove: (id) =>
      run((db, user) => {
        const { project, canDelete } = projectAccess(db, user, id);
        if (!canDelete) throw new ApiError(403, 'Only the project owner can delete this project');
        db.projects = db.projects.filter((item) => item.id !== project.id);
        db.members = db.members.filter((member) => member.projectId !== project.id);
        const gone = new Set(db.tasks.filter((task) => task.projectId === project.id).map((task) => task.id));
        db.tasks = db.tasks.filter((task) => task.projectId !== project.id);
        db.comments = db.comments.filter((comment) => !gone.has(comment.taskId));
      }),
    addMember: (id, userId) =>
      run((db, user) => {
        const { project, canManage } = projectAccess(db, user, id);
        if (!canManage) throw new ApiError(403, 'Only the project owner or mentor can manage the team');
        if (!db.users.some((item) => item.id === userId)) throw new ApiError(404, 'User not found');
        if (!db.members.some((member) => member.projectId === project.id && member.userId === userId)) {
          db.members.push({ projectId: project.id, userId });
        }
        notify(db, [userId], { type: 'project', message: `${user.name} added you to "${project.title}"`, link: `/projects/${project.id}` }, user.id);
        return viewProject(db, project);
      }),
    removeMember: (id, userId) =>
      run((db, user) => {
        const { project, canManage } = projectAccess(db, user, id);
        if (!canManage) throw new ApiError(403, 'Only the project owner or mentor can manage the team');
        if (userId === project.ownerId) throw new ApiError(400, 'The project owner cannot be removed');
        db.members = db.members.filter((member) => !(member.projectId === project.id && member.userId === userId));
        db.tasks.forEach((task) => { if (task.projectId === project.id && task.assigneeId === userId) task.assigneeId = null; });
        return viewProject(db, project);
      })
  },
  tasks: {
    list: (params = {}) =>
      run((db, user) => {
        const term = params.search?.toLowerCase();
        return visibleTasks(db, user).filter(
          (task) =>
            (!params.projectId || task.projectId === Number(params.projectId)) &&
            (!params.status || task.status === params.status) &&
            (!params.priority || task.priority === params.priority) &&
            (!params.assignee ||
              (params.assignee === 'me' ? task.assigneeId === user.id : params.assignee === 'none' ? !task.assigneeId : task.assigneeId === Number(params.assignee))) &&
            (!term || `${task.title} ${task.description}`.toLowerCase().includes(term))
        );
      }),
    create: (data) =>
      run((db, user) => {
        const { project } = projectAccess(db, user, data.projectId);
        const title = required(data.title, 'Give the task a title');
        assertAssignable(db, project.id, data.assigneeId ?? null);
        const status = data.status || 'todo';
        const column = db.tasks.filter((task) => task.projectId === project.id && task.status === status);
        const now = new Date().toISOString();
        const task = {
          id: nextId(db, 'task'), projectId: project.id, title, description: (data.description || '').trim(), status,
          priority: data.priority || 'medium', assigneeId: data.assigneeId ?? null, createdBy: user.id, dueDate: data.dueDate || null,
          position: column.length ? Math.max(...column.map((item) => item.position)) + 1 : 0, createdAt: now, updatedAt: now
        };
        db.tasks.push(task);
        notify(db, [task.assigneeId], { type: 'assignment', message: `${user.name} assigned you "${title}"`, link: `/projects/${project.id}?task=${task.id}` }, user.id);
        return viewTask(db, task);
      }),
    update: (id, data) =>
      run((db, user) => {
        const task = db.tasks.find((item) => item.id === Number(id));
        if (!task) throw new ApiError(404, 'Task not found');
        projectAccess(db, user, task.projectId);
        if (data.title !== undefined) task.title = required(data.title, 'Give the task a title');
        if (data.assigneeId !== undefined) assertAssignable(db, task.projectId, data.assigneeId);
        const previous = { status: task.status, assigneeId: task.assigneeId };
        ['description', 'priority', 'assigneeId', 'dueDate'].forEach((key) => {
          if (data[key] !== undefined) task[key] = data[key];
        });
        if (data.status !== undefined && data.status !== task.status) {
          const column = db.tasks.filter((item) => item.projectId === task.projectId && item.status === data.status);
          task.status = data.status;
          task.position = column.length ? Math.max(...column.map((item) => item.position)) + 1 : 0;
        }
        task.updatedAt = new Date().toISOString();
        const link = `/projects/${task.projectId}?task=${task.id}`;
        if (task.assigneeId && task.assigneeId !== previous.assigneeId) {
          notify(db, [task.assigneeId], { type: 'assignment', message: `${user.name} assigned you "${task.title}"`, link }, user.id);
        }
        if (task.status === 'done' && previous.status !== 'done') {
          const { ownerId, mentorId } = people(db, task.projectId);
          notify(db, [ownerId, mentorId, task.assigneeId], { type: 'status', message: `${user.name} marked "${task.title}" as done`, link }, user.id);
        }
        return viewTask(db, task);
      }),
    move: (id, { status, index }) =>
      run((db, user) => {
        const task = db.tasks.find((item) => item.id === Number(id));
        if (!task) throw new ApiError(404, 'Task not found');
        projectAccess(db, user, task.projectId);
        const wasDone = task.status === 'done';
        const ids = db.tasks
          .filter((item) => item.projectId === task.projectId && item.status === status && item.id !== task.id)
          .sort((a, b) => a.position - b.position || a.id - b.id)
          .map((item) => item.id);
        ids.splice(Math.min(index ?? 0, ids.length), 0, task.id);
        normalizePositions(db, status, ids);
        task.updatedAt = new Date().toISOString();
        if (status === 'done' && !wasDone) {
          const { ownerId, mentorId } = people(db, task.projectId);
          notify(db, [ownerId, mentorId, task.assigneeId], { type: 'status', message: `${user.name} marked "${task.title}" as done`, link: `/projects/${task.projectId}?task=${task.id}` }, user.id);
        }
        return viewTask(db, task);
      }),
    remove: (id) =>
      run((db, user) => {
        const task = db.tasks.find((item) => item.id === Number(id));
        if (!task) throw new ApiError(404, 'Task not found');
        const { canManage } = projectAccess(db, user, task.projectId);
        if (!canManage && task.createdBy !== user.id) throw new ApiError(403, 'Only the task creator, project owner or mentor can delete this task');
        db.tasks = db.tasks.filter((item) => item.id !== task.id);
        db.comments = db.comments.filter((comment) => comment.taskId !== task.id);
      })
  },
  comments: {
    list: (taskId) =>
      run((db, user) => {
        const task = db.tasks.find((item) => item.id === Number(taskId));
        if (!task) throw new ApiError(404, 'Task not found');
        projectAccess(db, user, task.projectId);
        return db.comments
          .filter((comment) => comment.taskId === task.id)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          .map((comment) => {
            const author = db.users.find((item) => item.id === comment.userId);
            return { ...comment, userName: author?.name, userRole: author?.role, avatarColor: author?.avatarColor };
          });
      }),
    add: (taskId, body) =>
      run((db, user) => {
        const task = db.tasks.find((item) => item.id === Number(taskId));
        if (!task) throw new ApiError(404, 'Task not found');
        projectAccess(db, user, task.projectId);
        const text = required(body, 'Write a comment first');
        const comment = { id: nextId(db, 'comment'), taskId: task.id, userId: user.id, body: text.slice(0, 1500), createdAt: new Date().toISOString() };
        db.comments.push(comment);
        const { ownerId, mentorId } = people(db, task.projectId);
        notify(db, [task.assigneeId, ownerId, mentorId], { type: 'comment', message: `${user.name} commented on "${task.title}"`, link: `/projects/${task.projectId}?task=${task.id}` }, user.id);
        return { ...comment, userName: user.name, userRole: user.role, avatarColor: user.avatarColor };
      }),
    remove: (id) =>
      run((db, user) => {
        const comment = db.comments.find((item) => item.id === Number(id));
        if (!comment) throw new ApiError(404, 'Comment not found');
        if (comment.userId !== user.id && user.role !== 'admin') throw new ApiError(403, 'You can only delete your own comments');
        db.comments = db.comments.filter((item) => item.id !== comment.id);
      })
  },
  notifications: {
    list: () =>
      run((db, user) => {
        const list = db.notifications.filter((item) => item.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
        return { notifications: list, unread: list.filter((item) => !item.read).length };
      }),
    markRead: (id) =>
      run((db, user) => {
        const item = db.notifications.find((entry) => entry.id === Number(id) && entry.userId === user.id);
        if (!item) throw new ApiError(404, 'Notification not found');
        item.read = true;
        return { notification: item };
      }),
    markAllRead: () =>
      run((db, user) => {
        db.notifications.forEach((item) => { if (item.userId === user.id) item.read = true; });
        return { message: 'All notifications marked as read' };
      }),
    remove: (id) =>
      run((db, user) => {
        db.notifications = db.notifications.filter((item) => !(item.id === Number(id) && item.userId === user.id));
      })
  },
  analytics: {
    overview: () =>
      run((db, user) => {
        const projects = visibleProjects(db, user);
        const tasks = visibleTasks(db, user);
        return computeOverview({ projects, tasks, users: db.users }, user);
      })
  },
  resetDemo: () => {
    localStorage.removeItem(DB_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }
};
