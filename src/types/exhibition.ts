export interface ExhibitionItem {
  id: string
  title: string
  description: string
  imageUrl: string
  category: string
  year?: string
  artist?: string
}

export interface ExhibitionState {
  currentItem: ExhibitionItem | null
  currentIndex: number
  items: ExhibitionItem[]
  zoomLevel: number
  isDragging: boolean
  dragPosition: { x: number; y: number }
}