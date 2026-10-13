import { toISODate } from '../lib/dates.js';

const dayOffset = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toISODate(date);
};

const ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();

export const DEMO_PASSWORD = 'Password123!';

export function createSeed() {
  const users = [
    [1, 'Sam Rivera', 'admin@projectflow.dev', 'admin', '#475569', 'Program coordinator keeping every cohort on track.'],
    [2, 'Dr. Priya Nair', 'mentor@projectflow.dev', 'mentor', '#8B5CF6', 'Software engineering lecturer. Office hours on Thursdays.'],
    [3, 'Marcus Bell', 'marcus@projectflow.dev', 'mentor', '#D97706', 'Industry mentor with a background in embedded systems.'],
    [4, 'Aisha Khan', 'student@projectflow.dev', 'student', '#0E7C7B', 'Second year computer science student who loves clean interfaces.'],
    [5, 'Leo Martins', 'leo@projectflow.dev', 'student', '#2F80ED', 'Backend tinkerer and data enthusiast.'],
    [6, 'Mei Tanaka', 'mei@projectflow.dev', 'student', '#EF6351', 'Designer who codes. Figma first, then React.'],
    [7, 'Omar Haddad', 'omar@projectflow.dev', 'student', '#16A37F', 'Robotics club captain and part time barista.']
  ].map(([id, name, email, role, avatarColor, bio]) => ({
    id, name, email, role, avatarColor, bio, password: DEMO_PASSWORD, createdAt: ago(60 * 24 * 60)
  }));

  const projectRows = [
    [1, 'Campus Bike Share App', 'A mobile friendly web app that lets students find, unlock and return shared bikes across campus, with live availability and ride history.', 'active', 4, 2, 32, [4, 5, 6]],
    [2, 'Climate Data Dashboard', 'Interactive charts built from open weather datasets so first year students can explore local climate trends.', 'active', 5, 2, 18, [5, 7]],
    [3, 'Library Seat Finder', 'Real time study seat availability for the main library, with floor maps and quiet zone filters.', 'planning', 6, 3, 55, [6, 4]],
    [4, 'Robotics Club Website', 'A public site for the robotics club with event pages, sponsor logos and a build log.', 'completed', 7, 3, -6, [7, 5]],
    [5, 'Peer Tutoring Matcher', 'Match students who need help with peers who have aced the same module.', 'on_hold', 4, 3, 70, [4, 7]]
  ];

  const projects = projectRows.map(([id, title, description, status, ownerId, mentorId, due]) => ({
    id, title, description, status, ownerId, mentorId, dueDate: dayOffset(due), createdAt: ago(60 * 24 * 30)
  }));

  const members = projectRows.flatMap(([id, , , , , , , list]) => list.map((userId) => ({ projectId: id, userId })));

  const taskRows = [
    [1, 'Sketch the three core screens', 'Map, ride in progress and ride summary. Low fidelity is fine.', 'done', 'high', 6, -9],
    [1, 'Design the bike availability API', 'Agree on endpoints and payloads with the backend team.', 'done', 'high', 5, -6],
    [1, 'Build the map view with live markers', 'Use a free tile provider. Cluster markers when zoomed out.', 'in_progress', 'high', 4, 5],
    [1, 'QR code unlock flow', 'Scan a code on the bike and confirm the unlock within two seconds.', 'in_progress', 'medium', 5, 9],
    [1, 'Write validation for ride start and end', 'Reject overlapping rides and negative durations.', 'review', 'medium', 5, 3],
    [1, 'Ride history page', 'List past rides with distance and duration.', 'todo', 'medium', 6, 14],
    [1, 'Accessibility pass on the map controls', 'Keyboard navigation and screen reader labels.', 'todo', 'low', 4, 20],
    [1, 'Deployment notes', 'Document environment variables and the release checklist.', 'todo', 'low', 4, 27],
    [2, 'Pick three open datasets', 'Temperature, rainfall and air quality for the last decade.', 'done', 'medium', 5, -8],
    [2, 'Clean and normalise the CSV files', 'Handle missing values and unify date formats.', 'done', 'high', 7, -4],
    [2, 'Line chart with a year range slider', 'Smooth transitions when the range changes.', 'review', 'high', 5, 2],
    [2, 'Compare two cities side by side', 'Let people pick cities from a searchable list.', 'in_progress', 'medium', 7, 6],
    [2, 'Explain the data sources in plain language', 'A short methods panel that first years can follow.', 'todo', 'low', 7, 12],
    [2, 'Performance check on large datasets', 'Aim for a first render under two seconds.', 'todo', 'high', 5, -2],
    [3, 'Interview five students about study habits', 'Capture peak hours and what makes a seat good.', 'in_progress', 'high', 6, 4],
    [3, 'Draft the user journey map', 'Arrive, search, claim a seat, leave.', 'todo', 'medium', 4, 10],
    [3, 'Choose sensor or manual check in', 'Compare cost, accuracy and privacy.', 'todo', 'high', 6, 16],
    [3, 'Floor plan illustrations', 'Simple vector plans for floors one to three.', 'todo', 'low', 6, 30],
    [4, 'Homepage and navigation', 'Hero with the latest robot and a clear menu.', 'done', 'high', 7, -20],
    [4, 'Event calendar page', 'Upcoming competitions with add to calendar links.', 'done', 'medium', 5, -14],
    [4, 'Sponsor logo wall', 'Grayscale logos that colour on focus.', 'done', 'low', 7, -12],
    [4, 'Final QA and launch', 'Cross browser testing and DNS switch.', 'done', 'high', 5, -7],
    [5, 'Define matching criteria', 'Module, grade band and availability windows.', 'in_progress', 'medium', 4, 25],
    [5, 'Prototype the request form', 'Three fields, one clear button.', 'todo', 'low', 7, 40],
    [5, 'Ask the faculty about data access', 'We need grade band data with consent.', 'todo', 'high', 4, 35]
  ];

  const positions = {};
  const tasks = taskRows.map(([projectId, title, description, status, priority, assigneeId, due], index) => {
    const key = `${projectId}:${status}`;
    const position = positions[key] ?? 0;
    positions[key] = position + 1;
    const createdAgo = (index * 3) % 12;
    const updatedAgo = status === 'done' ? Math.min(createdAgo, index % 7) : Math.min(createdAgo, index % 4);
    return {
      id: index + 1, projectId, title, description, status, priority, assigneeId, createdBy: assigneeId,
      dueDate: dayOffset(due), position, createdAt: ago(createdAgo * 1440), updatedAt: ago(updatedAgo * 1440)
    };
  });

  const comments = [
    [3, 2, 'Please cluster markers before adding more layers. Performance matters on older phones.', 30],
    [3, 4, 'Agreed. I am testing supercluster now and will share numbers tomorrow.', 22],
    [5, 2, 'Good coverage. Add a test for a ride that crosses midnight.', 14],
    [5, 5, 'Added, and it caught an off by one in the duration calculation.', 9],
    [11, 2, 'The slider feels great. Can the tooltip show the year on touch devices too?', 6],
    [15, 3, 'Try to include at least one student who studies off campus.', 40],
    [4, 4, 'The camera permission prompt is confusing on Safari. Investigating a fallback.', 5],
    [14, 5, 'Profiling shows the parsing step is the slow part. Moving it to a worker.', 3]
  ].map(([taskId, userId, body, hours], index) => ({ id: index + 1, taskId, userId, body, createdAt: ago(hours * 60) }));

  const notifications = [
    [4, 'comment', 'Dr. Priya Nair commented on "Build the map view with live markers"', '/projects/1?task=3', false, 45],
    [4, 'assignment', 'Leo Martins assigned you "Deployment notes"', '/projects/1?task=8', false, 300],
    [4, 'status', 'Mei Tanaka marked "Sketch the three core screens" as done', '/projects/1?task=1', true, 1500],
    [4, 'project', 'Marcus Bell is now mentoring "Peer Tutoring Matcher"', '/projects/5', true, 4200],
    [2, 'comment', 'Aisha Khan commented on "Build the map view with live markers"', '/projects/1?task=3', false, 20],
    [2, 'status', 'Leo Martins moved "Line chart with a year range slider" to review', '/projects/2?task=11', false, 120],
    [1, 'project', 'Mei Tanaka created "Library Seat Finder"', '/projects/3', true, 2800]
  ].map(([userId, type, message, link, read, minutes], index) => ({
    id: index + 1, userId, type, message, link, read, createdAt: ago(minutes)
  }));

  return { users, projects, members, tasks, comments, notifications, seq: { user: 8, project: 6, task: taskRows.length + 1, comment: comments.length + 1, notification: notifications.length + 1 } };
}
