'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { MISTAKE_REASONS, MISTAKE_SUBJECTS } from '@/lib/constants'

export async function addMistake(formData: FormData) {
  const user = await requireUser()
  const subject = String(formData.get('subject') ?? '')
  const reason = String(formData.get('reason') ?? '')
  const question = String(formData.get('question') ?? '').trim()
  const chapter = String(formData.get('chapter') ?? '').trim() || null
  const solution = String(formData.get('solution') ?? '').trim() || null

  if (!MISTAKE_SUBJECTS.includes(subject)) return
  if (!MISTAKE_REASONS.includes(reason as (typeof MISTAKE_REASONS)[number])) return
  if (!question) return

  await prisma.mistake.create({
    data: { userId: user.id, subject, reason, question, chapter, solution },
  })
  revalidatePath('/mock/mistakes')
}

export async function deleteMistake(formData: FormData) {
  const user = await requireUser()
  const id = String(formData.get('id') ?? '')
  const mistake = await prisma.mistake.findUnique({ where: { id } })
  if (!mistake || mistake.userId !== user.id) return

  await prisma.mistake.delete({ where: { id } })
  revalidatePath('/mock/mistakes')
}
