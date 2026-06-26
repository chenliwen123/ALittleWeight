<script setup lang="ts">
import type { AiResult } from '../types'

defineProps<{
  result: AiResult
}>()
</script>

<template>
  <div class="result-section">
    <!-- 识别冲突 -->
    <div v-if="result.hasConflict" class="conflict-warning">
      <span style="font-size:16px;">⚠️</span>
      <div><strong>识别冲突</strong><br />{{ result.conflictDescription }}</div>
    </div>

    <!-- 健康评分 -->
    <div class="health-score-card" v-if="result.healthScore">
      <div class="score-header">
        <span class="score-value" :class="{
          'score-good': result.healthScore >= 7,
          'score-mid': result.healthScore >= 4 && result.healthScore < 7,
          'score-bad': result.healthScore < 4
        }">{{ result.healthScore }}</span>
        <span class="score-label">/ 10</span>
      </div>
      <div class="score-comment">{{ result.healthComment }}</div>
    </div>

    <!-- 食物列表 -->
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
          </tr>
        </thead>
        <tbody>
          <tr v-for="(food, index) in result.foods" :key="index">
            <td>
              <span class="food-name">
                {{ food.name }}
                <span v-if="food.lowConfidence" class="low-confidence-tag" title="低置信度识别">低置信度</span>
              </span>
              <div v-if="food.weightBasis" class="food-detail">{{ food.weightBasis }}</div>
              <div v-if="food.lowConfidence && food.possibleOptions?.length" class="food-detail low-conf">可能为：{{ food.possibleOptions.join('、') }}</div>
            </td>
            <td>{{ food.weight }}g</td>
            <td>{{ food.totalCalories }} kcal</td>
            <td>{{ food.protein ?? '-' }}g</td>
            <td>{{ food.fat ?? '-' }}g</td>
            <td>{{ food.carbs ?? '-' }}g</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 营养汇总 -->
    <div class="macro-summary">
      <div class="macro-item">
        <span class="macro-value">{{ result.totalCaloriesMedian }}</span>
        <span class="macro-unit">kcal</span>
        <span class="macro-label">总热量</span>
      </div>
      <div class="macro-item">
        <span class="macro-value">{{ result.totalProtein ?? '-' }}</span>
        <span class="macro-unit">g</span>
        <span class="macro-label">蛋白质</span>
      </div>
      <div class="macro-item">
        <span class="macro-value">{{ result.totalFat ?? '-' }}</span>
        <span class="macro-unit">g</span>
        <span class="macro-label">脂肪</span>
      </div>
      <div class="macro-item">
        <span class="macro-value">{{ result.totalCarbs ?? '-' }}</span>
        <span class="macro-unit">g</span>
        <span class="macro-label">碳水</span>
      </div>
    </div>

    <!-- 热量范围 -->
    <div class="calories-summary">
      <div class="label">热量范围</div>
      <div class="range">{{ result.totalCaloriesRange[0] }} – {{ result.totalCaloriesRange[1] }} kcal</div>
    </div>

    <!-- 营养分析 -->
    <div class="card-title" style="margin-bottom:8px;font-size:14px;">📊 营养分析</div>
    <div class="analysis-text">{{ result.analysis }}</div>
  </div>
</template>

<style scoped>
.health-score-card {
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
}
.score-header { margin-bottom: 4px; }
.score-value { font-size: 2.5rem; font-weight: 700; line-height: 1; }
.score-good { color: #16a34a; }
.score-mid { color: #d97706; }
.score-bad { color: #dc2626; }
.score-label { font-size: 1rem; color: var(--color-text-secondary); }
.score-comment { font-size: var(--font-size-sm); color: var(--color-text); margin-top: 4px; }

.macro-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
.macro-item {
  text-align: center;
  padding: 10px 4px;
  background: #f8fafc;
  border-radius: var(--radius-sm);
}
.macro-value { display: block; font-size: 1.25rem; font-weight: 700; color: var(--color-primary-dark); line-height: 1.2; }
.macro-unit { font-size: 11px; color: var(--color-text-secondary); }
.macro-label { display: block; font-size: 11px; color: var(--color-text-secondary); margin-top: 2px; }

.food-detail { font-size: 12px; color: #94a3b8; margin-top: 2px; }
.food-detail.low-conf { color: #92400e; }

.calories-summary {
  text-align: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: var(--radius-sm);
  margin-bottom: 12px;
}
.calories-summary .label { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
.calories-summary .range { font-size: 1.1rem; font-weight: 600; color: var(--color-text); }

@media (max-width: 480px) {
  .macro-summary { grid-template-columns: repeat(2, 1fr); }
}
</style>
