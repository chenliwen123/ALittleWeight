# ALittleWeight 项目说明

ALittleWeight 是一个用于饮食热量分析、营养记录和体重管理的轻量级 Web 应用。项目通过上传食物图片并结合文字描述，调用兼容 OpenAI Chat Completions 的 AI 接口识别食物，估算热量和营养成分，并支持将结果沉淀为日常饮食记录。

## 项目主要功能

### 1. 食物图片识别

- 支持上传或拖拽食物图片，格式包括 JPEG、PNG、GIF、WebP、BMP，单张图片最大 10MB。
- 可填写补充描述，帮助 AI 更准确识别食物内容和分量。
- AI 会返回食物名称、估算重量、每 100g 热量、总热量、蛋白质、脂肪、碳水等信息。
- 支持展示识别置信度、可能选项、估算依据和图片文字冲突说明。
- 提供一餐健康评分、健康评语、热量范围和整体营养分析。

### 2. 饮食记录管理

- 可将识别结果按早餐、午餐、晚餐、加餐保存为当天饮食记录。
- 支持按日期查看每日饮食汇总。
- 展示每日总热量、蛋白质、脂肪、碳水，并与目标值进行进度对比。
- 支持按餐次展开查看食物明细，也可以删除单条记录。

### 3. 体重追踪

- 支持记录每日体重、体脂率和备注。
- 展示当前体重、最低体重、最高体重等统计数据。
- 提供近 7 次体重趋势视图，便于观察减脂或增重变化。
- 支持删除历史体重记录。

### 4. 收藏食物

- 可维护常吃食物的营养信息，方便后续复用。
- 支持食物名称、重量、热量、蛋白质、脂肪、碳水和分类管理。
- 内置分类包括肉类、蔬菜、水果、主食、饮品、零食、其他。
- 支持新增、编辑、删除和按分类筛选收藏食物。

### 5. 目标设置

- 支持设置每日热量目标。
- 支持设置每日蛋白质、脂肪、碳水目标。
- 支持设置目标体重。
- 饮食记录页面会基于目标展示完成进度。

## 技术架构

项目采用前后端分离结构：

```text
ALittleWeight/
├── frontend/        # Vue 3 + Vite 前端应用
├── server/          # Express + TypeScript 后端服务
├── .gitignore
└── README.md
```

### 前端

- 技术栈：Vue 3、TypeScript、Vite、Vue Router、Axios。
- 默认开发端口：5173。
- 开发环境下通过 Vite proxy 将 `/api` 转发到后端 `http://localhost:3001`。
- 页面模块包括：食物识别、饮食记录、体重追踪、收藏食物、目标设置。

### 后端

- 技术栈：Node.js、Express、TypeScript、Multer、sql.js、undici。
- 默认服务端口：3001。
- 使用 Multer 处理图片上传。
- 使用 sql.js 将数据保存到本地 SQLite 文件。
- 数据库文件默认位于 `server/data/alittleweight.db`。
- 提供 AI 食物识别、饮食记录、体重记录、收藏食物、目标设置和每日汇总等接口。

## 后端接口概览

| 接口 | 说明 |
| --- | --- |
| `POST /api/analyze` | 上传食物图片并调用 AI 进行识别分析 |
| `POST /api/ai-review` | 对食物列表生成 AI 健康点评 |
| `GET /api/diet-records` | 查询饮食记录 |
| `POST /api/diet-records` | 新增饮食记录 |
| `DELETE /api/diet-records/:id` | 删除饮食记录 |
| `POST /api/diet-records/batch` | 批量保存识别出的食物记录 |
| `GET /api/weight-records` | 查询体重记录 |
| `POST /api/weight-records` | 新增或更新体重记录 |
| `DELETE /api/weight-records/:id` | 删除体重记录 |
| `GET /api/favorite-foods` | 查询收藏食物 |
| `POST /api/favorite-foods` | 新增收藏食物 |
| `PUT /api/favorite-foods/:id` | 更新收藏食物 |
| `DELETE /api/favorite-foods/:id` | 删除收藏食物 |
| `GET /api/goals` | 获取用户目标设置 |
| `PUT /api/goals` | 更新用户目标设置 |
| `GET /api/daily-summary` | 获取指定日期的饮食汇总 |
| `GET /api/health` | 服务健康检查 |

## 数据存储

后端会初始化以下数据表：

- `user_settings`：保存每日热量、三大营养素和目标体重设置。
- `diet_records`：保存饮食记录、餐次、热量、营养成分和 AI 分析结果。
- `weight_records`：保存体重、体脂率、备注和记录日期。
- `favorite_foods`：保存常用/收藏食物及其营养信息。

## 环境变量

### 后端 `server/.env`

```env
PORT=3001
AI_API_KEY=你的_AI_API_Key
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o
ALLOWED_ORIGINS=http://localhost:5173
PROXY_URL=
```

说明：

- `AI_API_KEY` 是调用 AI 分析接口所必需的配置。
- `AI_BASE_URL` 支持填写兼容 OpenAI API 格式的服务地址。
- `AI_MODEL` 用于指定食物识别和营养分析模型。
- `PROXY_URL` 为可选代理配置。

### 前端 `frontend/.env`

```env
VITE_API_URL=http://localhost:3001/api
```

开发环境也可以不配置 `VITE_API_URL`，默认使用 `/api` 并通过 Vite 代理到后端。

## 本地运行

### 启动后端

```bash
cd server
npm install
npm run dev
```

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

启动后访问：

```text
http://localhost:5173
```

## 构建命令

### 后端构建

```bash
cd server
npm run build
npm run start
```

### 前端构建

```bash
cd frontend
npm run build
npm run preview
```

## 注意事项

- `.env`、`node_modules`、`dist` 和 `server/data` 已在 `.gitignore` 中排除。
- 食物识别依赖 AI API Key，未配置时后端可以启动，但识别接口无法正常工作。
- `server/data/alittleweight.db` 是本地数据文件，删除后饮食、体重、目标和收藏数据会丢失。
- 当前后端代码允许连接自签名证书的内部 API，生产环境部署前建议重新评估该配置。
