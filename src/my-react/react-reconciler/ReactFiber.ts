// Fiber 节点的数据结构和创建
// Fiber是React 16引入的新架构，解决了React 15中的性能问题

import type { ReactElement, Key, Ref } from '../react/ReactTypes';

/**
 * Fiber 节点类型枚举
 * 
 * 每个Fiber节点都有一个tag来标识它的类型
 * 这帮助React在渲染过程中正确处理不同类型的节点
 */
export const enum WorkTag {
  FunctionComponent = 0,  // 函数组件 - 如 function App() { return <div>Hello</div> }
  ClassComponent = 1,     // 类组件 - 如 class App extends Component { render() { return <div>Hello</div> } }
  HostRoot = 3,          // 根节点 - 整个React应用的根Fiber节点
  HostComponent = 5,     // 原生 DOM 元素 - 如 div、span、p 等HTML标签
  HostText = 6,          // 文本节点 - 纯文本内容
}

/**
 * Fiber 节点标志位（副作用标记）
 * 
 * 使用位运算来标记Fiber节点需要执行的副作用
 * 这些标志位告诉React在commit阶段需要对DOM进行什么操作
 */
export const enum Flags {
  NoFlags = 0b000000000000000000,    // 无副作用
  Placement = 0b000000000000000010,  // 插入 - 需要将节点插入到DOM中
  Update = 0b000000000000000100,     // 更新 - 需要更新节点的属性或内容
  Deletion = 0b000000000000001000,   // 删除 - 需要从DOM中删除节点
}

/**
 * Fiber 节点数据结构
 * 这是 React Fiber 架构的核心数据结构
 * 
 * Fiber节点包含了React渲染所需的所有信息：
 * - 节点类型和内容信息
 * - 树形结构的连接信息
 * - 状态和属性信息
 * - 副作用和更新信息
 * 
 * 每个React元素都对应一个Fiber节点
 */
export interface Fiber {
  // === 节点标识信息 ===
  tag: WorkTag;           // 节点类型（函数组件、类组件、DOM元素等）
  key: Key | null;        // React中的key属性，用于diff算法优化
  elementType: any;       // 原始的元素类型（如传入createElement的type参数）
  type: any;              // 解析后的类型（可能经过懒加载等处理）
  stateNode: any;         // 关联的实例（DOM节点、类组件实例、函数组件的hooks状态等）
  
  // 指向父节点
  return: Fiber | null;
  
  // 指向第一个子节点
  child: Fiber | null;
  
  // 指向下一个兄弟节点
  sibling: Fiber | null;
  
  // 在兄弟节点中的索引
  index: number;
  
  // ref 引用
  ref: Ref | null;
  
  // 新的 props
  pendingProps: any;
  
  // 旧的 props
  memoizedProps: any;
  
  // 更新队列
  updateQueue: any;
  
  // 旧的 state
  memoizedState: any;
  
  // 副作用标志
  flags: Flags;
  
  // 子树的副作用标志
  subtreeFlags: Flags;
  
  // 下一个有副作用的节点
  nextEffect: Fiber | null;
  
  // 第一个有副作用的子节点
  firstEffect: Fiber | null;
  
  // 最后一个有副作用的子节点
  lastEffect: Fiber | null;
  
  // 对应的 work-in-progress 节点
  alternate: Fiber | null;
}

/**
 * 创建 Fiber 节点
 */
function createFiber(tag: WorkTag, pendingProps: any, key: Key | null): Fiber {
  return {
    tag,
    key,
    elementType: null,
    type: null,
    stateNode: null,
    return: null,
    child: null,
    sibling: null,
    index: 0,
    ref: null,
    pendingProps,
    memoizedProps: null,
    updateQueue: null,
    memoizedState: null,
    flags: Flags.NoFlags,
    subtreeFlags: Flags.NoFlags,
    nextEffect: null,
    firstEffect: null,
    lastEffect: null,
    alternate: null,
  };
}

/**
 * 创建根 Fiber 节点
 */
export function createHostRootFiber(): Fiber {
  return createFiber(WorkTag.HostRoot, null, null);
}

/**
 * 从 ReactElement 创建 Fiber 节点
 */
export function createFiberFromElement(element: ReactElement): Fiber {
  const { type, key, props } = element;
  let fiberTag: WorkTag;
  
  if (typeof type === 'string') {
    // 原生 DOM 元素
    fiberTag = WorkTag.HostComponent;
  } else if (typeof type === 'function') {
    // 函数组件或类组件
    if (type.prototype && type.prototype.isReactComponent) {
      fiberTag = WorkTag.ClassComponent;
    } else {
      fiberTag = WorkTag.FunctionComponent;
    }
  } else {
    throw new Error('Unknown element type: ' + type);
  }
  
  const fiber = createFiber(fiberTag, props, key);
  fiber.elementType = type;
  fiber.type = type;
  
  return fiber;
}

/**
 * 创建文本 Fiber 节点
 */
export function createFiberFromText(content: string): Fiber {
  const fiber = createFiber(WorkTag.HostText, content, null);
  return fiber;
}

/**
 * 创建 work-in-progress 节点
 */
export function createWorkInProgress(current: Fiber, pendingProps: any): Fiber {
  let workInProgress = current.alternate;
  
  if (workInProgress === null) {
    // 首次渲染，创建新的 work-in-progress 节点
    workInProgress = createFiber(current.tag, pendingProps, current.key);
    workInProgress.elementType = current.elementType;
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
    
    // 建立双向连接
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // 复用已有的 work-in-progress 节点
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;
    
    // 清除副作用
    workInProgress.flags = Flags.NoFlags;
    workInProgress.subtreeFlags = Flags.NoFlags;
    workInProgress.nextEffect = null;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;
  }
  
  // 复制其他属性
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;
  
  return workInProgress;
}