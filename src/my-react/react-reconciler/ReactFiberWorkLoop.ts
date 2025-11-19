// React 工作循环实现

import type { Fiber } from './ReactFiber';
import type { FiberRoot } from './ReactFiberRoot';
import { WorkTag, Flags, createFiberFromElement, createFiberFromText, createWorkInProgress } from './ReactFiber';
import { processUpdateQueue } from './ReactUpdateQueue';
import type { ReactNode, ReactElement, JSXElementConstructor } from '../react/ReactTypes';

// 工作循环状态
type WorkStatus = 'Idle' | 'Working' | 'Committing';

// 全局工作状态
let workStatus: WorkStatus = 'Idle';
let workInProgress: Fiber | null = null;

/**
 * 调度更新到 Fiber 节点
 * 这是 React 工作循环的入口点
 */
export function scheduleUpdateOnFiber(fiber: Fiber): void {
  // 找到根节点
  const root = markUpdateLaneFromFiberToRoot(fiber);
  
  if (root === null) {
    return;
  }
  
  // 确保根节点被调度
  ensureRootIsScheduled(root);
}

/**
 * 从 Fiber 节点向上遍历到根节点，并标记更新车道
 */
function markUpdateLaneFromFiberToRoot(fiber: Fiber): FiberRoot | null {
  let node = fiber;
  let parent = fiber.return;
  
  // 向上遍历到根节点
  while (parent !== null) {
    node = parent;
    parent = parent.return;
  }
  
  // 检查是否是根节点
  if (node.tag === WorkTag.HostRoot) {
    return node.stateNode;
  }
  
  return null;
}

/**
 * 确保根节点被调度执行
 */
function ensureRootIsScheduled(root: FiberRoot): void {
  // 如果已经在工作中，不需要重复调度
  if (workStatus !== 'Idle') {
    return;
  }
  
  // 设置工作状态为工作中
  workStatus = 'Working';
  
  // 开始工作循环
  performSyncWorkOnRoot(root);
}

/**
 * 在根节点上执行同步工作
 */
function performSyncWorkOnRoot(root: FiberRoot): void {
  // 创建 work-in-progress 树
  workInProgress = createWorkInProgress(root.current, null);
  
  // 执行工作循环
  workLoopSync();
  
  // 完成工作后进入提交阶段
  commitRoot(root);
}

/**
 * 同步工作循环
 */
function workLoopSync(): void {
  // 依次处理每个工作单元
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

/**
 * 执行单个工作单元
 */
function performUnitOfWork(unitOfWork: Fiber): void {
  // 获取当前 Fiber 节点
  const current = unitOfWork.alternate;
  
  // 开始工作阶段 - 协调子节点
  let next = beginWork(current, unitOfWork);
  
  // 如果没有下一个工作单元，完成当前工作
  if (next === null) {
    next = completeUnitOfWork(unitOfWork);
  }
  
  // 移动到下一个工作单元
  workInProgress = next;
}

/**
 * 开始工作阶段 - 协调子节点
 */
function beginWork(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  // 处理更新队列
  processUpdateQueue(workInProgress, workInProgress.pendingProps, null);
  
  // 根据不同的 Fiber 类型处理
  switch (workInProgress.tag) {
    case WorkTag.HostRoot:
      // 根节点特殊处理
      return updateHostRoot(current, workInProgress);
    
    case WorkTag.HostComponent:
      // DOM 元素处理
      return updateHostComponent(current, workInProgress);
    
    case WorkTag.FunctionComponent:
      // 函数组件处理
      return updateFunctionComponent(current, workInProgress);
    
    case WorkTag.ClassComponent:
      // 类组件处理
      return updateClassComponent(current, workInProgress);
    
    case WorkTag.HostText:
      // 文本节点处理
      return null;
    
    default:
      throw new Error(`Unknown work tag: ${workInProgress.tag}`);
  }
}

/**
 * 更新根节点
 */
function updateHostRoot(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  // 根节点的子节点就是我们要渲染的元素（来自更新队列处理后的 memoizedState）
  const element = workInProgress.memoizedState;

  // 初次挂载：根据 element 创建子 Fiber；更新：克隆子节点
  if (current === null || current.child === null) {
    mountChildFibers(workInProgress, element);
  } else {
    cloneChildFibers(current, workInProgress);
  }

  // 返回第一个子节点作为下一个工作单元
  return workInProgress.child;
}

/**
 * 更新 DOM 元素
 */
function updateHostComponent(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  // 挂载或更新子节点
  const nextProps = workInProgress.pendingProps;
  const nextChildren = nextProps ? nextProps.children : null;

  if (current === null || current.child === null) {
    mountChildFibers(workInProgress, nextChildren);
  } else {
    cloneChildFibers(current, workInProgress);
  }

  return workInProgress.child;
}

/**
 * 更新函数组件
 */
function updateFunctionComponent(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  // 暂不处理 hooks，执行函数组件以获取其返回的子树
  const nextProps = (workInProgress.pendingProps || {}) as Record<string, unknown>;
  const Component = workInProgress.type as JSXElementConstructor<unknown> | ((props: Record<string, unknown>) => ReactNode);

  let nextChildren: ReactNode = null;
  // 函数组件：调用以获得返回的 ReactElement/ReactNode
  if (typeof Component === 'function') {
    nextChildren = (Component as (props: Record<string, unknown>) => ReactNode)(nextProps);
  } else {
    // 理论上不会进入此分支（FunctionComponent 的 type 应该是函数）
    nextChildren = null;
  }

  if (current === null || current.child === null) {
    mountChildFibers(workInProgress, nextChildren);
  } else {
    cloneChildFibers(current, workInProgress);
  }

  return workInProgress.child;
}

/**
 * 更新类组件
 */
function updateClassComponent(current: Fiber | null, workInProgress: Fiber): Fiber | null {
  // 暂不处理实例化，先支持基本 children 挂载/更新
  const nextProps = workInProgress.pendingProps;
  const nextChildren = nextProps ? nextProps.children : null;

  if (current === null || current.child === null) {
    mountChildFibers(workInProgress, nextChildren);
  } else {
    cloneChildFibers(current, workInProgress);
  }

  return workInProgress.child;
}

/**
 * 克隆子节点
 */
function cloneChildFibers(current: Fiber | null, workInProgress: Fiber): void {
  if (current !== null && workInProgress.child !== current.child) {
    throw new Error('Resuming work not yet implemented.');
  }
  
  if (workInProgress.child === null) {
    return;
  }
  
  // 克隆第一个子节点
  let currentChild = workInProgress.child;
  let newChild = createWorkInProgress(currentChild, currentChild.pendingProps);
  workInProgress.child = newChild;
  
  // 克隆兄弟节点
  newChild.return = workInProgress;
  while (currentChild.sibling !== null) {
    currentChild = currentChild.sibling;
    newChild = newChild.sibling = createWorkInProgress(currentChild, currentChild.pendingProps);
    newChild.return = workInProgress;
  }
  
  newChild.sibling = null;
}

/**
 * 初次挂载：从 children 创建子 Fiber 节点
 */
function mountChildFibers(parent: Fiber, children: ReactNode): void {
  if (children === null || children === undefined || children === false) {
    parent.child = null;
    return;
  }

  // 统一处理数组和单个 child
  const childArray: ReactNode[] = Array.isArray(children) ? children : [children];

  let prevFiber: Fiber | null = null;
  let index = 0;
  for (const child of childArray) {
    let newFiber: Fiber;

    if (typeof child === 'string' || typeof child === 'number') {
      newFiber = createFiberFromText(String(child));
    } else if (typeof child === 'object' && child !== null && '$$typeof' in child) {
      newFiber = createFiberFromElement(child as ReactElement);
    } else {
      // 不支持的 child，跳过
      index++;
      continue;
    }

    newFiber.return = parent;
    newFiber.index = index++;
    // 初次挂载标记插入副作用
    newFiber.flags |= Flags.Placement;

    if (prevFiber === null) {
      parent.child = newFiber;
    } else {
      prevFiber.sibling = newFiber;
    }
    prevFiber = newFiber;
  }
}

/**
 * 完成工作单元
 */
function completeUnitOfWork(unitOfWork: Fiber): Fiber | null {
  // 完成当前节点的工作
  completeWork(unitOfWork);
  
  // 如果有兄弟节点，返回兄弟节点作为下一个工作单元
  if (unitOfWork.sibling !== null) {
    return unitOfWork.sibling;
  }
  
  // 否则向上返回到父节点
  let completedWork = unitOfWork.return;
  while (completedWork !== null) {
    completeWork(completedWork);
    
    if (completedWork.sibling !== null) {
      return completedWork.sibling;
    }
    
    completedWork = completedWork.return;
  }
  
  return null;
}

/**
 * 完成工作 - 在这里收集副作用
 */
function completeWork(workInProgress: Fiber): void {
  // 根据不同的 Fiber 类型处理完成工作
  switch (workInProgress.tag) {
    case WorkTag.HostRoot:
      // 根节点完成工作
      break;
    
    case WorkTag.HostComponent:
      // 创建或更新实际的 DOM 节点
      if (workInProgress.stateNode == null) {
        const type = workInProgress.type as string;
        const dom = document.createElement(type) as HTMLElement;

        // 设置属性（简化实现）
        const props = (workInProgress.pendingProps || workInProgress.memoizedProps || {}) as Record<string, unknown>;
        for (const key in props) {
          if (key === 'children') continue;
          const val = props[key];
          if (key === 'className' && typeof val === 'string') {
            dom.className = val;
          } else if (key === 'style' && val && typeof val === 'object') {
            Object.assign(dom.style, val as Record<string, string>);
          } else if (key.startsWith('on') && typeof val === 'function') {
            const event = key.slice(2).toLowerCase();
            dom.addEventListener(event, val as EventListener);
          } else if (val != null) {
            dom.setAttribute(key, String(val));
          }
        }

        workInProgress.stateNode = dom;
      }
      break;
    
    case WorkTag.HostText:
      if (workInProgress.stateNode == null) {
        const text = String(workInProgress.pendingProps ?? workInProgress.memoizedProps ?? '');
        const dom = document.createTextNode(text);
        workInProgress.stateNode = dom;
      }
      break;
    
    case WorkTag.FunctionComponent:
      // 函数组件完成工作
      break;
    
    case WorkTag.ClassComponent:
      // 类组件完成工作
      break;
    
    default:
      throw new Error(`Unknown work tag: ${workInProgress.tag}`);
  }
  
  // 收集副作用到父节点
  const returnFiber = workInProgress.return;
  if (returnFiber !== null) {
    // 将当前节点的副作用添加到父节点的副作用链表中
    if (returnFiber.firstEffect === null) {
      returnFiber.firstEffect = workInProgress.firstEffect;
    }
    
    if (workInProgress.lastEffect !== null) {
      if (returnFiber.lastEffect !== null) {
        returnFiber.lastEffect.nextEffect = workInProgress.firstEffect;
      }
      returnFiber.lastEffect = workInProgress.lastEffect;
    }
    
    // 如果当前节点本身有副作用，也添加到链表中
    const flags = workInProgress.flags;
    if (flags !== 0) {
      if (returnFiber.lastEffect !== null) {
        returnFiber.lastEffect.nextEffect = workInProgress;
      } else {
        returnFiber.firstEffect = workInProgress;
      }
      returnFiber.lastEffect = workInProgress;
    }
  }
}

/**
 * 提交根节点 - 执行副作用
 */
function commitRoot(root: FiberRoot): void {
  // 设置工作状态为提交中
  workStatus = 'Committing';
  
  // 获取要提交的完成工作
  const finishedWork = root.current.alternate;
  if (finishedWork === null) {
    // 没有完成的工作，重置状态并返回
    workStatus = 'Idle';
    return;
  }
  
  // 执行提交工作
  commitRootImpl(root, finishedWork);
  
  // 提交完成后清理
  root.current = finishedWork;
  root.finishedWork = null;
  
  // 重置工作状态
  workStatus = 'Idle';
}

/**
 * 提交根节点的具体实现
 */
function commitRootImpl(root: FiberRoot, finishedWork: Fiber): void {
  // 执行所有副作用
  commitAllEffects(finishedWork);
}

/**
 * 提交所有副作用
 */
function commitAllEffects(finishedWork: Fiber): void {
  // 遍历副作用链表并执行
  let effect = finishedWork.firstEffect;
  while (effect !== null) {
    const flags = effect.flags;
    
    // 处理不同的副作用类型
    if ((flags & 2) !== 0) {
      // Placement - 插入操作
      commitPlacement(effect);
    }
    
    if ((flags & 4) !== 0) {
      // Update - 更新操作
      commitUpdate(effect);
    }
    
    if ((flags & 8) !== 0) {
      // Deletion - 删除操作
      commitDeletion(effect);
    }
    
    effect = effect.nextEffect;
  }
}

/**
 * 提交插入操作
 */
function commitPlacement(finishedWork: Fiber): void {
  const parentDom = getHostParentDom(finishedWork);
  if (!parentDom) return;

  const dom = finishedWork.stateNode;
  if (dom != null && parentDom) {
    parentDom.appendChild(dom);
  }
}

/**
 * 提交更新操作
 */
function commitUpdate(finishedWork: Fiber): void {
  // 简化：初始版本不做细粒度属性 diff
  void finishedWork;
}

/**
 * 提交删除操作
 */
function commitDeletion(finishedWork: Fiber): void {
  const dom = finishedWork.stateNode;
  const parentDom = getHostParentDom(finishedWork);
  if (dom && parentDom && parentDom.contains(dom)) {
    parentDom.removeChild(dom);
  }
}

function getHostParentDom(fiber: Fiber): Element | DocumentFragment | null {
  let parent = fiber.return;
  while (parent) {
    if (parent.tag === WorkTag.HostComponent) {
      return parent.stateNode as Element;
    }
    if (parent.tag === WorkTag.HostRoot) {
      const root = parent.stateNode as FiberRoot;
      return root.containerInfo;
    }
    parent = parent.return;
  }
  return null;
}