// Fiber 协调器的核心实现

import type { ReactNode } from '../react/ReactTypes';
import { createFiberRoot, type FiberRoot } from './ReactFiberRoot';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';
import { createUpdate, enqueueUpdate } from './ReactUpdateQueue';

/**
 * 创建容器（Fiber 根）
 */
export function createContainer(containerInfo: Element | DocumentFragment): FiberRoot {
  return createFiberRoot(containerInfo);
}

/**
 * 更新容器内容
 */
export function updateContainer(element: ReactNode, container: FiberRoot): void {
  const current = container.current;
  
  // 创建更新对象
  const update = createUpdate();
  update.payload = { element };
  
  // 将更新加入队列
  enqueueUpdate(current, update);
  
  // 调度更新
  scheduleUpdateOnFiber(current);
}