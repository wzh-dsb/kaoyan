import { prisma } from '@/lib/prisma'
import { todayStr } from '@/lib/date'

// AI 功能每用户每日基础配额(可用环境变量覆盖)
export const AI_LIMITS = {
  report: Number(process.env.AI_REPORT_DAILY_LIMIT ?? 3), // AI 周报:每天 3 次
  ocr: Number(process.env.AI_OCR_DAILY_LIMIT ?? 20), // 错题识别:每天 20 张
} as const

export type AiFeature = keyof typeof AI_LIMITS

/** 查询今日剩余次数(基础额度 + 额外解锁 - 已消耗) */
export async function getAiRemaining(userId: string, feature: AiFeature): Promise<number> {
  const limit = AI_LIMITS[feature]
  const usage = await prisma.aiUsage.findUnique({
    where: {
      userId_feature_date: { userId, feature, date: todayStr() },
    },
  })
  if (!usage) return limit
  return Math.max(0, limit + usage.extra - usage.count)
}

/** 消耗一次配额。返回 { ok, remaining }:ok=false 表示今日额度已用完 */
export async function consumeAiQuota(
  userId: string,
  feature: AiFeature,
): Promise<{ ok: boolean; remaining: number }> {
  const limit = AI_LIMITS[feature]
  const today = todayStr()

  const usage = await prisma.aiUsage.upsert({
    where: { userId_feature_date: { userId, feature, date: today } },
    update: {},
    create: { userId, feature, date: today, count: 0, extra: 0 },
  })

  if (usage.count >= limit + usage.extra) return { ok: false, remaining: 0 }

  const updated = await prisma.aiUsage.update({
    where: { id: usage.id },
    data: { count: { increment: 1 } },
  })
  return { ok: true, remaining: Math.max(0, limit + updated.extra - updated.count) }
}

/**
 * 增加当日额外额度(变现入口:看激励视频解锁次数等)。
 * 调用方需自行校验来源可信度(如广告播放完成回调)。
 */
export async function grantAiQuota(
  userId: string,
  feature: AiFeature,
  amount = 1,
): Promise<number> {
  const today = todayStr()
  const usage = await prisma.aiUsage.upsert({
    where: { userId_feature_date: { userId, feature, date: today } },
    update: {},
    create: { userId, feature, date: today, count: 0, extra: 0 },
  })
  const updated = await prisma.aiUsage.update({
    where: { id: usage.id },
    data: { extra: { increment: amount } },
  })
  return Math.max(0, AI_LIMITS[feature] + updated.extra - updated.count)
}
