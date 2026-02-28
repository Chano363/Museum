<template>
  <div class="app-container">
    <transition name="fade" mode="out-in">
      <WelcomeView 
        v-if="currentView === 'welcome'" 
        @enter-museum="enterMuseum"
        @enter-sketch="enterSketch"
        @enter-user-gallery="enterUserGallery"
      />
      
      <MainView 
        v-else-if="currentView === 'main'"
        :selectedArtifact="selectedArtifact"
        @nextModel="nextModel"
        @prevModel="prevModel"
        @displayGestureHint="displayGestureHint"
        @toggleThumbBar="(autoSwitch) => toggleThumbBar(autoSwitch)"
        @back="goToWelcome"
      />
      
      <UserGalleryView 
        v-else-if="currentView === 'userGallery'"
        :selectedIndex="userGalleryIndex"
        @nextModel="nextUserArtwork"
        @prevModel="prevUserArtwork"
        @displayGestureHint="displayGestureHint"
        @toggleThumbBar="(autoSwitch) => toggleUserThumbBar(autoSwitch)"
        @back="goToWelcome"
        @loaded="onUserGalleryLoaded"
      />
      
      <SketchView 
        v-else-if="currentView === 'sketch'"
        @back="goToWelcome"
        @enter-museum="enterMuseum"
        @save-to-gallery="handleSaveToGallery"
        @delete-artwork="handleDeleteArtwork"
      />
    </transition>
    
    <ThumbBar 
      v-if="currentView === 'main'"
      :artifacts="artifacts" 
      :selectedIndex="selectedArtifactIndex"
      :visible="showThumbBar"
      @select="selectArtifact"
      @close="showThumbBar = false"
    />
    
    <ThumbBar 
      v-if="currentView === 'userGallery'"
      :artifacts="userArtworks" 
      :selectedIndex="userGalleryIndex"
      :visible="showUserThumbBar"
      @select="selectUserArtwork"
      @close="showUserThumbBar = false"
    />
    
    <GestureHint v-if="showGestureHint" :hint="currentGestureHint" />
    
    <SettingView 
      v-if="showSettings"
      @close="showSettings = false"
    />
  </div>
</template>

<script>
import WelcomeView from './components/WelcomeView.vue'
import MainView from './components/MainView.vue'
import UserGalleryView from './components/UserGalleryView.vue'
import SketchView from './components/SketchView.vue'
import ThumbBar from './components/ThumbBar.vue'
import GestureHint from './components/GestureHint.vue'
import SettingView from './components/SettingView.vue'
import { Howl } from 'howler'
import { ModelPreloader } from './services/modelPreloader'
import { BASE_MODELS } from './constants/vaseConstants'

export default {
  name: 'App',
  components: {
    WelcomeView,
    MainView,
    UserGalleryView,
    SketchView,
    ThumbBar,
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
          dynasty: '商代晚期',
          era: '公元前12世纪 – 前11世纪',
          material: '青铜',
          dimensions: '高 32.54 × 宽 14.6 × 深 12.86 厘米，重 2.9 公斤',
          description: '商代青铜盛酒器，造型庄重，纹饰精美，是中国古代青铜文明的重要象征。',
          model: 'external',
          modelPath: '/3Dmodels/卣（盛酒器）/you_wine_vessel_12th-11th_c_bce/scene.gltf',
          iconPath: '/3Dmodels/卣（盛酒器）/you_wine_vessel_12th-11th_c_bce/textures/Mia_017453_Fangyou_250k_diffuse.jpeg',
          color: '#cd7f32'
        },
        {
          id: 2,
          name: '爵（饮酒器）',
          dynasty: '商代晚期',
          era: '公元前12世纪 – 前11世纪',
          material: '青铜',
          dimensions: '高 23.97 × 宽 17.78 × 深 12.54 厘米，重 1.1 公斤',
          description: '商代青铜饮酒器，形制规整，纹饰清晰，是研究商代酒文化的重要实物资料。',
          model: 'external',
          modelPath: '/3Dmodels/爵（饮酒器）/jue_wine_vessel_12th11th_c_bce/scene.gltf',
          iconPath: '/3Dmodels/爵（饮酒器）/jue_wine_vessel_12th11th_c_bce/textures/Mia_001146_Jue_100k_baseColor.jpeg',
          color: '#cd7f32'
        },
        {
          id: 3,
          name: '双鸮形卣（盛酒器）',
          dynasty: '商代晚期',
          era: '公元前12世纪 – 前11世纪',
          material: '青铜',
          dimensions: '高 17.78 × 宽 15.08 × 深 11.75 厘米，重 1.7 公斤',
          description: '商代双鸮形青铜盛酒器，造型独特，工艺精湛，反映了商代高超的青铜铸造技术。',
          model: 'external',
          modelPath: '/3Dmodels/双鸮形卣（盛酒器）/you_vessel_in_double-owl_shape_12th-11th_c_bce/scene.gltf',
          iconPath: '/3Dmodels/双鸮形卣（盛酒器）/mia_6003189_full.jpg',
          color: '#cd7f32'
        },
        {
          id: 4,
          name: '黄金面具',
          dynasty: '商代',
          era: '约公元前1600年 – 前1046年',
          material: '黄金（自然金，捶揲成形）',
          dimensions: '宽约 40 厘米，高约 27 厘米，重约 280 克',
          description: '三星堆文化黄金面具，造型奇特，工艺精湛，是中国古代文明的重要实物资料。',
          model: 'external',
          modelPath: '/3Dmodels/黄金面具（三星堆）/sanxingdui/scene.gltf',
          iconPath: '/3Dmodels/黄金面具（三星堆）/sanxingdui/textures/SM_SXD_FACE_baseColor.jpeg',
          color: '#ffd700'
        },
        {
          id: 5,
          name: '簋（食器）',
          dynasty: '商代晚期',
          era: '公元前12世纪',
          material: '青铜',
          dimensions: '高 17.8 × 宽 25.3 厘米，重 4 公斤',
          description: '商代青铜食器，造型典雅，工艺精湛，是中国古代青铜文明的重要象征。',
          model: 'external',
          modelPath: '/3Dmodels/簋（食器）/gui_chinese_food_vessel/scene.gltf',
          iconPath: '/3Dmodels/簋（食器）/gui_chinese_food_vessel/textures/150625_mia337_000833_100_64Kfaces_OBJ3_baseColor.jpeg',
          color: '#cd7f32'
        },
        {
          id: 6,
          name: '瓷器花瓶',
          dynasty: '明代',
          era: '公元17世纪',
          material: '陶瓷；瓷器',
          dimensions: '高 26 × 宽 17 × 深 17 厘米',
          description: '景德镇产瓷瓶，胎质细腻，釉色莹润，纹饰流畅，是中国陶瓷艺术的珍品。',
          model: 'external',
          modelPath: '/3Dmodels/瓷器花瓶/chinese_porcelain_vase/scene.gltf',
          iconPath: '/3Dmodels/瓷器花瓶/chinese_porcelain_vase/textures/defaultMat_baseColor.jpeg',
          color: '#2e8b57'
        },
        {
          id: 7,
          name: '镀金银器装裱中国碗',
          dynasty: '明代',
          era: '万历年间（1573–1620年）',
          material: '陶瓷；银质底座',
          dimensions: '高 13.5 × 宽 21.5 厘米',
          description: '明代镀金银器装裱中国碗，碗外缘饰飞马纹边框，碗壁绘花卉纹样，工艺精湛。',
          model: 'external',
          modelPath: '/3Dmodels/镀金银器装裱中国碗/silver_gilt_mounted_chinese_bowl/scene.gltf',
          iconPath: '/3Dmodels/镀金银器装裱中国碗/silver_gilt_mounted_chinese_bowl/textures/material_0_baseColor.jpeg',
          color: '#c0c0c0'
        }
      ],
      selectedArtifactIndex: 0,
      showGestureHint: false,
      currentGestureHint: '',
      showSettings: false,
      showThumbBar: false,
      userArtworks: [],
      userGalleryIndex: 0,
      showUserThumbBar: false,
      sounds: {
        modelChange: null
      },
      generatedArtifactIdCounter: 1000
    }
  },
  mounted() {
    console.log('App组件已挂载')
    document.documentElement.style.setProperty('--brightness', '1')
    window.Howl = Howl
    this.initSounds()
    this.startModelPreloading()
    console.log('App组件初始化完成')
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
    startModelPreloading() {
      ModelPreloader.preloadAllModels().catch(error => {
        console.error('❌ 预加载失败:', error)
      })
    },
    playSound(soundName) {
      if (this.sounds[soundName] && typeof this.sounds[soundName].play === 'function') {
        this.sounds[soundName].play()
      }
    },
    goToWelcome() {
      this.currentView = 'welcome'
    },
    enterMuseum() {
      console.log('=== 进入博物馆 ===')
      this.currentView = 'main'
    },
    enterSketch() {
      console.log('=== 进入纹理创作 ===')
      this.currentView = 'sketch'
    },
    enterUserGallery() {
      console.log('=== 进入我的作品 ===')
      this.currentView = 'userGallery'
    },
    selectArtifact(index) {
      console.log('=== 选择文物 ===', index)
      this.selectedArtifactIndex = index
    },
    toggleSettings() {
      this.showSettings = !this.showSettings
    },
    toggleThumbBar(autoSwitch = false) {
      this.showThumbBar = !this.showThumbBar
      
      if (this.showThumbBar && autoSwitch) {
        setTimeout(() => {
          if (this.showThumbBar) {
            this.nextModel()
            this.showThumbBar = false
          }
        }, 500)
      }
    },
    nextModel() {
      this.selectedArtifactIndex = (this.selectedArtifactIndex + 1) % this.artifacts.length
    },
    prevModel() {
      this.selectedArtifactIndex = (this.selectedArtifactIndex - 1 + this.artifacts.length) % this.artifacts.length
    },
    displayGestureHint(hint) {
      this.showGestureHint = true
      this.currentGestureHint = hint
      setTimeout(() => {
        this.showGestureHint = false
      }, 800)
    },
    handleSaveToGallery(data) {
      console.log('=== 保存作品到画廊 ===', data)
      
      const baseModel = BASE_MODELS.find(m => m.id === data.modelId)
      if (!baseModel) return
      
      const newArtifact = {
        id: this.generatedArtifactIdCounter++,
        name: `创作作品 #${data.id}`,
        dynasty: '当代创作',
        era: new Date().toLocaleDateString('zh-CN'),
        material: 'AI生成纹理',
        dimensions: '自定义图案',
        description: '用户通过AI生成的纹理作品，可在博物馆中查看。',
        model: 'external',
        modelPath: baseModel.modelPath,
        iconPath: data.imageUrl || data.textureUrl,
        color: baseModel.color,
        isGenerated: true,
        textureUrl: data.textureUrl
      }
      
      this.artifacts.push(newArtifact)
      
      this.displayGestureHint('作品已添加到博物馆')
    },
    
    handleDeleteArtwork(artworkId) {
      const index = this.artifacts.findIndex(a => a.id === artworkId || a.name?.includes(`#${artworkId}`))
      if (index !== -1) {
        this.artifacts.splice(index, 1)
        if (this.selectedArtifactIndex >= this.artifacts.length) {
          this.selectedArtifactIndex = Math.max(0, this.artifacts.length - 1)
        }
      }
      
      const userIndex = this.userArtworks.findIndex(a => a.id === artworkId)
      if (userIndex !== -1) {
        this.userArtworks.splice(userIndex, 1)
        if (this.userGalleryIndex >= this.userArtworks.length) {
          this.userGalleryIndex = Math.max(0, this.userArtworks.length - 1)
        }
      }
    },
    onUserGalleryLoaded(artworks) {
      this.userArtworks = artworks.map(artwork => ({
        id: artwork.id,
        name: artwork.name || `作品 #${artwork.id}`,
        dynasty: '当代创作',
        era: artwork.created_at ? new Date(artwork.created_at).toLocaleDateString('zh-CN') : '',
        material: 'AI生成纹理',
        dimensions: '自定义图案',
        description: artwork.prompt || '用户创作的纹理作品',
        model: 'external',
        modelPath: BASE_MODELS.find(m => m.id === artwork.base_model)?.modelPath || '/3Dmodels/瓷器花瓶/scene.gltf',
        iconPath: artwork.image_url || artwork.texture_url,
        color: '#cd7f32',
        isGenerated: true,
        textureUrl: artwork.texture_url || artwork.image_url,
        base_model: artwork.base_model,
        style: artwork.style
      }))
    },
    selectUserArtwork(index) {
      this.userGalleryIndex = index
    },
    toggleUserThumbBar(autoSwitch = false) {
      this.showUserThumbBar = !this.showUserThumbBar
      
      if (this.showUserThumbBar && autoSwitch) {
        setTimeout(() => {
          if (this.showUserThumbBar) {
            this.nextUserArtwork()
            this.showUserThumbBar = false
          }
        }, 500)
      }
    },
    nextUserArtwork() {
      if (this.userArtworks.length === 0) return
      this.userGalleryIndex = (this.userGalleryIndex + 1) % this.userArtworks.length
    },
    prevUserArtwork() {
      if (this.userArtworks.length === 0) return
      this.userGalleryIndex = (this.userGalleryIndex - 1 + this.userArtworks.length) % this.userArtworks.length
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
@font-face {
  font-family: 'ChillHuoKai';
  src: url('/fonts/ChillHuoKai_Regular.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'ChillHuoKaiCon';
  src: url('/fonts/ChillHuoKai_ConRegular.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'HanChan';
  src: url('/fonts/寒蝉书体 春秋 秋鸿.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

:root {
  --brightness: 1;
  --background-color: #1a1a1a;
  --text-color: #C49210;
  --font-family: 'ChillHuoKai', 'ChillHuoKaiCon', 'HanChan', sans-serif;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-family);
  background-color: var(--background-color);
  color: var(--text-color);
  filter: brightness(var(--brightness));
  transition: filter 0.3s ease;
}
</style>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  background-color: var(--background-color);
  position: relative;
  overflow: hidden;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
