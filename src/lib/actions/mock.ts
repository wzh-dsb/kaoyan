'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'

const SUBJECTS = ['政治', '英语', '数学', '专业课']

export async function addMockExam(formData: FormData) {
  const user = await requireUser()
  const examDate = String(formData.get('examDate') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const subject = String(formData.get('subject') ?? '')
  const score = Number(formData.get('score'))
  const total = Number(formData.get('total')) || 100
  const note = String(formData.get('note') ?? '').trim() || null

  if (!examDate || !name || !SUBJECTS.includes(subject)) return
  if (!Number.isFinite(score) || score < 0) return

  await prisma.mockExam.create({
    data: { userId: user.id, examDate, name, subject, score, total, note },
  })
  revalidatePath('/mock')
}

export async function deleteMockExam(formData: FormData) {
  const user = await requireUser()
  const id = String(formData.get('id') ?? '')
  const exam = await prisma.mockExam.findUnique({ where: { id } })
  if (!exam || exam.userId !== user.id) return

  await prisma.mockExam.delete({ where: { id } })
  revalidatePath('/mock')
}
