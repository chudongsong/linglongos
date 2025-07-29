import { Ref, unref } from 'vue'
import type { IframeMessage } from '../types'

interface CommunicationOptions {
  targetOrigin?: string
  allowedOrigins?: string[]
}

interface MessageHandler {
  type: string
  callback: (data: any, message: IframeMessage) => void
}

/**
 * iframe通信管理
 */
export function useIframeCommunication(
  iframeRef: Ref<HTMLIFrameElement | undefined>,
  options: CommunicationOptions = {}
) {
  const handlers: MessageHandler[] = []

  /**
   * 发送消息到iframe
   */
  const postMessage = (type: string, data: any): void => {
    const iframe = unref(iframeRef)
    if (!iframe || !iframe.contentWindow) return

    const targetOrigin = options.targetOrigin || '*'

    iframe.contentWindow.postMessage(
      {
        type,
        data,
        source: {
          origin: window.location.origin,
        },
      },
      targetOrigin
    )
  }

  /**
   * 监听iframe消息
   */
  const onMessage = (
    type: string,
    callback: (data: any, message: IframeMessage) => void
  ): (() => void) => {
    const handler: MessageHandler = { type, callback }
    handlers.push(handler)

    return () => {
      const index = handlers.findIndex(h => h === handler)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * 处理窗口消息
   */
  const handleWindowMessage = (event: MessageEvent): void => {
    // 检查来源是否允许
    if (options.allowedOrigins && options.allowedOrigins.length > 0) {
      if (!options.allowedOrigins.includes('*') && !options.allowedOrigins.includes(event.origin)) {
        return
      }
    }

    // 检查是否来自iframe
    const iframe = unref(iframeRef)
    if (iframe && event.source === iframe.contentWindow) {
      const message = event.data

      if (typeof message === 'object' && message !== null && 'type' in message) {
        // 构造标准消息格式
        const standardMessage: IframeMessage = {
          type: message.type,
          data: message.data,
          source: {
            url: iframe.src,
            origin: event.origin,
          },
        }

        // 调用匹配的处理函数
        handlers.forEach(handler => {
          if (handler.type === '*' || handler.type === message.type) {
            handler.callback(message.data, standardMessage)
          }
        })
      }
    }
  }

  // 添加消息监听器
  window.addEventListener('message', handleWindowMessage)

  /**
   * 销毁通信管理器
   */
  const destroy = (): void => {
    window.removeEventListener('message', handleWindowMessage)
    handlers.length = 0
  }

  return {
    postMessage,
    onMessage,
    destroy,
  }
}
