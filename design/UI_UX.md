文档遵循 Apple Human Interface Guidelines (HIG)，采用莫兰迪色系，并针对 Dashboard 进行了层级化的极简设计。

---

# Ruskview UX 设计规范文档 (v1.0)

## 1. 设计理念与系统规范
*   **平台**: macOS (AppKit / SwiftUI)
*   **风格**: Native macOS, Minimalist, Apple Design 
*   **导航**: 侧边栏 (Sidebar) + 主内容区 (Content)
*   **菜单**: 仅使用 macOS 系统原生菜单栏 (System Menu Bar)，应用内无额外 Hamburger Menu。

### 1.1 色彩系统 (Morandi Palette)
所有颜色均使用 `rgba` 格式，区分 Light Mode (浅色) 和 Dark Mode (深色)。

**主题 A: 莫兰迪浅色 (Light Mode)**
*   **背景底色 (App Background):** `rgba(242, 240, 235, 1.0)` (米灰色，温暖柔和)
*   **侧边栏背景 (Sidebar Bg):** `rgba(230, 228, 224, 0.9)` (半透明，配合 NSVisualEffectView)
*   **卡片/容器背景 (Surface):** `rgba(255, 255, 255, 0.6)` (磨砂玻璃感)
*   **主色调 - 绿色 (Healthy/Safe):** `rgba(154, 179, 159, 1.0)` (灰豆绿)
*   **辅助色 - 蓝色 (Info/Primary):** `rgba(139, 162, 176, 1.0)` (雾霾蓝)
*   **辅助色 - 红色 (Error/Critical):** `rgba(196, 149, 149, 1.0)` (干枯玫瑰红)
*   **辅助色 - 黄色 (Warning):** `rgba(219, 196, 140, 1.0)` (姜黄色)
*   **辅助色 - 棕色 (Neutral/Secondary):** `rgba(176, 162, 148, 1.0)` (卡其棕)
*   **主文本 (Text Primary):** `rgba(60, 60, 60, 1.0)`
*   **次文本 (Text Secondary):** `rgba(120, 120, 120, 1.0)`

**主题 B: 莫兰迪深色 (Dark Mode)**
*   **背景底色 (App Background):** `rgba(43, 45, 48, 1.0)` (深岩灰)
*   **侧边栏背景 (Sidebar Bg):** `rgba(35, 37, 40, 0.9)`
*   **卡片/容器背景 (Surface):** `rgba(60, 63, 67, 0.5)`
*   **主色调 - 绿色:** `rgba(105, 128, 110, 1.0)` (低饱和深绿)
*   **辅助色 - 蓝色:** `rgba(95, 116, 130, 1.0)`
*   **辅助色 - 红色:** `rgba(156, 105, 105, 1.0)`
*   **辅助色 - 黄色:** `rgba(173, 153, 105, 1.0)`
*   **辅助色 - 棕色:** `rgba(128, 115, 103, 1.0)`
*   **主文本 (Text Primary):** `rgba(230, 230, 230, 1.0)`
*   **次文本 (Text Secondary):** `rgba(160, 160, 160, 1.0)`

### 1.2 图标系统
使用 Apple **SF Symbols**。确保图标支持 Scale (Small/Medium/Large) 和 Weight (Regular/Semibold)。

---

## 2. 界面布局与功能规范

### 2.1 侧边栏 (Sidebar)
*   **材质**: 使用 `NSVisualEffectView` (Material: `sidebar`)。
*   **选中态**: 使用系统默认的高亮圆角矩形，颜色跟随系统强调色或自定义为“雾霾蓝”。
*   **菜单项**:
    1.  **Dashboard**: `chart.bar.doc.horizontal`
    2.  **Search**: `magnifyingglass`
    3.  **Operations**: `wrench.and.screwdriver`
        *   *Sub: Indices*: `doc.text`
        *   *Sub: Snapshots*: `camera`
    4.  **Cluster**: `server.rack`
        *   *Sub: Nodes*: `cpu`
        *   *Sub: Shards*: `square.grid.3x3`
    5.  **Security**: `lock.shield`
        *   *Sub: Users*: `person.2`

### 2.2 Dashboard (核心交互区)
基于“分级展示”原则设计。数据源建议：`_cluster/health`, `_nodes/stats`, `_cluster/stats`。

#### Level 1: 核心健康概览 (Hero Section)
占据顶部 40% 区域，大卡片容器。
*   **UI 元素**:
    *   **Cluster Health**: 左侧大图标。
        *   Green: `checkmark.seal.fill` (Color: 灰豆绿)
        *   Yellow: `exclamationmark.triangle.fill` (Color: 姜黄色)
        *   Red: `xmark.octagon.fill` (Color: 干枯玫瑰红)
        *   Text: "Cluster is Healthy" (H1, Semibold)
    *   **Resource Rings**: 右侧三个环形进度条。
        *   **CPU**: Icon `cpu` (Center of ring).
        *   **RAM**: Icon `memorychip`.
        *   **Disk**: Icon `internaldrive`.
        *   *Color Logic*: <70% Green, 70-90% Yellow, >90% Red.
*   **交互**: 点击整个卡片跳转至 `Cluster > Nodes` 页面。

#### Level 2: 核心指标带 (Stats Strip)
位于中部，一行两个长方形卡片，背景色使用“卡其棕”或“雾霾蓝”的低透明度版本。
*   **Widget A: Indexing Rate**
    *   Icon: `arrow.up.doc.fill` (Large, Leading alignment)
    *   Value: "1,240 / min" (H2, Monospaced numbers)
    *   Sparkline: 简单的平滑曲线图背景。
*   **Widget B: Query Rate**
    *   Icon: `magnifyingglass.circle.fill`
    *   Value: "850 / sec"
    *   Sparkline: 简单的平滑曲线图背景。
*   **交互**: Hover 时显示具体数值 tooltip，点击无跳转（或弹出详细趋势图）。

#### Level 3: 控制中心 (Control Pods)
位于底部，采用 iOS Control Center 风格的圆角正方形网格 (Grid Layout)。
*   **样式**: 小方块，中心图标 + 下方小文字。背景色为半透明 Surface。
*   **Pods 内容**:
    1.  **Node Count**:
        *   Icon: `server.rack`
        *   Text: "3 Nodes"
        *   *Action*: Popover 显示节点列表 (Name, IP, Status)。
    2.  **Shards**:
        *   Icon: `square.grid.2x2`
        *   Text: "124 Shards"
        *   *Action*: Popover 显示 Unassigned Shards 数量。
    3.  **Pending Tasks**:
        *   Icon: `hourglass`
        *   Text: "0 Tasks"
        *   *Action*: 如果 >0，点击显示任务列表。
    4.  **License**:
        *   Icon: `scroll`
        *   Text: "Basic" / "Gold"
        *   *Action*: Popover 显示过期时间。

### 2.3 Search (搜索)
*   **布局**: 上下分栏 (Split View)。
*   **顶部 (Editor)**:
    *   左侧: 请求方法 (GET/POST) 下拉框 + API 路径输入框。
    *   右侧: "Run" 按钮 (Icon: `play.fill`, Color: 灰豆绿)。
    *   编辑器区域: JSON DSL 编辑器，支持基本的高亮。
*   **底部 (Results)**:
    *   Tab 切换: "Pretty JSON" (Icon: `doc.text`) / "Table" (Icon: `tablecells`).
    *   Table 模式下: 自动展平 `_source` 字段。

### 2.4 Operations (运维) & Cluster (集群)
*   **通用列表页设计 (List View)**:
    *   使用 `NSTableView` 或 SwiftUI `Table`。
    *   **操作列**: 行末悬浮显示操作图标 (Delete: `trash`, Close: `lock`, Snapshot: `camera`).
    *   **状态列**: 使用小圆点 (`circle.fill`) + 文字表示状态 (Green/Red)。
*   **详情页**: 侧滑抽屉 (Inspector style) 或 Modal，而非全屏跳转。

---

## 3. 菜单栏系统设计 (System Menu Bar)
不使用应用内导航栏，功能收纳至 macOS 顶部菜单。

*   **Ruskview**: `Preferences` (`Cmd+,`) -> 打开设置窗口（连接管理、主题切换）。
*   **View**:
    *   `Refresh` (`Cmd+R`): 强制刷新 Dashboard 数据。
    *   `Toggle Sidebar` (`Cmd+Ctrl+S`).
*   **Cluster** (Dynamic Menu):
    *   `Connect...`: 打开连接管理器。
    *   `Export State`: 导出当前集群状态报告。
*   **User**:
    *   `Profile`: 如果有安全认证，显示当前登录用户。
    *   `Logout`.

---

## 4. 交互细节与动画 (Micro-interactions)

*   **Hover Effects**: 所有可点击的卡片和 Pods，Hover 时背景不透明度增加 10% (Brighten)，光标变为 `pointer`。
*   **Popovers**: 点击 Level 3 的 Pods 时，使用 macOS 原生 `NSPopover`，带箭头指向触发源，背景使用“磨砂玻璃 (Blur)”。
*   **Transitions**: 侧边栏切换页面时，内容区使用 `Cross Dissolve` (0.2s) 动画，避免生硬切换。

## 5. API 集成参考 (Code Agent Note)

*   **Cluster Overview**: `GET /_cluster/health`, `GET /_cluster/stats`
*   **Node Stats**: `GET /_nodes/stats/os,process,jvm,fs`
*   **Indices**: `GET /_cat/indices?format=json`
*   **Search**: `POST /{index}/_search`
*   **Permissions**: `GET /_security/user` (x-pack only)

---

**给 Code Agent 的提示**:
在实现 UI 时，请优先使用 SwiftUI 的 `LazyVGrid` 实现 Dashboard 的 Pods 布局，使用 `HStack`/`VStack` 组合实现卡片。颜色定义请封装在 `Color+Extension.swift` 中以便统一管理。图标调用请封装在 `IconConstants.swift`。