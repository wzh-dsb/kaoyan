'use client'

import { useEffect } from 'react'

/** 注册 Service Worker(仅生产环境,避免干扰开发热更新) */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  return null
}
