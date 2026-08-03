'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'

export type ProfileState = { ok?: boolean; error?: string } | null

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser()
  const examDateRaw = String(formData.get('examDate') ?? '')
  const targetSchool = String(formData.get('targetSchool') ?? '').trim() || null
  const targetMajor = String(formData.get('targetMajor') ?? '').trim() || null
  const nickname = String(formData.get('nickname') ?? '').trim() || null

  const examDate = examDateRaw ? new Date(examDateRaw + 'T00:00:00+08:00') : null

  await prisma.user.update({
    where: { id: user.id },
    data: { examDate, targetSchool, targetMajor, nickname },
  })
  revalidatePath('/')
  revalidatePath('/settings')
  return { ok: true }
}
