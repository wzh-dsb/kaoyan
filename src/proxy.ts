import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 乐观鉴权:只查 cookie 是否存在,真正的校验在服务端进行
export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get('session')?.value)
  const { pathname } = request.nextUrl
  const isAuthPage = pathname === '/login' || pathname === '/register'

  if (!hasSession && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|webmanifest|js|png|ico|css|txt)$).*)'],
}
