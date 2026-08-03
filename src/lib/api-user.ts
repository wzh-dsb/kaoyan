import { getSession } from '@/lib/auth'

/** 小程序 API 鉴权:返回当前用户,未登录返回 null */
export async function apiUser() {
  const session = await getSession()
  return session?.user ?? null
}
