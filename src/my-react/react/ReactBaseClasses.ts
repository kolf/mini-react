// React 基础类组件
// 这里实现了React类组件的基础功能，包括state管理和生命周期

import type { ReactNode } from './ReactTypes';

/**
 * React 组件基类
 * 提供 setState 和生命周期方法的基础实现
 * 
 * 所有React类组件都继承自这个基类
 * 它提供了state管理、强制更新等核心功能
 */
export class Component<P = {}, S = {}> {
  props: P;    // 组件接收的属性，只读
  state: S;    // 组件的内部状态，可通过setState修改
  
  // 用于标识这是一个类组件
  // React通过检查这个静态属性来区分类组件和函数组件
  static isReactComponent = {};
  
  constructor(props: P) {
    this.props = props;
    this.state = {} as S;
  }

  /**
   * 设置组件状态
   * 
   * setState是React类组件中更新状态的唯一方式
   * 它会触发组件重新渲染，并且是异步的（在真实React中）
   * 
   * @param partialState 部分状态或状态更新函数
   *   - 对象形式：{ count: 1 } 会与当前state合并
   *   - 函数形式：(prevState, props) => ({ count: prevState.count + 1 })
   * @param callback 状态更新完成后的回调函数（可选）
   */
  setState(
    partialState: Partial<S> | ((prevState: S, props: P) => Partial<S>),
    callback?: () => void
  ): void {
    // 参数类型检查
    if (typeof partialState !== 'object' && typeof partialState !== 'function') {
      throw new Error('setState(...): takes an object of state variables to update or a function which returns an object of state variables.');
    }
    
    // 这里暂时简单实现，后续会在 reconciler 中完善
    // 真实的React中，setState会创建更新对象并加入更新队列
    console.log('setState called with:', partialState);
    
    // 简单的同步更新（实际 React 是异步的）
    // 在真实React中，这个过程会通过Fiber架构进行调度
    if (typeof partialState === 'function') {
      // 函数式更新：基于当前state和props计算新state
      const newState = partialState(this.state, this.props);
      this.state = Object.assign({}, this.state, newState);
    } else {
      // 对象式更新：直接合并到当前state
      this.state = Object.assign({}, this.state, partialState);
    }
    
    // 执行回调函数
    if (callback) {
      callback();
    }
  }

  /**
   * 强制更新组件
   */
  forceUpdate(callback?: () => void): void {
    console.log('forceUpdate called');
    if (callback) {
      callback();
    }
  }

  /**
   * 渲染方法，子类必须实现
   */
  render(): ReactNode {
    throw new Error('Component must implement render method');
  }
}

/**
 * PureComponent 基类
 * 自动实现浅比较的 shouldComponentUpdate
 * 
 * PureComponent是Component的优化版本
 * 它会自动进行props和state的浅比较，避免不必要的重新渲染
 * 适用于props和state都是简单数据类型的组件
 */
export class PureComponent<P = {}, S = {}> extends Component<P, S> {
  // 标识这是一个PureComponent
  static isPureReactComponent = true;

  /**
   * 浅比较 props 和 state
   * 
   * 这个方法会在组件更新前被调用
   * 如果返回false，组件不会重新渲染
   * PureComponent自动实现了这个优化
   * 
   * @param nextProps 新的props
   * @param nextState 新的state
   * @returns 如果需要更新返回true，否则返回false
   */
  shouldComponentUpdate(nextProps: P, nextState: S): boolean {
    // 只有当props或state发生变化时才重新渲染
    return !shallowEqual(this.props, nextProps) || !shallowEqual(this.state, nextState);
  }
}

/**
 * 浅比较两个对象
 * 
 * 浅比较只比较对象的第一层属性，不会递归比较嵌套对象
 * 这是PureComponent性能优化的核心算法
 * 
 * 比较规则：
 * 1. 如果两个对象是同一个引用，返回true
 * 2. 如果不是对象或为null，返回false
 * 3. 比较属性数量，不同则返回false
 * 4. 逐个比较每个属性的值（使用Object.is）
 * 
 * @param objA 第一个对象
 * @param objB 第二个对象
 * @returns 如果浅层相等返回true，否则返回false
 */
function shallowEqual(objA: any, objB: any): boolean {
  // 使用Object.is进行严格相等比较（类似===，但处理NaN和-0的情况）
  if (Object.is(objA, objB)) {
    return true;
  }

  // 如果不是对象或者是null，则不相等
  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  // 获取两个对象的所有属性键
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  // 如果属性数量不同，则不相等
  if (keysA.length !== keysB.length) {
    return false;
  }

  // 逐个比较每个属性的值
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    // 检查objB是否有这个属性，以及属性值是否相等
    if (!Object.prototype.hasOwnProperty.call(objB, key) || !Object.is(objA[key], objB[key])) {
      return false;
    }
  }

  return true;
}