import { prisma } from '@/lib/prisma'
import { addDaysStr, thisWeekStart } from '@/lib/date'
import { chatText, aiConfigured } from '@/lib/ai'

export type ReportResult = { ok: true; report: string } | { ok: false; error: string }

/** 兜底清洗:去掉 AI 偶尔输出的 markdown 标记,保证纯文字展示(标题/加粗/列表/编号) */
function cleanReportText(text: string): string {
  return text
    .replace(/[#*`>]/g, '') // 标题、加粗、代码、引用符号
    .replace(/^[-–—·]\s*/gm, '') // 行首列表符号
    .replace(/^\s*\d{1,2}[.、)]\s+/gm, '') // 行首数字编号(仅限 1-2 位数字,避免误伤正文)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * 生成 AI 周报:汇总用户本周数据 + 上周对比,调用大模型。
 * 不处理配额(配额由调用方控制),把结果写库由调用方负责。
 */
export async function generateReportText(userId: string): Promise<ReportResult> {
  if (!aiConfigured) {
    return { ok: false, error: 'AI 未配置:请在 .env 中设置 AI_API_KEY 后重启服务' }
  }

  const weekStart = thisWeekStart()
  const prevWeekStart = addDaysStr(weekStart, -7)

  const [weekFocus, prevFocus, weekTasks, prevTasks, weekLogs, mockExams, mistakes] =
    await Promise.all([
      prisma.focusSession.findMany({
        where: { userId, startedAt: { gte: new Date(weekStart + 'T00:00:00+08:00') } },
      }),
      prisma.focusSession.findMany({
        where: {
          userId,
          startedAt: { gte: new Date(prevWeekStart + 'T00:00:00+08:00'), lt: new Date(weekStart + 'T00:00:00+08:00') },
        },
      }),
      prisma.task.findMany({ where: { userId, planDate: { gte: weekStart } } }),
      prisma.task.findMany({ where: { userId, planDate: { gte: prevWeekStart, lt: weekStart } } }),
      prisma.habitLog.findMany({ where: { userId, date: { gte: weekStart } } }),
      prisma.mockExam.findMany({ where: { userId }, orderBy: { examDate: 'desc' }, take: 10 }),
      prisma.mistake.findMany({ where: { userId, createdAt: { gte: new Date(weekStart + 'T00:00:00+08:00') } } }),
    ])

  const user = await prisma.user.findUnique({ where: { id: userId } })

  // 科目专注分布
  const subjectMinutes = new Map<string, number>()
  weekFocus.forEach((f) => {
    const key = f.subject || '未选科目'
    subjectMinutes.set(key, (subjectMinutes.get(key) ?? 0) + f.durationMin)
  })

  // 错因分布
  const reasonCounts = new Map<string, number>()
  mistakes.forEach((m) => reasonCounts.set(m.reason, (reasonCounts.get(m.reason) ?? 0) + 1))

  const weekTotal = weekFocus.reduce((s, f) => s + f.durationMin, 0)
  const weekDoneCount = weekTasks.filter((t) => t.done).length
  const weekRate = weekTasks.length > 0 ? Math.round((weekDoneCount / weekTasks.length) * 100) : 0
  const prevTotal = prevFocus.reduce((s, f) => s + f.durationMin, 0)
  const prevRate =
    prevTasks.length > 0
      ? Math.round((prevTasks.filter((t) => t.done).length / prevTasks.length) * 100)
      : 0

  const summary = {
    用户: user?.nickname || '考研人',
    目标院校: user?.targetSchool ?? '未设置',
    目标专业: user?.targetMajor ?? '未设置',
    本周: {
      专注总时长分钟: weekTotal,
      日均专注分钟: Math.round(weekTotal / 7),
      科目专注分布: Object.fromEntries(subjectMinutes),
      任务完成率百分比: weekRate,
      打卡天数: new Set(weekLogs.map((l) => l.date)).size,
      模考: mockExams
        .filter((e) => e.examDate >= weekStart)
        .map((e) => `${e.subject} ${e.name} ${e.score}/${e.total}`),
      新增错题: mistakes.length,
      错因分布: Object.fromEntries(reasonCounts),
    },
    上周: {
      专注总时长分钟: prevTotal,
      任务完成率百分比: prevRate,
    },
  }

  const system = `你是一位经验丰富的考研复习规划教练。根据用户本周学习数据写一份周报,内容按以下顺序展开,每段用换行分隔:
第一段:先肯定和鼓励用户本周的努力,再用两三句话总结本周整体表现(专注投入、任务执行、模考、错题情况)
第二段:对比上周,指出本周的变化(进步或下滑),进步就具体点赞,下滑就客观说明并打气
第三段:指出最需要关注的 1 到 2 个问题(结合数据,如某科专注少、错因集中、任务完成率低)
第四段:给出 3 条下周具体可执行的建议(针对数据,不要泛泛而谈)
最后一段:用积极温暖的话鼓励用户继续加油,真诚不敷衍
格式要求:不要任何标题、项目符号或 markdown 符号,不要出现 #、*、- 等字符,不要用数字编号,不要加粗;可以使用适当的表情符号(如 📚 💪 🎯)增强鼓励效果,直接写自然段落即可。全文 300 到 400 字。`

  try {
    const report = await chatText(system, JSON.stringify(summary, null, 2))
    return { ok: true, report: cleanReportText(report) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'AI 生成失败,请稍后重试' }
  }
}
