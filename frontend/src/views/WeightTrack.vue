<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getWeightRecords, saveWeightRecord, deleteWeightRecord } from '../api'
import type { WeightRecord } from '../types'

const records = ref<WeightRecord[]>([])
const loading = ref(false)
const saving = ref(false)
const message = ref('')

const form = ref({
  weight: 0,
  body_fat: undefined as number | undefined,
  note: '',
  record_date: new Date().toISOString().split('T')[0]
})

async function loadRecords() {
  loading.value = true
  try {
    const res = await getWeightRecords()
    if (res.success) records.value = res.data
  } catch (err: any) {
    message.value = '加载失败'
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!form.value.weight || !form.value.record_date) {
    message.value = '请填写日期和体重'
    return
  }
  saving.value = true
  message.value = ''
  try {
    const res = await saveWeightRecord({
      weight: form.value.weight,
      body_fat: form.value.body_fat,
      note: form.value.note,
      record_date: form.value.record_date
    })
    if (res.success) {
      form.value.weight = 0
      form.value.body_fat = undefined
      form.value.note = ''
      await loadRecords()
    }
  } catch (err: any) {
    message.value = err.message || '保存失败'
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  if (!confirm('确定删除这条记录？')) return
  try {
    await deleteWeightRecord(id)
    await loadRecords()
  } catch {
    message.value = '删除失败'
  }
}

const sortedRecords = computed(() => {
  return [...records.value].sort((a, b) => a.record_date.localeCompare(b.record_date))
})

const trendData = computed(() => {
  return sortedRecords.value.slice(-7)
})

const latestWeight = computed(() => records.value[0]?.weight ?? 0)
const minWeight = computed(() => Math.min(...records.value.map(r => r.weight)))
const maxWeight = computed(() => Math.max(...records.value.map(r => r.weight)))

const maxTrendWeight = computed(() => {
  if (trendData.value.length === 0) return 100
  return Math.max(...trendData.value.map(r => r.weight)) * 1.1
})

onMounted(loadRecords)
</script>

<template>
  <div class="container">
    <header class="app-header">
      <h1 style="font-size:1.5rem;">📈 体重追踪</h1>
      <p>记录体重变化，跟踪减肥进展</p>
    </header>

    <div v-if="message" class="error-alert">
      <span class="error-icon">✕</span>
      <div>{{ message }}</div>
    </div>

    <!-- 添加记录 -->
    <div class="card">
      <div class="card-title">✏️ 记录体重</div>
      <div class="form-row">
        <label class="form-label">日期</label>
        <input v-model="form.record_date" type="date" :max="new Date().toISOString().split('T')[0]" class="form-input" />
      </div>
      <div class="form-row">
        <label class="form-label">体重 *</label>
        <div class="input-group">
          <input v-model.number="form.weight" type="number" step="0.1" min="20" max="300" class="form-input" placeholder="如：65.5" />
          <span class="input-suffix">kg</span>
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">体脂率（可选）</label>
        <div class="input-group">
          <input v-model.number="form.body_fat" type="number" step="0.1" min="5" max="50" class="form-input" placeholder="如：18.5" />
          <span class="input-suffix">%</span>
        </div>
      </div>
      <div class="form-row">
        <label class="form-label">备注（可选）</label>
        <input v-model="form.note" class="form-input" placeholder="如：晨起空腹" />
      </div>
      <div class="btn-wrapper">
        <button class="btn btn-primary" :disabled="saving || !form.weight" @click="handleSubmit">
          {{ saving ? '保存中...' : '💾 保存记录' }}
        </button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div v-if="records.length > 0" class="card">
      <div class="card-title">📊 统计概览</div>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">{{ latestWeight.toFixed(1) }}</span>
          <span class="stat-label">当前体重</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ minWeight.toFixed(1) }}</span>
          <span class="stat-label">最低体重</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ maxWeight.toFixed(1) }}</span>
          <span class="stat-label">最高体重</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ records.length }}</span>
          <span class="stat-label">记录次数</span>
        </div>
      </div>
    </div>

    <!-- 趋势图 -->
    <div v-if="trendData.length >= 2" class="card">
      <div class="card-title">📉 体重趋势（近7次）</div>
      <div class="trend-chart">
        <div
          v-for="(r, i) in trendData"
          :key="i"
          class="trend-bar-wrapper"
        >
          <div class="trend-value">{{ r.weight.toFixed(1) }}</div>
          <div
            class="trend-bar"
            :style="{
              height: Math.max((r.weight / maxTrendWeight) * 120, 20) + 'px'
            }"
            :class="{
              'bar-down': i > 0 && r.weight < trendData[i-1].weight,
              'bar-up': i > 0 && r.weight > trendData[i-1].weight
            }"
          ></div>
          <div class="trend-label">{{ r.record_date.slice(5) }}</div>
        </div>
      </div>
    </div>

    <!-- 记录列表 -->
    <div v-if="loading" class="card">
      <div class="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-text">加载中...</div>
      </div>
    </div>

    <div v-else-if="records.length === 0" class="card">
      <div class="empty-state">
        <div class="empty-icon">📈</div>
        <p>还没有体重记录，开始记录你的体重吧</p>
      </div>
    </div>

    <div v-else class="card">
      <div class="card-title">📋 历史记录</div>
      <div class="record-list">
        <div v-for="r in records" :key="r.id" class="record-item">
          <div class="record-info">
            <span class="record-date">{{ r.record_date }}</span>
            <span class="record-weight">{{ r.weight }} kg</span>
            <span v-if="r.body_fat" class="record-fat">体脂 {{ r.body_fat }}%</span>
            <span v-if="r.note" class="record-note">{{ r.note }}</span>
          </div>
          <button class="record-delete" @click="handleDelete(r.id)">🗑️</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-row { margin-bottom: 14px; }
.form-label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 4px; color: var(--color-text); }
.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
  box-sizing: border-box;
}
.form-input:focus { border-color: var(--color-primary); }
.input-group { display: flex; align-items: center; gap: 8px; }
.input-suffix { font-size: 14px; color: var(--color-text-secondary); min-width: 24px; }
.btn-wrapper { display: flex; justify-content: center; margin-top: 8px; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.stat-item { text-align: center; padding: 8px; background: #f8fafc; border-radius: var(--radius-sm); }
.stat-value { display: block; font-size: 1.3rem; font-weight: 700; color: var(--color-primary-dark); }
.stat-label { font-size: 11px; color: var(--color-text-secondary); }

.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding: 16px 4px 0;
  min-height: 160px;
  gap: 4px;
}
.trend-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.trend-value { font-size: 11px; font-weight: 600; color: var(--color-text); }
.trend-bar {
  width: 60%;
  max-width: 40px;
  min-width: 20px;
  background: linear-gradient(180deg, #22c55e, #16a34a);
  border-radius: 4px 4px 0 0;
  transition: height 0.3s;
}
.trend-bar.bar-down { background: linear-gradient(180deg, #22c55e, #16a34a); }
.trend-bar.bar-up { background: linear-gradient(180deg, #f97316, #ea580c); }
.trend-label { font-size: 10px; color: var(--color-text-secondary); }

.record-list { display: flex; flex-direction: column; gap: 8px; }
.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: var(--radius-sm);
}
.record-info { display: flex; flex-wrap: wrap; gap: 4px 12px; align-items: center; }
.record-date { font-size: 13px; font-weight: 600; color: var(--color-text); min-width: 80px; }
.record-weight { font-size: 14px; font-weight: 700; color: var(--color-primary-dark); }
.record-fat { font-size: 12px; color: var(--color-text-secondary); }
.record-note { font-size: 12px; color: #94a3b8; }
.record-delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  opacity: 0.6;
}
.record-delete:hover { opacity: 1; }

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
