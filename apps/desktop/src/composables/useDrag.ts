import { ref, Ref, readonly } from 'vue'

export interface UseDraggableOptions {
  onDragStart?: (event: DragEvent) => void
  onDragEnd?: (event: DragEvent) => void
  onDrop?: (event: DragEvent) => void
  dragData?: any
  disabled?: Ref<boolean> | boolean
}

export function useDraggable(element: Ref<HTMLElement | undefined>, options: UseDraggableOptions = {}) {
  const isDragging = ref(false)
  const dragOffset = ref({ x: 0, y: 0 })

  function startDrag(event: MouseEvent) {
    if (options.disabled && (typeof options.disabled === 'boolean' ? options.disabled : options.disabled.value)) {
      return
    }

    isDragging.value = true
    
    const rect = element.value?.getBoundingClientRect()
    if (rect) {
      dragOffset.value = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    if (options.onDragStart) {
      const dragEvent = new DragEvent('dragstart')
      options.onDragStart(dragEvent)
    }

    event.preventDefault()
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDragging.value || !element.value) return

    const newX = event.clientX - dragOffset.value.x
    const newY = event.clientY - dragOffset.value.y

    element.value.style.transform = `translate(${newX}px, ${newY}px)`
    element.value.style.zIndex = '9999'
  }

  function handleMouseUp(event: MouseEvent) {
    if (!isDragging.value) return

    isDragging.value = false
    
    if (element.value) {
      element.value.style.transform = ''
      element.value.style.zIndex = ''
    }

    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)

    if (options.onDragEnd) {
      const dragEvent = new DragEvent('dragend')
      options.onDragEnd(dragEvent)
    }

    // 检查是否有有效的放置目标
    const dropTarget = document.elementFromPoint(event.clientX, event.clientY)
    if (dropTarget && options.onDrop) {
      const dropEvent = new DragEvent('drop')
      options.onDrop(dropEvent)
    }
  }

  return {
    isDragging: readonly(isDragging),
    startDrag
  }
}

export interface UseDroppableOptions {
  onDragEnter?: (event: DragEvent) => void
  onDragLeave?: (event: DragEvent) => void
  onDragOver?: (event: DragEvent) => void
  onDrop?: (event: DragEvent, data?: any) => void
  acceptTypes?: string[]
}

export function useDroppable(element: Ref<HTMLElement | undefined>, options: UseDroppableOptions = {}) {
  const isOver = ref(false)

  function handleDragEnter(event: DragEvent) {
    isOver.value = true
    if (options.onDragEnter) {
      options.onDragEnter(event)
    }
  }

  function handleDragLeave(event: DragEvent) {
    isOver.value = false
    if (options.onDragLeave) {
      options.onDragLeave(event)
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault() // 允许放置
    if (options.onDragOver) {
      options.onDragOver(event)
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    isOver.value = false
    
    if (options.onDrop) {
      options.onDrop(event)
    }
  }

  function setupDropZone() {
    if (!element.value) return

    element.value.addEventListener('dragenter', handleDragEnter)
    element.value.addEventListener('dragleave', handleDragLeave)
    element.value.addEventListener('dragover', handleDragOver)
    element.value.addEventListener('drop', handleDrop)
  }

  function cleanupDropZone() {
    if (!element.value) return

    element.value.removeEventListener('dragenter', handleDragEnter)
    element.value.removeEventListener('dragleave', handleDragLeave)
    element.value.removeEventListener('dragover', handleDragOver)
    element.value.removeEventListener('drop', handleDrop)
  }

  return {
    isOver: readonly(isOver),
    setupDropZone,
    cleanupDropZone
  }
}