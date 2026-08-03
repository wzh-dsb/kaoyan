'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'

export async function saveFocus(formData: FormData) {
  const user = await requireUser()
  const durationMin = Math.min(
    240,
    Math.max(1, Number(formData.get('durationMin')) || 25),
  )
  const subject = String(formData.get('subject') ?? '').trim() || null
  const taskId = String(formData.get('taskId') ?? '') || null

  await prisma.focusSession.create({
    data: { userId: user.id, durationMin, subject, taskId },
  })
  revalidatePath('/')
  revalidatePath('/focus')
}
