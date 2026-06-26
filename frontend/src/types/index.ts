/** 单个食物的营养信息 */
export interface FoodItem {
  name: string
  weight: number
  unitCalories: number
  totalCalories: number
  protein: number
  fat: number
  carbs: number
  lowConfidence?: boolean
  possibleOptions?: string[]
  weightBasis?: string
}

/** AI 返回的完整结果 */
export interface AiResult {
  foods: FoodItem[]
  totalCaloriesRange: [number, number]
  totalCaloriesMedian: number
  totalProtein: number
  totalFat: number
  totalCarbs: number
  healthScore: number
  healthComment: string
  analysis: string
  hasConflict?: boolean
  conflictDescription?: string
}

/** API 响应格式 */
export interface ApiResponse {
  success: boolean
  data?: AiResult
  error?: string
}

/** 饮食记录 */
export interface DietRecord {
  id: number
  meal_type: string
  food_name: string
  weight: number
  calories: number
  protein: number
  fat: number
  carbs: number
  health_score: number | null
  health_comment: string | null
  ai_analysis: string | null
  record_date: string
  created_at: string
}

/** 体重记录 */
export interface WeightRecord {
  id: number
  weight: number
  body_fat: number | null
  note: string | null
  record_date: string
  created_at: string
}

/** 收藏食物 */
export interface FavoriteFood {
  id: number
  food_name: string
  weight: number
  calories: number
  protein: number
  fat: number
  carbs: number
  category: string
  created_at: string
}

/** 用户目标 */
export interface UserGoals {
  id: number
  daily_calorie_goal: number
  protein_goal: number
  fat_goal: number
  carb_goal: number
  weight_goal: number | null
}

/** 每日汇总 */
export interface DailySummary {
  date: string
  records: DietRecord[]
  totalCalories: number
  totalProtein: number
  totalFat: number
  totalCarbs: number
  byMealType: Record<string, DietRecord[]>
  mealCalories: Record<string, number>
  goals: UserGoals
  progress: {
    caloriePercent: number
    proteinPercent: number
    fatPercent: number
    carbPercent: number
  } | null
}

/** 餐类型 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '午餐' },
  { value: 'dinner', label: '晚餐' },
  { value: 'snack', label: '加餐' }
]
