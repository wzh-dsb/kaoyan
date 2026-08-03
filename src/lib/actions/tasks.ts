'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { todayStr } from '@/lib/date'

export async function addTask(formData: FormData) {
  const user = await requireUser()
  const title = String(formData.get('title') ?? '').trim()
  if (!title) return
  const subject = String(formData.get('subject') ?? '').trim() || null
  const pomodoros = Math.max(1, Number(formData.get('pomodoros')) || 1)

  await prisma.task.create({
    data: {
      userId: user.id,
      title,
      subject,
      pomodoros,
      planDate: todayStr(),
      sortOrder: Date.now(),
    },
  })
  revalidatePath('/')
}

/** 添加到指定日期(计划页用) */
export async function addTaskOnDate(formData: FormData) {
  const user = await requireUser()
  const title = String(formData.get('title') ?? '').trim()
  if (!title) return
  const planDate = String(formData.get('planDate') ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(planDate)) return
  const subject = String(formData.get('subject') ?? '').trim() || null

  await prisma.task.create({
    data: { userId: user.id, title, subject, planDate, sortOrder: Date.now() },
  })
  revalidatePath('/plan')
}

/** 把指定日期(通常是过去)的未完成任务顺延到今天 */
export async function carryOverTasks(formData: FormData) {
  const user = await requireUser()
  const fromDate = String(formData.get('fromDate') ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) return
  const today = todayStr()

  await prisma.task.updateMany({
    where: { userId: user.id, planDate: fromDate, done: false },
    data: { planDate: today, sortOrder: Date.now() },
  })
  revalidatePath('/plan')
  revalidatePath('/')
}

export async function toggleTask(formData: FormData) {
  const user = await requireUser()
  const id = String(formData.get('id') ?? '')
  const task = await prisma.task.findUnique({ where: { id } })
  if (!task || task.userId !== user.id) return

  await prisma.task.update({ where: { id }, data: { done: !task.done } })
  revalidatePath('/')
}

export async function deleteTask(formData: FormData) {
  const user = await requireUser()
  const id = String(formData.get('id') ?? '')
  const task = await prisma.task.findUnique({ where: { id } })
  if (!task || task.userId !== user.id) return

  await prisma.task.delete({ where: { id } })
  revalidatePath('/')
}
