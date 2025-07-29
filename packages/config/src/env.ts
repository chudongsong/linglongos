/**
 * 环境配置模块
 * 提供不同环境的配置管理
 */

/**
 * 环境类型
 */
export type EnvType = 'development' | 'test' | 'production'

/**
 * 基础环境配置接口
 */
export interface BaseEnvConfig {
  // 环境类型
  env: EnvType
  // API基础URL
  apiBaseUrl: string
  // 是否启用调试模式
  debug: boolean
  // 是否启用API请求日志
  apiLog: boolean
  // 是否启用性能监控
  performanceMonitor: boolean
  // 是否启用错误跟踪
  errorTracking: boolean
  // 是否启用用户行为分析
  userAnalytics: boolean
  // 是否启用本地存储
  localStorage: boolean
  // 是否启用会话存储
  sessionStorage: boolean
  // 是否启用IndexedDB
  indexedDB: boolean
  // 是否启用WebSQL
  webSQL: boolean
  // 是否启用服务工作线程
  serviceWorker: boolean
  // 是否启用WebSocket
  webSocket: boolean
  // 是否启用WebRTC
  webRTC: boolean
  // 是否启用WebAssembly
  webAssembly: boolean
  // 是否启用WebGL
  webGL: boolean
  // 是否启用WebGPU
  webGPU: boolean
  // 是否启用WebXR
  webXR: boolean
  // 是否启用WebNFC
  webNFC: boolean
  // 是否启用WebUSB
  webUSB: boolean
  // 是否启用WebBluetooth
  webBluetooth: boolean
  // 是否启用WebMIDI
  webMIDI: boolean
  // 是否启用WebSerial
  webSerial: boolean
  // 是否启用WebHID
  webHID: boolean
  // 是否启用WebCodecs
  webCodecs: boolean
  // 是否启用WebTransport
  webTransport: boolean
  // 是否启用WebShare
  webShare: boolean
  // 是否启用WebPayment
  webPayment: boolean
  // 是否启用WebAuthn
  webAuthn: boolean
  // 是否启用WebCrypto
  webCrypto: boolean
  // 是否启用WebPush
  webPush: boolean
  // 是否启用WebNotification
  webNotification: boolean
  // 是否启用WebLock
  webLock: boolean
  // 是否启用WebBackground
  webBackground: boolean
  // 是否启用WebPeriodicSync
  webPeriodicSync: boolean
  // 是否启用WebBadge
  webBadge: boolean
  // 是否启用WebClipboard
  webClipboard: boolean
  // 是否启用WebContact
  webContact: boolean
  // 是否启用WebFile
  webFile: boolean
  // 是否启用WebFont
  webFont: boolean
  // 是否启用WebImage
  webImage: boolean
  // 是否启用WebMedia
  webMedia: boolean
  // 是否启用WebSpeech
  webSpeech: boolean
  // 是否启用WebVibration
  webVibration: boolean
  // 是否启用WebVR
  webVR: boolean
  // 是否启用WebWorker
  webWorker: boolean
  // 是否启用SharedWorker
  sharedWorker: boolean
  // 是否启用WebAnimation
  webAnimation: boolean
  // 是否启用WebAudio
  webAudio: boolean
  // 是否启用WebCanvas
  webCanvas: boolean
  // 是否启用WebRTC
  webRtc: boolean
  // 是否启用WebSocket
  websocket: boolean
  // 是否启用WebStorage
  webStorage: boolean
  // 是否启用WebSQL
  websql: boolean
  // 是否启用WebXR
  webxr: boolean
  // 是否启用WebUSB
  webusb: boolean
  // 是否启用WebBluetooth
  webbluetooth: boolean
  // 是否启用WebMIDI
  webmidi: boolean
  // 是否启用WebSerial
  webserial: boolean
  // 是否启用WebHID
  webhid: boolean
  // 是否启用WebCodecs
  webcodecs: boolean
  // 是否启用WebTransport
  webtransport: boolean
  // 是否启用WebShare
  webshare: boolean
  // 是否启用WebPayment
  webpayment: boolean
  // 是否启用WebAuthn
  webauthn: boolean
  // 是否启用WebCrypto
  webcrypto: boolean
  // 是否启用WebPush
  webpush: boolean
  // 是否启用WebNotification
  webnotification: boolean
  // 是否启用WebLock
  weblock: boolean
  // 是否启用WebBackground
  webbackground: boolean
  // 是否启用WebPeriodicSync
  webperiodicsync: boolean
  // 是否启用WebBadge
  webbadge: boolean
  // 是否启用WebClipboard
  webclipboard: boolean
  // 是否启用WebContact
  webcontact: boolean
  // 是否启用WebFile
  webfile: boolean
  // 是否启用WebFont
  webfont: boolean
  // 是否启用WebImage
  webimage: boolean
  // 是否启用WebMedia
  webmedia: boolean
  // 是否启用WebSpeech
  webspeech: boolean
  // 是否启用WebVibration
  webvibration: boolean
  // 是否启用WebVR
  webvr: boolean
  // 是否启用WebWorker
  webworker: boolean
  // 是否启用SharedWorker
  sharedworker: boolean
  // 是否启用WebAnimation
  webanimation: boolean
  // 是否启用WebAudio
  webaudio: boolean
  // 是否启用WebCanvas
  webcanvas: boolean
}

/**
 * 开发环境配置
 */
export const developmentConfig: BaseEnvConfig = {
  env: 'development',
  apiBaseUrl: 'http://localhost:3000',
  debug: true,
  apiLog: true,
  performanceMonitor: true,
  errorTracking: true,
  userAnalytics: false,
  localStorage: true,
  sessionStorage: true,
  indexedDB: true,
  webSQL: false,
  serviceWorker: false,
  webSocket: true,
  webRTC: false,
  webAssembly: true,
  webGL: true,
  webGPU: false,
  webXR: false,
  webNFC: false,
  webUSB: false,
  webBluetooth: false,
  webMIDI: false,
  webSerial: false,
  webHID: false,
  webCodecs: false,
  webTransport: false,
  webShare: false,
  webPayment: false,
  webAuthn: false,
  webCrypto: true,
  webPush: false,
  webNotification: false,
  webLock: false,
  webBackground: false,
  webPeriodicSync: false,
  webBadge: false,
  webClipboard: true,
  webContact: false,
  webFile: true,
  webFont: true,
  webImage: true,
  webMedia: true,
  webSpeech: false,
  webVibration: false,
  webVR: false,
  webWorker: true,
  sharedWorker: false,
  webAnimation: true,
  webAudio: true,
  webCanvas: true,
  webRtc: false,
  websocket: true,
  webStorage: true,
  websql: false,
  webxr: false,
  webusb: false,
  webbluetooth: false,
  webmidi: false,
  webserial: false,
  webhid: false,
  webcodecs: false,
  webtransport: false,
  webshare: false,
  webpayment: false,
  webauthn: false,
  webcrypto: true,
  webpush: false,
  webnotification: false,
  weblock: false,
  webbackground: false,
  webperiodicsync: false,
  webbadge: false,
  webclipboard: true,
  webcontact: false,
  webfile: true,
  webfont: true,
  webimage: true,
  webmedia: true,
  webspeech: false,
  webvibration: false,
  webvr: false,
  webworker: true,
  sharedworker: false,
  webanimation: true,
  webaudio: true,
  webcanvas: true,
}

/**
 * 测试环境配置
 */
export const testConfig: BaseEnvConfig = {
  ...developmentConfig,
  env: 'test',
  apiBaseUrl: 'https://test-api.linglongos.com',
  debug: true,
  apiLog: true,
  performanceMonitor: true,
  errorTracking: true,
  userAnalytics: true,
}

/**
 * 生产环境配置
 */
export const productionConfig: BaseEnvConfig = {
  ...developmentConfig,
  env: 'production',
  apiBaseUrl: 'https://api.linglongos.com',
  debug: false,
  apiLog: false,
  performanceMonitor: true,
  errorTracking: true,
  userAnalytics: true,
}

/**
 * 获取当前环境配置
 * @returns 环境配置
 */
export function getEnvConfig(): BaseEnvConfig {
  const env = process.env.NODE_ENV as EnvType

  switch (env) {
    case 'development':
      return developmentConfig
    case 'test':
      return testConfig
    case 'production':
      return productionConfig
    default:
      return developmentConfig
  }
}

/**
 * 当前环境配置
 */
export const envConfig = getEnvConfig()

/**
 * 默认导出当前环境配置
 */
export default envConfig
