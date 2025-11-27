import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse/lib/pdf-parse';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { fileData } = await request.json();
    
    if (!fileData) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少 PDF 文件数据' 
      }, { status: 400 });
    }

    // 解码 Base64
    const buffer = Buffer.from(fileData, 'base64');
    
    // 解析 PDF
    const pdfData = await pdf(buffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json({ 
        success: false, 
        error: 'PDF 中未找到足够的文本内容，可能是扫描件或图片 PDF' 
      }, { status: 400 });
    }

    // 使用 AI 解析 PDF 中的账单信息
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `请从以下 PDF 文本中提取所有账单/交易信息，并以 JSON 数组格式返回。每个交易应包含：
- date: 日期（YYYY-MM-DD 格式）
- amount: 金额（数字）
- category: 类别（Food, Transport, Shopping, Entertainment, Rent & Bills, Investments, Other 之一）
- description: 描述
- type: 类型（income 或 expense）

如果无法确定某些字段，请使用合理的默认值。

PDF 文本内容：
${extractedText.substring(0, 3000)}

请只返回 JSON 数组，不要包含任何其他文字。格式如下：
[{"date":"2024-01-15","amount":50.00,"category":"Food","description":"午餐","type":"expense"}]`
      }]
    });

    const aiResponse = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // 解析 AI 返回的 JSON
    let transactions = [];
    try {
      // 提取 JSON 数组
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        transactions = parsedData.map((item: any, index: number) => ({
          id: Date.now().toString() + '-' + index,
          date: item.date || new Date().toISOString().split('T')[0],
          amount: parseFloat(item.amount) || 0,
          category: item.category || 'Other',
          description: item.description || 'PDF 导入',
          type: item.type || 'expense'
        }));
      }
    } catch (parseError) {
      console.error('解析 AI 返回的 JSON 失败:', parseError);
      return NextResponse.json({ 
        success: false, 
        error: 'AI 解析失败，请确保 PDF 包含有效的账单信息' 
      }, { status: 400 });
    }

    if (transactions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '未能从 PDF 中提取出有效的账单信息' 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: transactions,
      count: transactions.length
    });

  } catch (error: any) {
    console.error('PDF 导入错误:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'PDF 处理失败' 
    }, { status: 500 });
  }
}

