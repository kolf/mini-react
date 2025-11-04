// React Hooks 实现

import type { Dispatcher } from './ReactTypes';

// 当前的 dispatcher
let currentDispatcher: Dispatcher | null = null;

/**
 * 获取当前 dispatcher
 */
export function getDispatcher(): Dispatcher | null {
  return currentDispatcher;
}

/**
 * 设置当前 dispatcher
 */
export function setDispatcher(dispatcher: Dispatcher): void {
  currentDispatcher = dispatcher;
}

/**
 * useState Hook
 */
export function useState<S>(initialState: S | (() => S)) {
  const dispatcher = getDispatcher();
  if (!dispatcher) {
    throw new Error('Invalid hook call. Hooks can only be called inside of the body of a function component.');
  }
  return dispatcher.useState(initialState);
}