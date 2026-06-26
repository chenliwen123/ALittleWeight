<script setup lang="ts">
import { ref } from 'vue'
import { analyzeFood, batchSaveDietRecords } from '../api'
import type { AiResult } from '../types'
import { MEAL_TYPES } from '../types'
import ResultDisplay from '../components/ResultDisplay.vue'

const fileInput = ref<HTMLInputElement | null>(null)
const imageFile = ref<File | null>(null)
const imagePreviewUrl = ref('')
const description = ref('')
const loading = ref(false)
const result = ref<AiResult | null>(null)
const error = ref('')
const saveLoading = ref(false)
const saveMessage = ref('')
const saveError = ref('')
const showMealModal = ref(false)
const selectedMeal = ref('breakfast')

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
const MAX_FILE_SIZE = 10 * 1024 * 1024

function handleFile(file: File | null) {
  if (!file) return
  if (!ALLOWED_TYPES.includes(file.type)) {
    error.value = '仅支持 JPEG、PNG、GIF、WebP、BMP 格式的图片'
    return
  }
  if (file.size > MAX_FILE_SIZE) {
    error.value = '图片大小不能超过 10MB'
    return
  }
  error.value = ''
  imageFile.value = file
  result.value = null
  saveMessage.value = ''
  const reader = new FileReader()
  reader.onload = (e) => { imagePreviewUrl.value = e.target?.result as string }
  reader.readAsDataURL(file)
}

function onFileInput(event: Event) {
  const input = event.target as HTMLInputElement
  handleFile(input.files?.[0] ?? null)
  if (input) input.value = ''
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  handleFile(event.dataTransfer?.files?.[0] ?? null)
}

function onUploadClick() {
  if (!imagePreviewUrl) fileInput.value?.click()
}

function removeImage() {
  imageFile.value = null
  imagePreviewUrl.value = ''
  error.value = ''
  result.value = null
  saveMessage.value = ''
}

async function handleAnalyze() {
  if (loading.value || !imageFile.value) return
  loading.value = true
  error.value = ''
  result.value = null
  saveMessage.value = ''
  try {
    const res = await analyzeFood(imageFile.value, description.value)
    if (res.success && res.data) {
      result.value = res.data
    } else {
      error.value = res.error || '分析失败，请稍后重试'
    }
  } catch (e: any) {
    error.value = e?.response?.data?.error || e?.message || '分析请求失败，请检查网络连接'
  } finally {
    loading.value = false
  }
}

function handleSave() {
  selectedMeal.value = 'breakfast'
  saveError.value = ''
  showMealModal.value = true
}

async function confirmSave() {
  if (!result.value || !selectedMeal.value) return
  saveLoading.value = true
  saveError.value = ''
  saveMessage.value = ''
  try {
    const today = new Date().toISOString().split('T')[0]
    const foods = result.value.foods.map(f => ({
      food_name: f.name,
      weight: f.weight,
      calories: f.totalCalories,
      protein: f.protein,
      fat: f.fat,
      carbs: f.carbs
    }))
    const res = await batchSaveDietRecords(
      foods, today, selectedMeal.value,
      result.value.healthScore, result.value.healthComment, result.value.analysis
    )
    if (res.success) {
      const mealLabel = MEAL_TYPES.find(m => m.value === selectedMeal.value)?.label || selectedMeal.value
      saveMessage.value = `✅ 已成功保存到${mealLabel}`
      showMealModal.value = false
    } else {
      saveError.value = res.error || '保存失败，请稍后重试'
    }
  } catch (e: any) {
    saveError.value = e?.response?.data?.error || e?.message || '保存请求失败，请检查网络连接'
  } finally {
    saveLoading.value = false
  }
}
</script>

<template>
  <div class="container">
    <div class="card">
      <div class="card-title">📸 上传食物图片</div>
      <div
        class="upload-zone"
        :class="{ 'has-image': !!imagePreviewUrl }"
        @dragover="onDragOver"
        @drop="onDrop"
        @click="onUploadClick"
      >
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
          @change="onFileInput"
        />
        <template v-if="!imagePreviewUrl">
          <div class="upload-icon">🍽️</div>
          <p>拖拽图片到此处，或点击上传</p>
          <p class="hint">支持 JPEG、PNG、GIF、WebP、BMP 格式，最大 10MB</p>
        </template>
        <div v-else class="image-preview">
          <img :src="imagePreviewUrl" alt="食物图片预览" />
          <button class="remove-btn" @click.stop="removeImage">✕</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">📝 食物描述（可选）</div>
      <textarea
        v-model="description"
        class="text-input"
        placeholder="请描述你吃的食物，例如：一碗牛肉面、一个苹果……"
        rows="3"
      ></textarea>
    </div>

    <div v-if="error" class="error-alert">
      <span class="error-icon">⚠️</span>
      <span>{{ error }}</span>
    </div>

    <div class="btn-wrapper">
      <button
        class="btn btn-primary"
        :disabled="loading || !imageFile"
        @click="handleAnalyze"
      >
        {{ loading ? '分析中...' : '🔍 开始分析' }}
      </button>
    </div>

    <div v-if="loading" class="card loading-overlay">
      <div class="spinner"></div>
      <div class="loading-text">正在分析图片，请稍候...</div>
    </div>

    <div v-if="result && !loading" class="card">
      <div class="card-title">📊 分析结果</div>
      <ResultDisplay :result="result" />
      <div style="margin-top: 16px">
        <button class="btn btn-primary" @click="handleSave">💾 保存到饮食记录</button>
      </div>
      <div
        v-if="saveMessage"
        style="margin-top:12px;text-align:center;color:var(--color-success);font-size:var(--font-size-sm);font-weight:600;"
      >
        {{ saveMessage }}
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showMealModal" class="modal-overlay" @click.self="showMealModal = false">
        <div class="modal-card">
          <div class="card-title">选择餐次</div>
          <p style="color:var(--color-text-secondary);font-size:var(--font-size-sm);margin-bottom:16px;">
            请选择要将本次分析结果保存到哪一餐：
          </p>
          <div class="meal-options">
            <button
              v-for="meal in MEAL_TYPES"
              :key="meal.value"
              class="meal-option"
              :class="{ active: selectedMeal === meal.value }"
              @click="selectedMeal = meal.value"
            >
              {{ meal.label }}
            </button>
          </div>
          <div v-if="saveError" class="error-alert" style="margin-top:12px;">
            <span class="error-icon">⚠️</span>
            <span>{{ saveError }}</span>
          </div>
          <div style="display:flex;gap:12px;margin-top:20px;">
            <button class="btn btn-secondary" style="flex:1;" :disabled="saveLoading" @click="showMealModal = false">
              取消
            </button>
            <button class="btn btn-primary" style="flex:1;" :disabled="saveLoading || !selectedMeal" @click="confirmSave">
              {{ saveLoading ? '保存中...' : '确认保存' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.btn-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}
.meal-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.meal-option {
  padding: 14px 16px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #fff;
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  color: var(--color-text);
}
.meal-option:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}
.meal-option.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 16px;
}
.modal-card {
  background: #fff;
  border-radius: var(--radius);
  padding: 24px;
  max-width: 400px;
  width: 100%;
  box-shadow: var(--shadow-lg);
  animation: fadeIn 0.2s ease;
}
@media (min-width: 768px) {
  .meal-options {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
