import axios from 'axios'
import type { ApiResponse, UserGoals, DailySummary, DietRecord, WeightRecord, FavoriteFood } from '../types'

// 生产环境使用 VITE_API_URL，开发环境通过 Vite proxy 走 /api
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 120000
})

// ===== 图片分析 =====
export async function analyzeFood(imageFile: File, description: string): Promise<ApiResponse> {
  const formData = new FormData()
  formData.append('image', imageFile)
  formData.append('description', description)
  const response = await apiClient.post<ApiResponse>('/analyze', formData)
  return response.data
}

// ===== AI 健康点评 =====
export async function aiReview(foods: any[]): Promise<any> {
  const response = await apiClient.post('/ai-review', { foods })
  return response.data
}

// ===== 饮食记录 =====
export async function getDietRecords(params?: { date?: string; start_date?: string; end_date?: string }) {
  const response = await apiClient.get<{ success: boolean; data: DietRecord[] }>('/diet-records', { params })
  return response.data
}

export async function saveDietRecord(record: Partial<DietRecord>) {
  const response = await apiClient.post('/diet-records', record)
  return response.data
}

export async function deleteDietRecord(id: number) {
  const response = await apiClient.delete(`/diet-records/${id}`)
  return response.data
}

export async function batchSaveDietRecords(foods: any[], record_date: string, meal_type: string, health_score?: number, health_comment?: string, ai_analysis?: string) {
  const response = await apiClient.post('/diet-records/batch', { foods, record_date, meal_type, health_score, health_comment, ai_analysis })
  return response.data
}

// ===== 体重记录 =====
export async function getWeightRecords(limit?: number) {
  const response = await apiClient.get<{ success: boolean; data: WeightRecord[] }>('/weight-records', { params: { limit } })
  return response.data
}

export async function saveWeightRecord(record: { weight: number; body_fat?: number; note?: string; record_date: string }) {
  const response = await apiClient.post('/weight-records', record)
  return response.data
}

export async function deleteWeightRecord(id: number) {
  const response = await apiClient.delete(`/weight-records/${id}`)
  return response.data
}

// ===== 收藏食物 =====
export async function getFavoriteFoods(category?: string) {
  const response = await apiClient.get<{ success: boolean; data: FavoriteFood[] }>('/favorite-foods', { params: { category } })
  return response.data
}

export async function saveFavoriteFood(food: Partial<FavoriteFood>) {
  const response = await apiClient.post('/favorite-foods', food)
  return response.data
}

export async function updateFavoriteFood(id: number, food: Partial<FavoriteFood>) {
  const response = await apiClient.put(`/favorite-foods/${id}`, food)
  return response.data
}

export async function deleteFavoriteFood(id: number) {
  const response = await apiClient.delete(`/favorite-foods/${id}`)
  return response.data
}

// ===== 用户目标 =====
export async function getGoals() {
  const response = await apiClient.get<{ success: boolean; data: UserGoals }>('/goals')
  return response.data
}

export async function updateGoals(goals: Partial<UserGoals>) {
  const response = await apiClient.put('/goals', goals)
  return response.data
}

// ===== 每日汇总 =====
export async function getDailySummary(date: string) {
  const response = await apiClient.get<{ success: boolean; data: DailySummary }>('/daily-summary', { params: { date } })
  return response.data
}
