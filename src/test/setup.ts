// テスト環境のセットアップ
import { vi } from 'vitest';



// ResizeObserverのモック
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// IntersectionObserverのモック
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// URL APIのモック
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// document.createElementのモック
const originalCreateElement = document.createElement;
document.createElement = vi.fn().mockImplementation((tagName: string) => {
  if (tagName === 'a') {
    const element = originalCreateElement.call(document, tagName);
    return {
      ...element,
      href: '',
      download: '',
      click: vi.fn()
    };
  }
  return originalCreateElement.call(document, tagName);
});
