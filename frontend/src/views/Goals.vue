<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getGoals, updateGoals } from '../api'
import type { UserGoals } from '../types'

const goals = ref<UserGoals>({
  id: 0,
  daily_calorie_goal: 2000,
  protein_goal: 60,
  fat_goal: 65,
  carb_goal: 300,
  weight_goal: null
})

const loading = ref(false)
const saving = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

async function loadGoals() {
  loading.value = true
  try {
    const res = await getGoals()
    if (res.success && res.data) {
      goals.value = res.data
    }
  } catch (err: any) {
    errorMsg.value = '加载目标失败'
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  saving.value = true
  successMsg.value = ''
  errorMsg.value = ''
  try {
    const res = await updateGoals({
      daily_calorie_goal: goals.value.daily_calorie_goal,
      protein_goal: goals.value.protein_goal,
      fat_goal: goals.value.fat_goal,
      carb_goal: goals.value.carb_goal,
      weight_goal: goals.value.weight_goal
    })
    if (res.success) {
      successMsg.value = '目标已保存成功！'
      goals.value = res.data
      setTimeout(() => { successMsg.value = '' }, 3000)
    }
  } catch (err: any) {
    errorMsg.value = err.message || '保存失败'
  } finally {
    saving.value = false
  }
}

onMounted(loadGoals)
</script>

<template>
  <div class="container">
    <header class="app-header">
      <h1 style="font-size:1.5rem;">🎯 目标设置</h1>
      <p>设定每日营养目标和减肥计划</p>
    </header>

    <template v-if="loading">
      <div class="card">
        <div class="loading-overlay">
          <div class="spinner"></div>
          <div class="loading-text">加载中...</div>
        </div>
      </div>
    </template>

    <template v-else>
      <!-- 反馈消息 -->
      <div v-if="successMsg" class="card" style="background:#f0fdf4;border:1px solid #bbf7d0;text-align:center;color:#16a34a;">
        ✅ {{ successMsg }}
      </div>
      <div v-if="errorMsg" class="error-alert">
        <span class="error-icon">✕</span>
        <div>{{ errorMsg }}</div>
      </div>

      <!-- 热量目标 -->
      <div class="card">
        <div class="card-title">🔥 热量目标</div>
        <div class="form-row">
          <label class="form-label">每日热量目标</label>
          <div class="input-group">
            <input v-model.number="goals.daily_calorie_goal" type="number" min="500" max="5000" class="form-input" />
            <span class="input-suffix">kcal</span>
          </div>
        </div>
      </div>

      <!-- 营养目标 -->
      <div class="card">
        <div class="card-title">🥩 营养目标</div>
        <div class="form-row">
          <label class="form-label">每日蛋白质目标</label>
          <div class="input-group">
            <input v-model.number="goals.protein_goal" type="number" min="0" max="300" class="form-input" />
            <span class="input-suffix">g</span>
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">每日脂肪目标</label>
          <div class="input-group">
            <input v-model.number="goals.fat_goal" type="number" min="0" max="200" class="form-input" />
            <span class="input-suffix">g</span>
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">每日碳水目标</label>
          <div class="input-group">
            <input v-model.number="goals.carb_goal" type="number" min="0" max="500" class="form-input" />
            <span class="input-suffix">g</span>
          </div>
        </div>
      </div>

      <!-- 体重目标 -->
      <div class="card">
        <div class="card-title">⚖️ 减肥计划</div>
        <div class="form-row">
          <label class="form-label">目标体重（可选）</label>
          <div class="input-group">
            <input v-model.number="goals.weight_goal" type="number" min="20" max="300" step="0.1" class="form-input" placeholder="不设置" />
            <span class="input-suffix">kg</span>
          </div>
        </div>
        <p style="font-size:12px;color:#94a3b8;margin-top:8px;">
          设定目标体重后，体重追踪页面会显示与目标的差距
        </p>
      </div>

      <!-- 保存按钮 -->
      <div class="card">
        <div class="btn-wrapper">
          <button class="btn btn-primary" :disabled="saving" @click="handleSave">
            {{ saving ? '保存中...' : '💾 保存目标' }}
          </button>
        </div>
      </div>
    </template>

    <!-- 关于 -->
    <div class="card" style="text-align:center;color:#94a3b8;font-size:12px;">
      <p>ALittleWeight v1.0</p>
      <p>AI 智能识别食物 · 精准估算卡路里</p>
    </div>
  </div>
</template>

<style scoped>
.form-row {
  margin-bottom: 16px;
}
.form-row:last-child {
  margin-bottom: 0;
}
.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
  color: var(--color-text);
}
.input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.form-input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}
.form-input:focus {
  border-color: var(--color-primary);
}
.input-suffix {
  font-size: 14px;
  color: var(--color-text-secondary);
  font-weight: 500;
  min-width: 28px;
}
.btn-wrapper {
  display: flex;
  justify-content: center;
}
</style>
