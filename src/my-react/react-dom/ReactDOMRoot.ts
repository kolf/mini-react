// React 18 的新根 API 实现
// 这是React 18引入的新API，支持并发特性和更好的性能

import type { ReactNode } from '../react/ReactTypes';
import { createContainer, updateContainer } from '../react-reconciler/ReactFiberReconciler';

/**
 * React根对象的接口定义
 * 提供渲染和卸载方法
 */
export interface Root {
  render(children: ReactNode): void;  // 渲染React元素到根容器
  unmount(): void;                    // 卸载根容器中的所有内容
}

/**
 * 创建 React 18 的新根
 * 这是 React 18 并发特性的入口
 * 
 * 与React 17的ReactDOM.render不同，createRoot支持：
 * 1. 并发渲染 - 可以中断和恢复渲染过程
 * 2. 自动批处理 - 自动合并多个状态更新
 * 3. Suspense边界 - 更好的异步组件支持
 * 4. 严格模式改进 - 更好的开发体验
 * 
 * @param container DOM容器元素，React应用将渲染到这个容器中
 * @returns 返回Root对象，包含render和unmount方法
 */
export function createRoot(container: Element | DocumentFragment): Root {
  // 创建 Fiber 根容器
  // 这会初始化整个Fiber树的根节点，建立React应用与DOM的连接
  const fiberRoot = createContainer(container);
  
  return {
    /**
     * 渲染React元素到根容器
     * 
     * 这个方法会启动React的渲染流程：
     * 1. 创建或更新Fiber树
     * 2. 执行协调算法（diff）
     * 3. 提交更改到DOM
     * 
     * @param children 要渲染的React元素
     */
    render(children: ReactNode): void {
      // 更新容器内容，触发React的渲染流程
      updateContainer(children, fiberRoot);
    },
    
    /**
     * 卸载根容器中的所有内容
     * 
     * 这会清理所有的React组件，移除事件监听器，
     * 并从DOM中移除所有渲染的内容
     */
    unmount(): void {
      // 传入null来卸载根组件
      updateContainer(null, fiberRoot);
    }
  };
}