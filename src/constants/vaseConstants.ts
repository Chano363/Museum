export interface BaseModel {
  id: string
  name: string
  modelPath: string
  iconPath: string
  description: string
  color: string
}

export interface PromptTemplate {
  id: string
  name: string
  prompt: string
}

export const BASE_MODELS: BaseModel[] = [
  {
    id: 'vase',
    name: '瓷器花瓶',
    modelPath: '/3Dmodels/瓷器花瓶/chinese_porcelain_vase/scene.gltf',
    iconPath: '/3Dmodels/瓷器花瓶/chinese_porcelain_vase/textures/defaultMat_baseColor.jpeg',
    description: '白色瓷器花瓶，适合花卉、山水图案',
    color: '#f5f5f5'
  },
  {
    id: 'gui',
    name: '簋（食器）',
    modelPath: '/3Dmodels/簋（食器）/gui_chinese_food_vessel/scene.gltf',
    iconPath: '/3Dmodels/簋（食器）/gui_chinese_food_vessel/textures/150625_mia337_000833_100_64Kfaces_OBJ3_baseColor.jpeg',
    description: '青铜食器，适合传统纹饰',
    color: '#cd7f32'
  },
  {
    id: 'jue',
    name: '爵（饮酒器）',
    modelPath: '/3Dmodels/爵（饮酒器）/jue_wine_vessel_12th11th_c_bce/scene.gltf',
    iconPath: '/3Dmodels/爵（饮酒器）/jue_wine_vessel_12th11th_c_bce/textures/Mia_001146_Jue_100k_baseColor.jpeg',
    description: '青铜饮酒器，适合简洁纹饰',
    color: '#cd7f32'
  }
]

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'floral',
    name: '花卉图案',
    prompt: '中国传统花卉图案，牡丹、莲花、菊花，瓷器风格，精美细腻，高清纹理'
  },
  {
    id: 'landscape',
    name: '山水图案',
    prompt: '中国山水画风格，水墨意境，远山近水，诗意盎然，瓷器装饰，高清纹理'
  },
  {
    id: 'geometric',
    name: '几何图案',
    prompt: '中国传统几何纹样，回纹、云纹，对称美感，瓷器装饰，高清纹理'
  },
  {
    id: 'dragon',
    name: '龙凤图案',
    prompt: '中国传统龙凤纹样，祥云缭绕，华贵典雅，瓷器装饰，高清纹理'
  },
  {
    id: 'bird',
    name: '花鸟图案',
    prompt: '中国花鸟画风格，梅兰竹菊，雅致清新，瓷器装饰，高清纹理'
  },
  {
    id: 'custom',
    name: '自定义',
    prompt: ''
  }
]

export const MODEL_PREVIEW_CONFIG = {
  cameraOrbit: '0deg 75deg 2m',
  fieldOfView: '30deg',
  exposure: '1',
  shadowIntensity: '1',
  autoRotate: true,
  autoRotateDelay: 3000
}

export const CANVAS_CONFIG = {
  width: 400,
  height: 400,
  defaultBrushSize: 4,
  defaultBrushColor: '#ffffff',
  backgroundColor: '#1a1a1a'
}

export function getBaseModelById(id: string): BaseModel | undefined {
  return BASE_MODELS.find(model => model.id === id)
}

export function getPromptTemplateById(id: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES.find(template => template.id === id)
}

export function buildPrompt(templateId: string, customPrompt: string = ''): string {
  const template = getPromptTemplateById(templateId)
  const basePrompt = template?.prompt || ''
  
  if (templateId === 'custom' && customPrompt) {
    return `${customPrompt}，masterpiece, best quality`
  }
  
  if (customPrompt) {
    return `${basePrompt}，${customPrompt}，masterpiece, best quality`
  }
  
  return `${basePrompt}，masterpiece, best quality`
}
