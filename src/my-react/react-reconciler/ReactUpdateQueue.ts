// 更新队列的实现

import type { Fiber } from './ReactFiber';

/**
 * 更新对象
 */
export interface Update<State = any> {
  // 更新的载荷（新的 state 或 element）
  payload: any;
  
  // 回调函数
  callback: (() => void) | null;
  
  // 指向下一个更新
  next: Update<State> | null;
}

/**
 * 更新队列
 */
export interface UpdateQueue<State = any> {
  // 基础状态
  baseState: State;
  
  // 第一个更新
  firstBaseUpdate: Update<State> | null;
  
  // 最后一个更新
  lastBaseUpdate: Update<State> | null;
  
  // 共享的待处理更新队列
  shared: {
    pending: Update<State> | null;
  };
}

/**
 * 创建更新对象
 */
export function createUpdate<State = any>(): Update<State> {
  return {
    payload: null,
    callback: null,
    next: null,
  };
}

/**
 * 创建更新队列
 */
export function createUpdateQueue<State>(baseState: State): UpdateQueue<State> {
  return {
    baseState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: {
      pending: null,
    },
  };
}

/**
 * 将更新加入队列
 */
export function enqueueUpdate<State>(fiber: Fiber, update: Update<State>): void {
  const updateQueue = fiber.updateQueue;
  
  if (updateQueue === null) {
    // 如果没有更新队列，创建一个
    fiber.updateQueue = createUpdateQueue(null);
    fiber.updateQueue.shared.pending = update;
    update.next = update; // 形成环形链表
    return;
  }
  
  const sharedQueue = updateQueue.shared;
  const pending = sharedQueue.pending;
  
  if (pending === null) {
    // 第一个更新
    update.next = update;
  } else {
    // 插入到环形链表中
    update.next = pending.next;
    pending.next = update;
  }
  
  sharedQueue.pending = update;
}

/**
 * 处理更新队列
 */
export function processUpdateQueue<State>(
  workInProgress: Fiber,
  props: any,
  instance: any
): void {
  const queue = workInProgress.updateQueue;
  
  if (queue === null) {
    return;
  }
  
  let newBaseState = queue.baseState;
  let newFirstBaseUpdate: Update<State> | null = null;
  let newLastBaseUpdate: Update<State> | null = null;
  
  // 处理待处理的更新
  const pendingQueue = queue.shared.pending;
  if (pendingQueue !== null) {
    queue.shared.pending = null;
    
    // 将环形链表转换为线性链表
    const lastPendingUpdate = pendingQueue;
    const firstPendingUpdate = lastPendingUpdate.next!;
    lastPendingUpdate.next = null;
    
    // 处理每个更新
    let update: Update<State> | null = firstPendingUpdate;
    while (update !== null) {
      const updatePayload = update.payload;
      
      if (updatePayload && typeof updatePayload === 'object' && updatePayload.element !== undefined) {
        // 这是一个元素更新（用于根节点）
        newBaseState = updatePayload.element;
      } else if (typeof updatePayload === 'function') {
        // 函数式更新
        newBaseState = updatePayload(newBaseState, props);
      } else {
        // 对象式更新
        newBaseState = Object.assign({}, newBaseState, updatePayload);
      }
      
      update = update.next;
    }
  }
  
  // 更新队列状态
  queue.baseState = newBaseState;
  queue.firstBaseUpdate = newFirstBaseUpdate;
  queue.lastBaseUpdate = newLastBaseUpdate;
  
  // 更新 fiber 的 memoized state
  workInProgress.memoizedState = newBaseState;
}