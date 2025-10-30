// React 17 及之前版本的渲染 API（兼容性）

import type { ReactNode } from '../react/ReactTypes';
import { createRoot } from './ReactDOMRoot';

/**
 * 传统的 render 方法（React 17 及之前）
 * 为了兼容性保留，内部使用新的 createRoot API
 */
export function render(element: ReactNode, container: Element | DocumentFragment): void {
  console.warn('Warning: ReactDOM.render is deprecated. Use createRoot instead.');
  
  // 检查容器是否已经有根
  let root = (container as any)._reactRootContainer;
  
  if (!root) {
    // 创建新根
    root = createRoot(container);
    (container as any)._reactRootContainer = root;
  }
  
  // 渲染元素
  root.render(element);
}

/**
 * 卸载组件
 */
export function unmountComponentAtNode(container: Element | DocumentFragment): boolean {
  const root = (container as any)._reactRootContainer;
  
  if (root) {
    root.unmount();
    delete (container as any)._reactRootContainer;
    return true;
  }
  
  return false;
}