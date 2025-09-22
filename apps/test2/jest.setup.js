// 全局 Jest 设置：polyfill 与 DOM 清理

// 说明：setupFilesAfterEnv 在 Jest 环境内执行，jest 为全局可用，无需显式 import
// 统一启用假定的系统时钟（可在测试中按需覆盖）
jest.useFakeTimers();

// 测试环境公共初始化（不依赖 jest 全局）
// 说明：避免在此处直接调用 jest.useFakeTimers()，在各测试文件中按需启用。

// 每个测试后清理 DOM，避免跨用例污染
afterEach(() => {
  if (document && document.body) {
    document.body.innerHTML = '';
  }
});