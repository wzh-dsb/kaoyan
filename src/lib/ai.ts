// AI 服务层:通过 OpenAI 兼容接口调用国内大模型
// 文本模型:DeepSeek(默认)  视觉模型:阿里云百炼 qwen-vl(默认)
// 环境变量:
//   AI_API_KEY / AI_BASE_URL / AI_MODEL        — 文本
//   AI_VISION_API_KEY / AI_VISION_BASE_URL / AI_VISION_MODEL — 视觉

const TEXT_KEY = process.env.AI_API_KEY
const TEXT_BASE = process.env.AI_BASE_URL ?? 'https://api.deepseek.com/v1'
const TEXT_MODEL = process.env.AI_MODEL ?? 'deepseek-chat'

// 视觉配置:未单独配置时自动复用文本配置(支持"一个 key 多模态"的模型服务商)
const VISION_KEY = process.env.AI_VISION_API_KEY ?? TEXT_KEY
const VISION_BASE = process.env.AI_VISION_BASE_URL ?? TEXT_BASE
const VISION_MODEL =
  process.env.AI_VISION_MODEL ??
  (process.env.AI_VISION_API_KEY ? 'qwen-vl-plus' : process.env.AI_MODEL)

export const aiConfigured = Boolean(TEXT_KEY)
export const aiVisionConfigured = Boolean(VISION_KEY)

/** 文本对话(系统提示 + 用户内容),返回模型回复 */
export async function chatText(system: string, user: string): Promise<string> {
  if (!TEXT_KEY) throw new Error('AI 未配置:请在 .env 中设置 AI_API_KEY')
  const res = await fetch(`${TEXT_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TEXT_KEY}`,
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`AI 请求失败(${res.status}):${detail.slice(0, 200)}`)
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  return data.choices?.[0]?.message?.content ?? ''
}

/** 视觉识别(base64 图片 → 文字描述) */
export async function chatVision(imageBase64: string, prompt: string): Promise<string> {
  if (!VISION_KEY) throw new Error('AI 视觉未配置:请在 .env 中设置 AI_VISION_API_KEY')
  const res = await fetch(`${VISION_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${VISION_KEY}`,
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 1000,
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`AI 视觉请求失败(${res.status}):${detail.slice(0, 200)}`)
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  return data.choices?.[0]?.message?.content ?? ''
}
