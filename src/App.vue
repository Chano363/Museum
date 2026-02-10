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
        @displayGestureHint="displayGestureHint"
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
          name: '卣（盛酒器）',
          dynasty: '商代',
          description: '商代青铜盛酒器，造型庄重，纹饰精美，是中国古代青铜文明的重要象征。',
          model: 'external',
          modelPath: '/3Dmodels/卣（盛酒器）/you_wine_vessel_12th-11th_c_bce/scene.gltf',
          iconPath: '/3Dmodels/卣（盛酒器）/you_wine_vessel_12th-11th_c_bce/textures/Mia_017453_Fangyou_250k_diffuse.jpeg',
          color: '#cd7f32' // 青铜色
        },
        {
          id: 2,
          name: '双鸮形卣（盛酒器）',
          dynasty: '商代',
          description: '商代双鸮形青铜盛酒器，造型独特，工艺精湛，反映了商代高超的青铜铸造技术。',
          model: 'external',
          modelPath: '/3Dmodels/双鸮形卣（盛酒器）/you_vessel_in_double-owl_shape_12th-11th_c_bce/scene.gltf',
          iconPath: '/3Dmodels/双鸮形卣（盛酒器）/mia_6003189_full.jpg',
          color: '#cd7f32' // 青铜色
        },
        {
          id: 3,
          name: '爵（饮酒器）',
          dynasty: '商代',
          description: '商代青铜饮酒器，形制规整，纹饰清晰，是研究商代酒文化的重要实物资料。',
          model: 'external',
          modelPath: '/3Dmodels/爵（饮酒器）/jue_wine_vessel_12th11th_c_bce/scene.gltf',
          iconPath: '/3Dmodels/爵（饮酒器）/jue_wine_vessel_12th11th_c_bce/textures/Mia_001146_Jue_100k_baseColor.jpeg',
          color: '#cd7f32' // 青铜色
        },
        {
          id: 4,
          name: '瓷器花瓶',
          dynasty: '明代',
          description: '明代青花瓷花瓶，胎质细腻，釉色莹润，纹饰流畅，是中国陶瓷艺术的珍品。',
          model: 'external',
          modelPath: '/3Dmodels/瓷器花瓶/chinese_porcelain_vase/scene.gltf',
          iconPath: '/3Dmodels/瓷器花瓶/chinese_porcelain_vase/textures/defaultMat_baseColor.jpeg',
          color: '#2e8b57' // 青花色
        },
        {
          id: 5,
          name: '簋（食器）',
          dynasty: '周代',
          description: '周代青铜食器，造型典雅，工艺精湛，是中国古代青铜文明的重要象征。',
          model: 'external',
          modelPath: '/3Dmodels/簋（食器）/gui_chinese_food_vessel/scene.gltf',
          iconPath: '/3Dmodels/簋（食器）/gui_chinese_food_vessel/textures/150625_mia337_000833_100_64Kfaces_OBJ3_baseColor.jpeg',
          color: '#cd7f32' // 青铜色
        },
        {
          id: 6,
          name: '镀金银器装裱中国碗',
          dynasty: '清代',
          description: '清代镀金银器装裱中国碗，工艺精湛，造型优美，是中国传统工艺的杰出代表。',
          model: 'external',
          modelPath: '/3Dmodels/镀金银器装裱中国碗/silver_gilt_mounted_chinese_bowl/scene.gltf',
          iconPath: '/3Dmodels/镀金银器装裱中国碗/silver_gilt_mounted_chinese_bowl/textures/material_0_baseColor.jpeg',
          color: '#c0c0c0' // 银色
        },
        {
          id: 7,
          name: '黄金面具（三星堆）',
          dynasty: '商代',
          description: '三星堆文化黄金面具，造型奇特，工艺精湛，是中国古代文明的重要实物资料。',
          model: 'external',
          modelPath: '/3Dmodels/黄金面具（三星堆）/sanxingdui/scene.gltf',
          iconPath: '/3Dmodels/黄金面具（三星堆）/sanxingdui/textures/SM_SXD_FACE_baseColor.jpeg',
          color: '#ffd700' // 金色
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
      }, 800)
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
      }, 800)
    },
    displayGestureHint(hint) {
      this.showGestureHint = true
      this.currentGestureHint = hint
      setTimeout(() => {
        this.showGestureHint = false
      }, 800)
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
