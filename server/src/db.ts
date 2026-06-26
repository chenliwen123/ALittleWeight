import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.resolve(__dirname, '../data/alittleweight.db')

let db: SqlJsDatabase | null = null

/** 初始化数据库 */
export async function initDatabase(): Promise<SqlJsDatabase> {
  if (db) return db

  const SQL = await initSqlJs()

  // 确保 data 目录存在
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // 如果数据库文件已存在，加载它
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  // 启用外键约束
  db.run('PRAGMA foreign_keys = ON')

  // 创建表
  createTables(db)

  // 保存初始结构
  saveDatabase()

  return db
}

/** 创建数据表 */
function createTables(db: SqlJsDatabase) {
  // 用户目标设置
  db.run(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      daily_calorie_goal REAL DEFAULT 2000,
      protein_goal REAL DEFAULT 60,
      fat_goal REAL DEFAULT 65,
      carb_goal REAL DEFAULT 300,
      weight_goal REAL,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `)

  // 饮食记录
  db.run(`
    CREATE TABLE IF NOT EXISTS diet_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_type TEXT NOT NULL DEFAULT 'snack',
      food_name TEXT NOT NULL,
      weight REAL DEFAULT 0,
      calories REAL DEFAULT 0,
      protein REAL DEFAULT 0,
      fat REAL DEFAULT 0,
      carbs REAL DEFAULT 0,
      health_score INTEGER,
      health_comment TEXT,
      ai_analysis TEXT,
      record_date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `)

  // 体重记录
  db.run(`
    CREATE TABLE IF NOT EXISTS weight_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weight REAL NOT NULL,
      body_fat REAL,
      note TEXT,
      record_date TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `)

  // 收藏食物
  db.run(`
    CREATE TABLE IF NOT EXISTS favorite_foods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      food_name TEXT NOT NULL,
      weight REAL DEFAULT 100,
      calories REAL DEFAULT 0,
      protein REAL DEFAULT 0,
      fat REAL DEFAULT 0,
      carbs REAL DEFAULT 0,
      category TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `)
}

/** 保存数据库到文件 */
export function saveDatabase() {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)
}

/** 获取数据库实例 */
export function getDatabase(): SqlJsDatabase {
  if (!db) throw new Error('数据库未初始化，请先调用 initDatabase()')
  return db
}

/** 执行查询并返回 JSON 数组 */
export function queryAll(sql: string, params: any[] = []): any[] {
  const d = getDatabase()
  const stmt = d.prepare(sql)
  if (params.length > 0) stmt.bind(params)

  const results: any[] = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

/** 执行查询并返回第一条结果 */
export function queryOne(sql: string, params: any[] = []): any | null {
  const results = queryAll(sql, params)
  return results.length > 0 ? results[0] : null
}

/** 执行增删改操作 */
export function execute(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number } {
  const d = getDatabase()
  d.run(sql, params)
  const result = {
    changes: d.getRowsModified(),
    lastInsertRowid: (d.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] as number) || 0
  }
  saveDatabase()
  return result
}
