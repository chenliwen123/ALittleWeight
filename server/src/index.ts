import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { ProxyAgent } from 'undici'
import { initDatabase, queryAll, queryOne, execute } from './db'

// 允许连接使用自签名证书的内部 API（仅开发/内网环境）
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// 代理配置
const PROXY_URL = process.env.PROXY_URL || ''
const proxyAgent = PROXY_URL ? new ProxyAgent(PROXY_URL) : null

const app = express()
const PORT = process.env.PORT || 3001
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)

// 中间件
app.use(cors({
  origin: ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : '*'
}))
app.use(express.json({ limit: '20mb' }))

// 文件上传配置
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的图片格式'))
    }
  }
})

// AI 配置
const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.openai.com/v1'
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o'

// ============================================
// AI 系统提示词 - 含营养成分细化和健康评分
// ============================================
const SYSTEM_PROMPT = `你是一个专业的营养分析师和食物识别助手。根据用户上传的图片和文字描述，识别食物、估算分量、计算热量和详细营养成分，并给出健康评分。

请遵守以下规则：
1. 优先结合图片内容识别，文字描述作为补充
2. 多个食物需分别识别并汇总
3. 对每种食物给出：食物名称、估计重量(克)、单位热量(每100g kcal)、蛋白质(g)、脂肪(g)、碳水(g)、总热量(kcal)
4. 基于常见份量合理估算，说明依据
5. 识别不确定时标注"低置信度"并给出可能选项
6. 最终输出：总热量（范围+中位值）、详细营养分析、一餐健康评分(1-10)

纠错逻辑：用户描述与图片冲突时以图片为准，说明差异。
不要编造不存在的食物，无法识别时明确说明"无法识别"。

输出必须为纯JSON格式，严格按照以下结构：
{
  "foods": [
    {
      "name": "食物名称",
      "weight": 重量(克),
      "unitCalories": 每100g热量,
      "totalCalories": 总热量,
      "protein": 蛋白质(g),
      "fat": 脂肪(g),
      "carbs": 碳水(g),
      "lowConfidence": false,
      "possibleOptions": [],
      "weightBasis": "估算依据"
    }
  ],
  "totalCaloriesRange": [最低, 最高],
  "totalCaloriesMedian": 中位值,
  "totalProtein": 总蛋白质,
  "totalFat": 总脂肪,
  "totalCarbs": 总碳水,
  "healthScore": 8,
  "healthComment": "健康评语，如：高蛋白低脂，营养均衡，但碳水略高",
  "analysis": "整体营养分析",
  "hasConflict": false,
  "conflictDescription": ""
}`

// ============================================
// AI API 调用
// ============================================
async function callAiApi(messages: any[], maxTokens = 2000): Promise<string> {
  const url = `${AI_BASE_URL}/chat/completions`
  const body = {
    model: AI_MODEL,
    messages,
    max_tokens: maxTokens,
    temperature: 0.3
  }

  const fetchOptions: any = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`
    },
    body: JSON.stringify(body)
  }

  if (proxyAgent) fetchOptions.dispatcher = proxyAgent

  const response = await fetch(url, fetchOptions)

  if (!response.ok) {
    if (response.status === 401) throw new Error('API 认证失败，请检查 API Key')
    if (response.status === 429) throw new Error('接口请求过于频繁，请稍后重试')
    throw new Error(`AI 接口请求失败 (${response.status})`)
  }

  const result: any = await response.json()
  const content = result.choices?.[0]?.message?.content
  if (!content) throw new Error('AI 返回结果为空')
  return content
}

function extractJson(text: string): string {
  try { JSON.parse(text); return text } catch {}
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (m) return m[1].trim()
  const s = text.indexOf('{'), e = text.lastIndexOf('}')
  if (s !== -1 && e > s) return text.slice(s, e + 1)
  throw new Error('无法从 AI 响应中解析 JSON')
}

// ============================================
// 分析图片
// ============================================
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    const description = req.body.description || ''
    const file = req.file
    if (!file) { res.status(400).json({ success: false, error: '请上传图片文件' }); return }

    const base64Image = file.buffer.toString('base64')
    const userPrompt = `请分析这张图片中的食物，并结合以下描述进行热量估算：用户描述：${description}，要求：精确识别食物、合理估算重量、计算总热量及营养成分，并给出健康评分`

    const aiResponse = await callAiApi([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: [
        { type: 'text', text: userPrompt },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}`, detail: 'high' } }
      ]}
    ], 2500)

    const parsed = JSON.parse(extractJson(aiResponse))
    res.json({ success: true, data: parsed })
  } catch (error: any) {
    console.error('分析失败:', error.message)
    if (error.message?.includes('fetch') || error.message?.includes('ENOTFOUND')) {
      res.status(503).json({ success: false, error: '无法连接到 AI 服务，请检查网络连接和 API 地址配置' })
    } else {
      res.status(500).json({ success: false, error: error.message || '分析失败' })
    }
  }
})

// ============================================
// AI 健康点评（无图片，纯文字点评已有记录）
// ============================================
app.post('/api/ai-review', async (req, res) => {
  try {
    const { foods } = req.body
    if (!foods || !Array.isArray(foods) || foods.length === 0) {
      res.status(400).json({ success: false, error: '请提供食物数据' })
      return
    }

    const foodSummary = foods.map((f: any) =>
      `${f.food_name}: ${f.calories}kcal, 蛋白质${f.protein}g, 脂肪${f.fat}g, 碳水${f.carbs}g`
    ).join('\n')

    const prompt = `请对以下一餐进行健康评分（1-10分）并给出点评建议：\n${foodSummary}\n\n要求：给出评分、简要评语、改进建议。输出JSON格式：{"healthScore": 分数, "healthComment": "评语", "suggestion": "改进建议"}`

    const aiResponse = await callAiApi([
      { role: 'system', content: '你是一个健康饮食顾问。根据食物营养数据，给出客观的健康评分和改进建议。只输出JSON，不要多余解释。' },
      { role: 'user', content: prompt }
    ], 1000)

    const parsed = JSON.parse(extractJson(aiResponse))
    res.json({ success: true, data: parsed })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || '点评失败' })
  }
})

// ============================================
// 饮食记录 API
// ============================================
app.get('/api/diet-records', (req, res) => {
  const { date, start_date, end_date } = req.query
  let sql = 'SELECT * FROM diet_records'
  const params: any[] = []

  if (date) {
    sql += ' WHERE record_date = ?'
    params.push(date)
  } else if (start_date && end_date) {
    sql += ' WHERE record_date >= ? AND record_date <= ?'
    params.push(start_date, end_date)
  }
  sql += ' ORDER BY created_at DESC'

  res.json({ success: true, data: queryAll(sql, params) })
})

app.post('/api/diet-records', (req, res) => {
  const { meal_type, food_name, weight, calories, protein, fat, carbs, health_score, health_comment, ai_analysis, record_date } = req.body
  if (!food_name || !record_date) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }
  const result = execute(
    `INSERT INTO diet_records (meal_type, food_name, weight, calories, protein, fat, carbs, health_score, health_comment, ai_analysis, record_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [meal_type || 'snack', food_name, weight || 0, calories || 0, protein || 0, fat || 0, carbs || 0, health_score || null, health_comment || null, ai_analysis || null, record_date]
  )
  const record = queryOne('SELECT * FROM diet_records WHERE id = ?', [result.lastInsertRowid])
  res.json({ success: true, data: record })
})

app.delete('/api/diet-records/:id', (req, res) => {
  execute('DELETE FROM diet_records WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

// 批量保存一餐分析结果
app.post('/api/diet-records/batch', (req, res) => {
  const { foods, record_date, meal_type, health_score, health_comment, ai_analysis } = req.body
  if (!foods || !record_date) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }
  const saved: any[] = []
  for (const food of foods) {
    const r = execute(
      `INSERT INTO diet_records (meal_type, food_name, weight, calories, protein, fat, carbs, health_score, health_comment, ai_analysis, record_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [meal_type || 'meal', food.name, food.weight || 0, food.totalCalories || 0, food.protein || 0, food.fat || 0, food.carbs || 0,
       health_score || null, health_comment || null, ai_analysis || null, record_date]
    )
    saved.push(queryOne('SELECT * FROM diet_records WHERE id = ?', [r.lastInsertRowid]))
  }
  res.json({ success: true, data: saved })
})

// ============================================
// 体重记录 API
// ============================================
app.get('/api/weight-records', (req, res) => {
  const { limit: l } = req.query
  let sql = 'SELECT * FROM weight_records ORDER BY record_date DESC'
  const params: any[] = []
  if (l) sql += ' LIMIT ?'
  if (l) params.push(Number(l))
  res.json({ success: true, data: queryAll(sql, params) })
})

app.post('/api/weight-records', (req, res) => {
  const { weight, body_fat, note, record_date } = req.body
  if (!weight || !record_date) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }

  // 检查当天是否已有记录
  const existing = queryOne('SELECT id FROM weight_records WHERE record_date = ?', [record_date])
  if (existing) {
    execute('UPDATE weight_records SET weight=?, body_fat=?, note=? WHERE id=?',
      [weight, body_fat || null, note || null, existing.id])
    const updated = queryOne('SELECT * FROM weight_records WHERE id = ?', [existing.id])
    res.json({ success: true, data: updated, updated: true })
  } else {
    const result = execute(
      'INSERT INTO weight_records (weight, body_fat, note, record_date) VALUES (?, ?, ?, ?)',
      [weight, body_fat || null, note || null, record_date]
    )
    const record = queryOne('SELECT * FROM weight_records WHERE id = ?', [result.lastInsertRowid])
    res.json({ success: true, data: record })
  }
})

app.delete('/api/weight-records/:id', (req, res) => {
  execute('DELETE FROM weight_records WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

// ============================================
// 收藏食物 API
// ============================================
app.get('/api/favorite-foods', (req, res) => {
  const { category } = req.query
  let sql = 'SELECT * FROM favorite_foods'
  const params: any[] = []
  if (category) {
    sql += ' WHERE category = ?'
    params.push(category)
  }
  sql += ' ORDER BY created_at DESC'
  res.json({ success: true, data: queryAll(sql, params) })
})

app.post('/api/favorite-foods', (req, res) => {
  const { food_name, weight, calories, protein, fat, carbs, category } = req.body
  if (!food_name) {
    res.status(400).json({ success: false, error: '缺少食物名称' })
    return
  }
  const result = execute(
    'INSERT INTO favorite_foods (food_name, weight, calories, protein, fat, carbs, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [food_name, weight || 100, calories || 0, protein || 0, fat || 0, carbs || 0, category || '']
  )
  const item = queryOne('SELECT * FROM favorite_foods WHERE id = ?', [result.lastInsertRowid])
  res.json({ success: true, data: item })
})

app.put('/api/favorite-foods/:id', (req, res) => {
  const { food_name, weight, calories, protein, fat, carbs, category } = req.body
  execute(
    'UPDATE favorite_foods SET food_name=?, weight=?, calories=?, protein=?, fat=?, carbs=?, category=? WHERE id=?',
    [food_name, weight, calories, protein, fat, carbs, category || '', req.params.id]
  )
  const updated = queryOne('SELECT * FROM favorite_foods WHERE id = ?', [req.params.id])
  res.json({ success: true, data: updated })
})

app.delete('/api/favorite-foods/:id', (req, res) => {
  execute('DELETE FROM favorite_foods WHERE id = ?', [req.params.id])
  res.json({ success: true })
})

// ============================================
// 用户目标设置 API
// ============================================
app.get('/api/goals', (_req, res) => {
  let goals = queryOne('SELECT * FROM user_settings WHERE id = 1')
  if (!goals) {
    execute('INSERT INTO user_settings (id) VALUES (1)')
    goals = queryOne('SELECT * FROM user_settings WHERE id = 1')
  }
  res.json({ success: true, data: goals })
})

app.put('/api/goals', (req, res) => {
  const { daily_calorie_goal, protein_goal, fat_goal, carb_goal, weight_goal } = req.body
  execute(
    `UPDATE user_settings SET daily_calorie_goal=?, protein_goal=?, fat_goal=?, carb_goal=?, weight_goal=?, updated_at=datetime('now','localtime') WHERE id=1`,
    [daily_calorie_goal || 2000, protein_goal || 60, fat_goal || 65, carb_goal || 300, weight_goal || null]
  )
  const goals = queryOne('SELECT * FROM user_settings WHERE id = 1')
  res.json({ success: true, data: goals })
})

// ============================================
// 每日汇总统计 API
// ============================================
app.get('/api/daily-summary', (req, res) => {
  const { date } = req.query
  if (!date) {
    res.status(400).json({ success: false, error: '缺少日期参数' })
    return
  }
  const records = queryAll('SELECT * FROM diet_records WHERE record_date = ?', [date])
  const goals = queryOne('SELECT * FROM user_settings WHERE id = 1')

  const totalCalories = records.reduce((s, r) => s + (r.calories || 0), 0)
  const totalProtein = records.reduce((s, r) => s + (r.protein || 0), 0)
  const totalFat = records.reduce((s, r) => s + (r.fat || 0), 0)
  const totalCarbs = records.reduce((s, r) => s + (r.carbs || 0), 0)

  // 按餐类型分组
  const byMealType: Record<string, any[]> = {}
  for (const r of records) {
    const mt = r.meal_type || 'snack'
    if (!byMealType[mt]) byMealType[mt] = []
    byMealType[mt].push(r)
  }

  // 计算各餐热量
  const mealCalories: Record<string, number> = {}
  for (const [mt, items] of Object.entries(byMealType)) {
    mealCalories[mt] = items.reduce((s, r) => s + (r.calories || 0), 0)
  }

  res.json({
    success: true,
    data: {
      date,
      records,
      totalCalories,
      totalProtein,
      totalFat,
      totalCarbs,
      byMealType,
      mealCalories,
      goals: goals || { daily_calorie_goal: 2000, protein_goal: 60, fat_goal: 65, carb_goal: 300 },
      progress: goals ? {
        caloriePercent: Math.round((totalCalories / (goals.daily_calorie_goal || 2000)) * 100),
        proteinPercent: Math.round((totalProtein / (goals.protein_goal || 60)) * 100),
        fatPercent: Math.round((totalFat / (goals.fat_goal || 65)) * 100),
        carbPercent: Math.round((totalCarbs / (goals.carb_goal || 300)) * 100)
      } : null
    }
  })
})

// ============================================
// 健康检查 & 启动
// ============================================
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 错误处理中间件
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') res.status(400).json({ success: false, error: '图片大小超过 10MB 限制' })
    else res.status(400).json({ success: false, error: `上传错误: ${err.message}` })
  } else {
    console.error('错误:', err)
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

// 启动
async function start() {
  await initDatabase()
  app.listen(PORT, () => {
    console.log(`🍽️  ALittleWeight 服务已启动: http://localhost:${PORT}`)
    console.log(`📡  AI API: ${AI_BASE_URL} | 模型: ${AI_MODEL}`)
    console.log(`🔌  代理: ${proxyAgent ? PROXY_URL : '未配置'}`)
    console.log(`🗄️  数据库: 已初始化`)
    console.log(`⚠️  API Key: ${AI_API_KEY ? '已设置' : '未设置'}`)
  })
}

start().catch(err => {
  console.error('启动失败:', err)
  process.exit(1)
})
