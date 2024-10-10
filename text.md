# 项目工作流程和代码复用指南

## 组件结构

我们的项目使用了以下主要组件：

1. NavBar.vue：主导航栏组件
2. SubWindow.vue：可复用的子窗口组件
3. DrawingLayer.vue：绘图层组件
4. IconLayer.vue：图标层组件

## 工作流程

1. 在 NavBar.vue 中定义主要的导航结构和 accordion 项。
2. 使用 SubWindow.vue 作为可复用组件来显示每个 accordion 项的内容。
3. 在 stores/mapUI.js 中管理状态和交互逻辑。
4. 使用 DrawingLayer.vue 和 IconLayer.vue 来处理地图上的绘图和图标显示。

## 添加新的 Accordion 项

要添加新的 accordion 项（例如第三个 accordion），请按照以下步骤操作：

1. 在 NavBar.vue 中的 menuItems 数组中添加新项：

   ```javascript
   const menuItems = [
     // ... 现有项 ...
     { icon: 'i-heroicons-shield-check-20-solid', label: 'Safety' },
   ]
   ```

2. 在 NavBar.vue 的模板中添加新的 SubWindow 组件：

   ```vue
   <SubWindow
     v-if="item.label === 'Safety'"
     :current-subwindow="safetySubwindow"
     :max-subwindow="2"
     :progress-percentage="safetyProgressPercentage"
     :title="safetyContent.title"
     :icon="safetyContent.icon"
     :paragraph="safetyContent.description"
     :icon-grid="safetySubwindow === 1 ? safetyIconGrid : null"
     @prev="prevSafetySubwindow"
     @next="nextSafetySubwindow"
   >
   </SubWindow>
   ```

3. 在 NavBar.vue 的 <script setup> 中添加必要的响应式变量和函数：

   ```javascript
   const safetySubwindow = ref(1)
   const safetyProgressPercentage = computed(
     () => (safetySubwindow.value / 2) * 100
   )

   const safetyContent = computed(() => {
     const contents = {
       1: {
         title: 'Mark safe and unsafe areas',
         icon: 'i-heroicons-shield-check-20-solid',
         description:
           'Select an icon and place it on the map to mark safe or unsafe locations.',
       },
       2: {
         title: 'Describe safety concerns',
         icon: 'i-heroicons-chat-bubble-left-20-solid',
         description:
           'Click on the icons you placed and add comments to explain your safety concerns or positive aspects.',
       },
     }
     return contents[safetySubwindow.value] || { title: '', description: '' }
   })

   const safetyIconGrid = computed(() => ({
     title: 'Select an icon:',
     icons: [
       { name: 'safe', src: safeIcon },
       { name: 'unsafe', src: unsafeIcon },
     ],
     onSelect: selectSafetyIcon,
   }))

   function nextSafetySubwindow() {
     if (safetySubwindow.value < 2) {
       safetySubwindow.value++
     }
   }

   function prevSafetySubwindow() {
     if (safetySubwindow.value > 1) {
       safetySubwindow.value--
     }
   }

   function selectSafetyIcon(iconName: string) {
     console.log('Selected safety icon:', iconName)
     mapUIStore.activateSafetyDrawing(iconName)
   }
   ```

4. 在 stores/mapUI.js 中添加新的方法来处理安全图标的绘制：

   ```javascript
   function activateSafetyDrawing(iconName) {
     currentSafetyIcon.value = iconName
     drawType.value = 'Point'
     drawEnable.value = true
   }

   // 在 return 语句中添加新的状态和方法
   return {
     // ... 现有的返回项 ...
     currentSafetyIcon,
     activateSafetyDrawing,
   }
   ```

5. 如果需要，在 DrawingLayer.vue 中更新 getIconForFeature 函数以支持新的安全图标：
   ```javascript
   function getIconForFeature(feature) {
     if (feature.iconName) {
       switch (feature.iconName) {
         // ... 现有的 case ...
         case 'safe':
           return safeIcon
         case 'unsafe':
           return unsafeIcon
         default:
           return getIconForPoint(feature)
       }
     }
     return getIconForPoint(feature)
   }
   ```

通过遵循这个工作流程和代码结构，您可以轻松地添加新的 accordion 项并保持代码风格的一致性。
