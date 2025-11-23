import { NextRequest, NextResponse } from 'next/server'

const QWEN_API_KEY = process.env.QWEN_API_KEY
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY

interface OCRResult {
  amount: number
  category: string
  date: string
  description: string
  type: 'expense' | 'income'
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json(
        { error: '请提供图片数据' },
        { status: 400 }
      )
    }

    let result: OCRResult | null = null

    // Try Qwen VL first
    if (QWEN_API_KEY) {
      try {
        result = await callQwenVL(image)
        console.log('Qwen VL OCR result:', result)
      } catch (error) {
        console.error('Qwen VL failed:', error)
      }
    }

    // Fallback to Claude Vision
    if (!result && CLAUDE_API_KEY) {
      try {
        result = await callClaudeVision(image)
        console.log('Claude Vision OCR result:', result)
      } catch (error) {
        console.error('Claude Vision failed:', error)
      }
    }

    if (!result) {
      return NextResponse.json(
        { error: '无法识别图片，请确保配置了AI API密钥' },
        { status: 500 }
      )
    }

    // Validate result
    if (!result.amount || !result.category || !result.date) {
      return NextResponse.json(
        { error: '无法从图片中提取完整信息，请重试或手动输入' },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: result })
  } catch (error: any) {
    console.error('OCR error:', error)
    return NextResponse.json(
      { error: error.message || 'OCR识别失败' },
      { status: 500 }
    )
  }
}

async function callQwenVL(imageBase64: string): Promise<OCRResult | null> {
  const prompt = `
这是一张消费小票或发票的图片。请分析图片内容并提取以下信息：

要求：
1. 提取金额（单位：元）
2. 判断交易类型（支出还是收入）
3. 根据内容判断分类
4. 提取日期（如果有），否则使用今天的日期
5. 简短描述交易内容

支出分类：餐饮、交通、购物、娱乐、其他
收入分类：Salary、Transfer In、Others

请返回JSON格式，例如：
{
  "type": "expense",
  "amount": 68.5,
  "category": "餐饮",
  "date": "2025-11-23",
  "description": "午餐"
}

只返回JSON，不要其他说明。`

  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${QWEN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen-vl-max',
      input: {
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                image: `data:image/jpeg;base64,${imageBase64}`,
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Qwen VL API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.output?.choices?.[0]?.message?.content?.[0]?.text

  if (!content) {
    return null
  }

  return extractJSON(content)
}

async function callClaudeVision(imageBase64: string): Promise<OCRResult | null> {
  const prompt = `
这是一张消费小票或发票的图片。请分析图片内容并提取以下信息：

要求：
1. 提取金额（单位：元）
2. 判断交易类型（支出还是收入）
3. 根据内容判断分类
4. 提取日期（如果有），否则使用今天的日期
5. 简短描述交易内容

支出分类：餐饮、交通、购物、娱乐、其他
收入分类：Salary、Transfer In、Others

请返回JSON格式，例如：
{
  "type": "expense",
  "amount": 68.5,
  "category": "餐饮",
  "date": "2025-11-23",
  "description": "午餐"
}

只返回JSON，不要其他说明。`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_API_KEY!,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude Vision API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.content?.[0]?.text

  if (!content) {
    return null
  }

  return extractJSON(content)
}

function extractJSON(text: string): OCRResult | null {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
    const jsonString = jsonMatch ? jsonMatch[1] : text

    const parsed = JSON.parse(jsonString)

    // Validate required fields
    if (!parsed.amount || !parsed.category || !parsed.date) {
      return null
    }

    return {
      type: parsed.type || 'expense',
      amount: parseFloat(parsed.amount),
      category: parsed.category,
      date: parsed.date,
      description: parsed.description || '',
    }
  } catch (error) {
    console.error('JSON extraction error:', error)
    return null
  }
}
