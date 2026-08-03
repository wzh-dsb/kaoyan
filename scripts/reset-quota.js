// 开发者工具:重置今日 AI 配额(统计页生成周报次数用完时用)
// 用法:cd kaoyan-desk && node scripts/reset-quota.js [YYYY-MM-DD]
// 说明:dev server 运行时也可执行(WAL 模式,短暂写入无冲突)
const Database = require('better-sqlite3')
const path = require('path')

const today =
  process.argv[2] ??
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date())

const db = new Database(path.join(__dirname, '..', 'dev.db'), { timeout: 8000 })

console.log(`== 重置前(日期 ${today}) ==`)
const before = db.prepare('SELECT userId, feature, count, extra FROM AiUsage WHERE date = ?').all(today)
console.table(before)

const res = db.prepare('UPDATE AiUsage SET count = 0, extra = 0 WHERE date = ?').run(today)
console.log(`已重置 ${res.changes} 条记录`)

console.log('== 重置后 ==')
console.table(db.prepare('SELECT userId, feature, count, extra FROM AiUsage WHERE date = ?').all(today))
db.close()
