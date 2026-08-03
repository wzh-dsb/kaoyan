'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { todayStr } from '@/lib/date'

export async function addHabit(formData: FormData) {
  const user = await requireUser()
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return

  await prisma.habit.create({ data: { userId: user.id, name } })
  revalidatePath('/')
}

export async function toggleHabit(formData: FormData) {
  const user = await requireUser()
  const id = String(formData.get('id') ?? '')
  const habit = await prisma.habit.findUnique({ where: { id } })
  if (!habit || habit.userId !== user.id) return

  const today = todayStr()
  const existing = await prisma.habitLog.findUnique({
    where: { habitId_date: { habitId: id, date: today } },
  })
  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } })
  } else {
    await prisma.habitLog.create({ data: { habitId: id, userId: user.id, date: today } })
  }
  revalidatePath('/')
}

export async function deleteHabit(formData: FormData) {
  const user = await requireUser()
  const id = String(formData.get('id') ?? '')
  const habit = await prisma.habit.findUnique({ where: { id } })
  if (!habit || habit.userId !== user.id) return

  await prisma.habit.delete({ where: { id } })
  revalidatePath('/')
}
