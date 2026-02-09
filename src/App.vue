<template>
  <div class="app-container">
    <!-- 欢迎/引导页 -->
    <WelcomeView v-if="currentView === 'welcome'" @enter="enterMuseum" />
    
    <!-- 主界面 -->
    <div v-else-if="currentView === 'main'" class="main-interface">
      <!-- 文物缩略图栏 -->
      <ThumbBar 
        :artifacts="artifacts" 
        :selectedIndex="selectedArtifactIndex"
        @select="selectArtifact"
      />
      
      <!-- 主交互区 -->
      <MainView 
        :selectedArtifact="selectedArtifact"
        @showInfo="showArtifactInfo"
        @nextModel="nextModel"
        @showGestureHint="showGestureHint"
      />
      
      <!-- 文物详情浮层 -->
      <InfoPanel 
        v-if="showInfoPanel"
        :artifact="selectedArtifact"
        @close="showInfoPanel = false"
      />
      
      <!-- 手势提示泡 -->
      <GestureHint v-if="showGestureHint" :hint="currentGestureHint" />
      
      <!-- 设置按钮 -->
      <button class="settings-btn" @click="toggleSettings">
        ⚙️
      </button>
      
      <!-- 设置页 -->
      <SettingView 
        v-if="showSettings"
        @close="showSettings = false"
      />
    </div>
  </div>
</template>

<script>
import WelcomeView from './components/WelcomeView.vue'
import ThumbBar from './components/ThumbBar.vue'
import MainView from './components/MainView.vue'
import InfoPanel from './components/InfoPanel.vue'
import GestureHint from './components/GestureHint.vue'
import SettingView from './components/SettingView.vue'
import { Howl } from 'howler'

export default {
  name: 'App',
  components: {
    WelcomeView,
    ThumbBar,
    MainView,
    InfoPanel,
    GestureHint,
    SettingView
  },
  data() {
    return {
      currentView: 'welcome',
      artifacts: [
        {
          id: 1,
          name: '古代花瓶',
          dynasty: '宋代',
          description: '宋代青花瓷瓶，造型优美，纹饰精致，是宋代陶瓷艺术的代表作品。',
          model: 'cube', // 使用简单立方体
          color: '#3498db' // 蓝色
        },
        {
          id: 2,
          name: '青铜雕像',
          dynasty: '汉代',
          description: '汉代青铜雕像，姿态庄重，工艺精湛，反映了汉代高超的青铜铸造技术。',
          model: 'sphere', // 使用简单球体
          color: '#e67e22' // 橙色
        },
        {
          id: 3,
          name: '古代钱币',
          dynasty: '唐代',
          description: '唐代钱币，形制规整，文字清晰，是研究唐代经济的重要实物资料。',
          model: 'cylinder', // 使用简单圆柱体
          color: '#27ae60' // 绿色
        },
        {
          id: 4,
          name: '龙戏珠',
          dynasty: '清代',
          description: '清代龙戏珠雕塑，工艺精湛，造型生动，是中国传统工艺的杰出代表。',
          model: 'external', // 使用外部GLTF模型
          modelPath: '/3Dmodels/dragon_with_pearl/scene.gltf',
          color: '#8b0000' // 红色
        },
        {
          id: 5,
          name: '青铜器鼎',
          dynasty: '商代',
          description: '商代青铜器鼎，造型庄重，纹饰精美，是中国古代青铜文明的重要象征。',
          model: 'external', // 使用外部OBJ模型
          modelPath: '/3Dmodels/chinese-bronze-ding-vessel/Figur-Opferschale-Chinesisch-v2_1M/Figur-Trog-Chinesisch-v2_1M.obj',
          color: '#cd7f32' // 青铜色
        },
        {
          id: 6,
          name: '青花瓷花瓶',
          dynasty: '明代',
          description: '明代青花瓷花瓶，胎质细腻，釉色莹润，纹饰流畅，是中国陶瓷艺术的珍品。',
          model: 'external', // 使用外部OBJ模型
          modelPath: '/3Dmodels/porcelain-china-vase/fin_cy_180313_low.obj',
          color: '#2e8b57' // 青花色
        },
        {
          id: 7,
          name: '铜香炉',
          dynasty: '清代',
          description: '清代铜香炉，造型典雅，工艺精湛，是中国传统香道文化的重要器物。',
          model: 'external', // 使用外部OBJ模型
          modelPath: '/3Dmodels/chinese-censer/model.obj',
          color: '#b87333' // 铜色
        }
      ],
      selectedArtifactIndex: 0,
      showInfoPanel: false,
      showGestureHint: false,
      currentGestureHint: '',
      showSettings: false,
      sounds: {
        modelChange: null
      }
    }
  },
  mounted() {
    // 初始化全局CSS变量
    document.documentElement.style.setProperty('--brightness', '1')
    // 将Howler挂载到window对象
    window.Howl = Howl
    // 初始化音效
    this.initSounds()
  },
  methods: {
    initSounds() {
      try {
        this.sounds.modelChange = new Howl({
          src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'],
          volume: 0.5
        })
      } catch (error) {
        console.error('音效初始化失败:', error)
      }
    },
    playSound(soundName) {
      if (this.sounds[soundName] && typeof this.sounds[soundName].play === 'function') {
        this.sounds[soundName].play()
      }
    },
    enterMuseum() {
      this.currentView = 'main'
    },
    selectArtifact(index) {
      console.log('选择文物:', index, this.artifacts[index])
      this.selectedArtifactIndex = index
      this.showGestureHint = true
      this.currentGestureHint = '模型切换成功'
      setTimeout(() => {
        this.showGestureHint = false
      }, 300)
      console.log('文物选择完成，当前选中:', this.selectedArtifactIndex)
    },
    showArtifactInfo() {
      this.showInfoPanel = true
    },
    toggleSettings() {
      this.showSettings = !this.showSettings
    },
    nextModel() {
      // 切换到下一个模型
      this.selectedArtifactIndex = (this.selectedArtifactIndex + 1) % this.artifacts.length
      this.showGestureHint = true
      this.currentGestureHint = '模型切换成功'
      setTimeout(() => {
        this.showGestureHint = false
      }, 300)
    },
    showGestureHint(hint) {
      this.showGestureHint = true
      this.currentGestureHint = hint
      setTimeout(() => {
        this.showGestureHint = false
      }, 300)
    }
  },
  computed: {
    selectedArtifact() {
      return this.artifacts[this.selectedArtifactIndex]
    }
  }
}
</script>

<style>
/* 全局样式 */
:root {
  --brightness: 1;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background-color: #f5f1e8;
  color: #3c2a1e;
  filter: brightness(var(--brightness));
  transition: filter 0.3s ease;
}
</style>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  background-color: #f5f1e8;
  position: relative;
  overflow: hidden;
}

.main-interface {
  width: 100%;
  height: 100%;
  position: relative;
}

.settings-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background-color: rgba(60, 42, 30, 0.8);
  color: #f5f1e8;
  font-size: 20px;
  cursor: pointer;
  z-index: 1000;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.settings-btn:hover {
  background-color: rgba(60, 42, 30, 1);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-btn {
    top: 15px;
    right: 15px;
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .settings-btn {
    top: 10px;
    right: 10px;
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
}
</style>
