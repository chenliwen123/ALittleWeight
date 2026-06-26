<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getFavoriteFoods, saveFavoriteFood, updateFavoriteFood, deleteFavoriteFood } from '../api'
import type { FavoriteFood } from '../types'

const CATEGORIES = ['全部', '肉类', '蔬菜', '水果', '主食', '饮品', '零食', '其他']
const CATEGORY_COLORS: Record<string, string> = {
  '肉类': '#ef4444',
  '蔬菜': '#22c55e',
  '水果': '#f59e0b',
  '主食': '#3b82f6',
  '饮品': '#8b5cf6',
  '零食': '#ec4899',
  '其他': '#6b7280'
}

const items = ref<FavoriteFood[]>([])
const activeCategory = ref('全部')
const showForm = ref(false)
const editingId = ref<number | null>(null)
const loading = ref(false)
const saving = ref(false)
const message = ref('')

// 表单
const form = ref({
  food_name: '',
  weight: 100,
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  category: '其他'
})

async function loadFavorites() {
  loading.value = true
  try {
    const category = activeCategory.value === '全部' ? undefined : activeCategory.value
    const res = await getFavoriteFoods(category)
    if (res.success) {
      items.value = res.data
    }
  } catch (err: any) {
    message.value = '加载失败'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = {
    food_name: '',
    weight: 100,
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    category: '其他'
  }
  editingId.value = null
  showForm.value = false
}

function handleEdit(item: FavoriteFood) {
  form.value = {
    food_name: item.food_name,
    weight: item.weight,
    calories: item.calories,
    protein: item.protein,
    fat: item.fat,
    carbs: item.carbs,
    category: item.category
  }
  editingId.value = item.id
  showForm.value = true
}

async function handleSubmit() {
  if (!form.value.food_name.trim()) return
  saving.value = true
  try {
    if (editingId.value) {
      await updateFavoriteFood(editingId.value, form.value)
    } else {
      await saveFavoriteFood(form.value)
    }
    resetForm()
    await loadFavorites()
  } catch (err: any) {
    message.value = err.message || '操作失败'
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  if (!confirm('确定要删除这个收藏吗？')) return
  try {
    await deleteFavoriteFood(id)
    await loadFavorites()
  } catch (err: any) {
    message.value = '删除失败'
  }
}

function handleQuickEntry(item: FavoriteFood) {
  const text = `${item.food_name} | ${item.weight}g | ${item.calories}kcal/100g | 蛋白${item.protein}g 脂肪${item.fat}g 碳水${item.carbs}g`
  alert(`已复制食物信息：\n${text}`)
}

function switchCategory(cat: string) {
  activeCategory.value = cat
  loadFavorites()
}

onMounted(loadFavorites)
</script>

<template>
  <div class="container">
    <header class="app-header">
      <h1 style="font-size:1.5rem;">⭐ 收藏食物</h1>
      <p>管理常吃食物，快速录入</p>
    </header>

    <div v-if="message" class="error-alert">
      <span class="error-icon">✕</span>
      <div>{{ message }}</div>
    </div>

    <!-- 分类过滤 -->
    <div class="card" style="padding:12px 16px;">
      <div class="category-tabs">
        <button
          v-for="cat in CATEGORIES"
          :key="cat"
          class="cat-tab"
          :class="{ active: activeCategory === cat }"
          @click="switchCategory(cat)"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- 添加按钮 -->
    <div class="card" style="text-align:center;padding:12px;">
      <button class="btn btn-primary" style="width:auto;min-width:160px;" @click="showForm = !showForm; if(!showForm) resetForm()">
        {{ showForm ? '✕ 取消' : '➕ 添加食物' }}
      </button>
    </div>

    <!-- 添加/编辑表单 -->
    <div v-if="showForm" class="card form-card">
      <div class="card-title">{{ editingId ? '编辑食物' : '添加新食物' }}</div>
      <div class="form-row">
        <label class="form-label">食物名称 *</label>
        <input v-model="form.food_name" class="form-input" placeholder="如：鸡胸肉" />
      </div>
      <div class="form-row">
        <label class="form-label">分类</label>
        <select v-model="form.category" class="form-input">
          <option v-for="c in CATEGORIES.slice(1)" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <div class="form-grid">
        <div class="form-row">
          <label class="form-label">每份重量</label>
          <div class="input-group">
            <input v-model.number="form.weight" type="number" class="form-input" />
            <span class="input-suffix">g</span>
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">热量</label>
          <div class="input-group">
            <input v-model.number="form.calories" type="number" class="form-input" />
            <span class="input-suffix">kcal</span>
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">蛋白质</label>
          <div class="input-group">
            <input v-model.number="form.protein" type="number" step="0.1" class="form-input" />
            <span class="input-suffix">g</span>
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">脂肪</label>
          <div class="input-group">
            <input v-model.number="form.fat" type="number" step="0.1" class="form-input" />
            <span class="input-suffix">g</span>
          </div>
        </div>
        <div class="form-row">
          <label class="form-label">碳水</label>
          <div class="input-group">
            <input v-model.number="form.carbs" type="number" step="0.1" class="form-input" />
            <span class="input-suffix">g</span>
          </div>
        </div>
      </div>
      <div class="btn-wrapper" style="margin-top:16px;">
        <button class="btn btn-primary" :disabled="saving || !form.food_name.trim()" @click="handleSubmit">
          {{ saving ? '保存中...' : editingId ? '💾 更新' : '💾 添加' }}
        </button>
      </div>
    </div>

    <!-- 收藏列表 -->
    <div v-if="loading" class="card">
      <div class="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-text">加载中...</div>
      </div>
    </div>

    <div v-else-if="items.length === 0" class="card">
      <div class="empty-state">
        <div class="empty-icon">⭐</div>
        <p>还没有收藏的食物，点击上方添加</p>
      </div>
    </div>

    <div v-else class="food-grid">
      <div v-for="item in items" :key="item.id" class="card food-card">
        <div class="food-card-header">
          <span class="food-card-name">{{ item.food_name }}</span>
          <span class="category-badge" :style="{ background: CATEGORY_COLORS[item.category] || '#6b7280' }">
            {{ item.category }}
          </span>
        </div>
        <div class="food-card-macros">
          <span>{{ item.weight }}g</span>
          <span>{{ item.calories }} kcal</span>
          <span>蛋白 {{ item.protein }}g</span>
          <span>脂肪 {{ item.fat }}g</span>
          <span>碳水 {{ item.carbs }}g</span>
        </div>
        <div class="food-card-actions">
          <button class="action-btn quick" @click="handleQuickEntry(item)">⚡快捷录入</button>
          <button class="action-btn edit" @click="handleEdit(item)">📝编辑</button>
          <button class="action-btn delete" @click="handleDelete(item.id)">🗑️删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.cat-tab {
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.cat-tab.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.food-grid {
  display: grid;
  gap: 12px;
}
.food-card { padding: 16px; }
.food-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.food-card-name {
  font-size: 16px;
  font-weight: 600;
}
.category-badge {
  padding: 2px 10px;
  border-radius: 12px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
}
.food-card-macros {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 10px;
}
.food-card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.action-btn {
  padding: 4px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.action-btn.quick { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
.action-btn.edit { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
.action-btn.delete { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
.action-btn:hover { opacity: 0.8; }

.form-card { margin-bottom: 12px; }
.form-row { margin-bottom: 12px; }
.form-label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 4px; color: var(--color-text); }
.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
  box-sizing: border-box;
}
.form-input:focus { border-color: var(--color-primary); }
select.form-input { appearance: auto; }
.input-group { display: flex; align-items: center; gap: 6px; }
.input-suffix { font-size: 13px; color: var(--color-text-secondary); min-width: 24px; }
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 12px;
}
.btn-wrapper { display: flex; justify-content: center; }

@media (min-width: 600px) {
  .food-grid { grid-template-columns: 1fr 1fr; }
}
</style>
