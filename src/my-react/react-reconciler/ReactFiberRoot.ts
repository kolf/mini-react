// Fiber 根节点的实现

import { createHostRootFiber, type Fiber } from './ReactFiber';

/**
 * Fiber 根节点
 * 连接 React 应用和宿主环境（DOM）
 */
export interface FiberRoot {
  // 容器信息（DOM 节点）
  containerInfo: Element | DocumentFragment;
  
  // 当前的 Fiber 树根节点
  current: Fiber;
  
  // 正在构建的 Fiber 树根节点（work-in-progress）
  finishedWork: Fiber | null;
  
  // 待处理的更新队列
  pendingTime: number;
  
  // 调度相关
  callbackNode: any;
  callbackPriority: number;
}

/**
 * 创建 Fiber 根节点
 */
export function createFiberRoot(containerInfo: Element | DocumentFragment): FiberRoot {
  // 创建根 Fiber 节点
  const uninitializedFiber = createHostRootFiber();
  
  // 创建 FiberRoot
  const root: FiberRoot = {
    containerInfo,
    current: uninitializedFiber,
    finishedWork: null,
    pendingTime: 0,
    callbackNode: null,
    callbackPriority: 0,
  };
  
  // 建立双向连接
  uninitializedFiber.stateNode = root;
  
  return root;
}