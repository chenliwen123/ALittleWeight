<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { getDailySummary, deleteDietRecord } from '../api'
import type { DailySummary, DietRecord } from '../types'
import { MEAL_TYPES } from '../types'

const today = new Date().toISOString().split('T')[0]
const date = ref(today)
const summary = ref<DailySummary | null>(null)
const loading = ref(false)
const error = ref('')
const deleteLoading = ref<number | null>(null)

const expandedMeals = ref<Record<string, boolean>>({
  breakfast: true,
  lunch: true,
  dinner: true,
  snack: true
})

function formatDate(d: string): string {
  const dateObj = new Date(d)
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${year}年${month}月${day}日`
}

function getMealLabel(value: string): string {
  const found = MEAL_TYPES.find(m => m.value === value)
  return found ? found.label : value
}

async function loadSummary(dateStr: string) {
  loading.value = true
  error.value = ''
  try {
    const res = await getDailySummary(dateStr)
    if (res.success && res.data) {
      summary.value = res.data
    } else {
      summary.value = null
    }
  } catch {
    error.value = '加载饮食记录失败，请稍后重试'
    summary.value = null
  } finally {
    loading.value = false
  }
}

async function handleDelete(id: number) {
  deleteLoading.value = id
  error.value = ''
  try {
    await deleteDietRecord(id)
    await loadSummary(date.value)
  } catch {
    error.value = '删除记录失败，请稍后重试'
  } finally {
    deleteLoading.value = null
  }
}

function toggleMeal(type: string) {
  expandedMeals.value[type] = !expandedMeals.value[type]
}

onMounted(() => {
  loadSummary(date.value)
})

watch(date, (newDate) => {
  loadSummary(newDate)
})

const hasRecords = computed(() => {
  return summary.value && summary.value.records && summary.value.records.length > 0
})
</script>

<template>
  <div class="diet-page">
    <!-- 日期选择 -->
    <div class="card">
      <div class="card-title">📅 选择日期</div>
      <div class="date-row">
        <input
          type="date"
          v-model="date"
          class="date-input"
          :max="today"
        />
        <span class="date-display">{{ formatDate(date) }}</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <div class="loading-text">加载中...</div>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="error-alert">
      <span class="error-icon">⚠️</span>
      <span>{{ error }}</span>
    </div>

    <!-- 每日汇总 -->
    <div v-else-if="summary" class="card">
      <div class="card-title">📊 每日营养汇总</div>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-header">
            <span class="summary-label">热量</span>
            <span class="summary-value">{{ summary.totalCalories }} / {{ summary.goals.daily_calorie_goal }} kcal</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill progress-calorie"
              :style="{ width: Math.min((summary.progress?.caloriePercent ?? 0), 100) + '%' }"
            ></div>
          </div>
          <span class="progress-text">{{ Math.round(summary.progress?.caloriePercent ?? 0) }}%</span>
        </div>
        <div class="summary-item">
          <div class="summary-header">
            <span class="summary-label">蛋白质</span>
            <span class="summary-value">{{ summary.totalProtein }} / {{ summary.goals.protein_goal }} g</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill progress-protein"
              :style="{ width: Math.min((summary.progress?.proteinPercent ?? 0), 100) + '%' }"
            ></div>
          </div>
          <span class="progress-text">{{ Math.round(summary.progress?.proteinPercent ?? 0) }}%</span>
        </div>
        <div class="summary-item">
          <div class="summary-header">
            <span class="summary-label">脂肪</span>
            <span class="summary-value">{{ summary.totalFat }} / {{ summary.goals.fat_goal }} g</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill progress-fat"
              :style="{ width: Math.min((summary.progress?.fatPercent ?? 0), 100) + '%' }"
            ></div>
          </div>
          <span class="progress-text">{{ Math.round(summary.progress?.fatPercent ?? 0) }}%</span>
        </div>
        <div class="summary-item">
          <div class="summary-header">
            <span class="summary-label">碳水化合物</span>
            <span class="summary-value">{{ summary.totalCarbs }} / {{ summary.goals.carb_goal }} g</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill progress-carbs"
              :style="{ width: Math.min((summary.progress?.carbPercent ?? 0), 100) + '%' }"
            ></div>
          </div>
          <span class="progress-text">{{ Math.round(summary.progress?.carbPercent ?? 0) }}%</span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="card">
      <div class="empty-state">
        <div class="empty-icon">🍽️</div>
        <p>暂无饮食记录</p>
        <p style="margin-top:4px;font-size:var(--font-size-xs);">去「识别」页面添加今天的饮食记录吧</p>
      </div>
    </div>

    <!-- 按餐类型分组 -->
    <div v-if="hasRecords">
      <div
        v-for="mealType in MEAL_TYPES"
        :key="mealType.value"
        class="card meal-section"
      >
        <div class="meal-header" @click="toggleMeal(mealType.value)">
          <div class="meal-title">
            <span class="meal-icon">
              {{ mealType.value === 'breakfast' ? '🌅' : mealType.value === 'lunch' ? '☀️' : mealType.value === 'dinner' ? '🌙' : '🍪' }}
            </span>
            <span>{{ mealType.label }}</span>
            <span class="meal-count" v-if="summary?.byMealType[mealType.value]?.length">
              ({{ summary.byMealType[mealType.value].length }})
            </span>
          </div>
          <div class="meal-right">
            <span class="meal-calories" v-if="summary?.mealCalories[mealType.value]">
              {{ summary.mealCalories[mealType.value] }} kcal
            </span>
            <span class="expand-icon">{{ expandedMeals[mealType.value] ? '▼' : '▶' }}</span>
          </div>
        </div>

        <div v-if="summary?.byMealType[mealType.value]?.length && expandedMeals[mealType.value]" class="meal-body">
          <div style="overflow-x:auto;">
            <table class="food-table">
              <thead>
                <tr>
                  <th>食物</th>
                  <th>重量</th>
                  <th>热量</th>
                  <th>蛋白质</th>
                  <th>脂肪</th>
                  <th>碳水</th>
                  <th style="width:50px;"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in summary.byMealType[mealType.value]" :key="record.id">
                  <td><span class="food-name">{{ record.food_name }}</span></td>
                  <td>{{ record.weight }}g</td>
                  <td>{{ record.calories }} kcal</td>
                  <td>{{ record.protein }}g</td>
                  <td>{{ record.fat }}g</td>
                  <td>{{ record.carbs }}g</td>
                  <td>
                    <button
                      class="delete-btn"
                      :disabled="deleteLoading === record.id"
                      @click.stop="handleDelete(record.id)"
                      :title="'删除 ' + record.food_name"
                    >
                      {{ deleteLoading === record.id ? '...' : '✕' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          v-else-if="!summary?.byMealType[mealType.value]?.length"
          class="meal-empty"
        >
          <span>暂无记录</span>
        </div>

        <!-- 没有数据但折叠状态时也不显示空白 -->
      </div>
    </div>
  </div>
</template>

<style scoped>
.diet-page {
  padding: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.date-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.date-input {
  padding: 8px 12px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-base);
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
  color: var(--color-text);
  background: var(--color-bg-card);
}

.date-input:focus {
  border-color: var(--color-primary);
}

.date-display {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* 汇总网格 */
.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  .diet-page {
    padding: 24px;
  }
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
}

.summary-label {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.summary-value {
  font-weight: 600;
  color: var(--color-text);
  font-size: var(--font-size-xs);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
  min-width: 0;
}

.progress-calorie {
  background: linear-gradient(90deg, var(--color-primary), #059669);
}

.progress-protein {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.progress-fat {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.progress-carbs {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.progress-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  text-align: right;
}

/* 餐类型区块 */
.meal-section {
  padding: 0;
  overflow: hidden;
}

.meal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.meal-header:hover {
  background: #f8fafc;
}

.meal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: var(--font-size-base);
}

.meal-icon {
  font-size: 18px;
}

.meal-count {
  font-weight: 400;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.meal-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.meal-calories {
  font-size: var(--font-size-sm);
  color: var(--color-primary-dark);
  font-weight: 600;
}

.expand-icon {
  font-size: 12px;
  color: var(--color-text-secondary);
  transition: transform 0.2s;
}

.meal-body {
  border-top: 1px solid var(--color-border);
  padding: 0 16px 16px;
}

.meal-body .food-table {
  margin-bottom: 0;
}

.meal-body .food-table th:last-child,
.meal-body .food-table td:last-child {
  text-align: center;
}

.meal-empty {
  padding: 20px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  border-top: 1px solid var(--color-border);
}

/* 删除按钮 */
.delete-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.delete-btn:hover:not(:disabled) {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
