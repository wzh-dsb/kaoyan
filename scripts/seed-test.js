// 注入测试数据(本地开发用):测试用户 + 示例任务/打卡/模考/专注
// 用法:node scripts/seed-test.js
const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
const path = require('path')

const db = new Database(path.join(__dirname, '..', 'dev.db'))
db.pragma('journal_mode = WAL')

const email = 'test@example.com'
let user = db.prepare('SELECT * FROM User WHERE email = ?').get(email)
if (!user) {
  const hash = bcrypt.hashSync('123456', 10)
  db.prepare('INSERT INTO User (id, email, passwordHash, createdAt) VALUES (?, ?, ?, ?)').run(
    'user_test_001',
    email,
    hash,
    new Date().toISOString(),
  )
  user = db.prepare('SELECT * FROM User WHERE email = ?').get(email)
}
console.log('user:', user.id)

const token = 'test-session-' + Math.random().toString(36).slice(2)
const expires = new Date(Date.now() + 30 * 864e5).toISOString()
db.prepare('INSERT INTO Session (token, userId, expiresAt, createdAt) VALUES (?, ?, ?, ?)').run(
  token,
  user.id,
  expires,
  new Date().toISOString(),
)
console.log('SESSION_TOKEN=' + token)

const today = '2026-08-01'
const ins = (sql, ...args) => db.prepare(sql).run(...args)
ins(
  'INSERT OR IGNORE INTO Task (id, userId, title, subject, planDate, pomodoros, done, sortOrder, createdAt) VALUES (?,?,?,?,?,?,?,?,?)',
  't1',
  user.id,
  '英语真题阅读 Text1 精读',
  '英语',
  today,
  2,
  0,
  1,
  new Date().toISOString(),
)
ins(
  'INSERT OR IGNORE INTO Task (id, userId, title, subject, planDate, pomodoros, done, sortOrder, createdAt) VALUES (?,?,?,?,?,?,?,?,?)',
  't2',
  user.id,
  '政治马原第二章背诵',
  '政治',
  today,
  1,
  0,
  2,
  new Date().toISOString(),
)
ins('INSERT OR IGNORE INTO Habit (id, userId, name, createdAt) VALUES (?,?,?,?)', 'h1', user.id, '背 100 个单词', new Date().toISOString())
ins('INSERT OR IGNORE INTO HabitLog (id, habitId, userId, date) VALUES (?,?,?,?)', 'hl1', 'h1', user.id, today)
ins(
  'INSERT OR IGNORE INTO MockExam (id, userId, examDate, name, subject, score, total, note, createdAt) VALUES (?,?,?,?,?,?,?,?,?)',
  'm1',
  user.id,
  '2026-07-20',
  '2024年英语真题一',
  '英语',
  62,
  100,
  '阅读失分多,精读要继续',
  new Date().toISOString(),
)
ins(
  'INSERT OR IGNORE INTO MockExam (id, userId, examDate, name, subject, score, total, note, createdAt) VALUES (?,?,?,?,?,?,?,?,?)',
  'm2',
  user.id,
  '2026-07-27',
  '2024年政治真题',
  '政治',
  58,
  100,
  null,
  new Date().toISOString(),
)
ins('INSERT OR IGNORE INTO FocusSession (id, userId, durationMin, startedAt) VALUES (?,?,?,?)', 'f1', user.id, 25, new Date().toISOString())
ins(
  'INSERT OR IGNORE INTO FocusSession (id, userId, subject, durationMin, startedAt) VALUES (?,?,?,?,?)',
  'f2',
  user.id,
  '数学',
  45,
  new Date(Date.now() - 3600e3).toISOString(),
)
ins(
  'INSERT OR IGNORE INTO FocusSession (id, userId, subject, durationMin, startedAt) VALUES (?,?,?,?,?)',
  'f3',
  user.id,
  '英语',
  25,
  new Date(Date.now() - 7200e3).toISOString(),
)

// 阶段计划示例(幂等)
ins(
  'INSERT OR IGNORE INTO Phase (id, userId, name, startDate, endDate, color, sortOrder, createdAt) VALUES (?,?,?,?,?,?,?,?)',
  'ph1', user.id, '基础期', '2026-04-01', '2026-06-30', '#6366f1', 0, new Date().toISOString(),
)
ins(
  'INSERT OR IGNORE INTO Phase (id, userId, name, startDate, endDate, color, sortOrder, createdAt) VALUES (?,?,?,?,?,?,?,?)',
  'ph2', user.id, '强化期', '2026-07-01', '2026-09-30', '#8b5cf6', 1, new Date().toISOString(),
)
ins(
  'INSERT OR IGNORE INTO Phase (id, userId, name, startDate, endDate, color, sortOrder, createdAt) VALUES (?,?,?,?,?,?,?,?)',
  'ph3', user.id, '冲刺期', '2026-10-01', '2026-12-19', '#ef4444', 2, new Date().toISOString(),
)

console.log('seed done')
db.close()
