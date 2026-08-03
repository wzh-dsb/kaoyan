'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { diffDays } from '@/lib/date'

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#0ea5e9', '#ef4444']

export async function addPhase(formData: FormData) {
  const user = await requireUser()
  const name = String(formData.get('name') ?? '').trim()
  const startDate = String(formData.get('startDate') ?? '')
  const endDate = String(formData.get('endDate') ?? '')
  const color = String(formData.get('color') ?? '').trim()

  if (!name || !startDate || !endDate) return
  if (diffDays(endDate, startDate) < 0) return // 结束日期不能早于开始

  const count = await prisma.phase.count({ where: { userId: user.id } })
  await prisma.phase.create({
    data: {
      userId: user.id,
      name,
      startDate,
      endDate,
      color: COLORS.includes(color) ? color : null,
      sortOrder: count,
    },
  })
  revalidatePath('/plan')
}

export async function deletePhase(formData: FormData) {
  const user = await requireUser()
  const id = String(formData.get('id') ?? '')
  const phase = await prisma.phase.findUnique({ where: { id } })
  if (!phase || phase.userId !== user.id) return

  await prisma.phase.delete({ where: { id } })
  revalidatePath('/plan')
}
