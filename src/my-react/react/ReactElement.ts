// ReactElement 的创建和管理
// 这是React中最核心的概念之一，ReactElement是React应用的基本构建块

import type { ReactElement, Key, Ref } from './ReactTypes';

// React Element 的标识符
// 使用Symbol.for确保在不同的React副本之间也能正确识别ReactElement
// 这是React用来区分真正的ReactElement和普通对象的关键标识
const REACT_ELEMENT_TYPE = Symbol.for('react.element');

/**
 * 创建 ReactElement 的工厂函数
 * 这是 JSX 转换后调用的核心函数
 * 
 * 当你写 <div className="container">Hello</div> 时，
 * Babel会将其转换为 createElement('div', {className: 'container'}, 'Hello')
 * 
 * @param type 元素类型：可以是字符串(如'div')、函数组件、类组件
 * @param config 包含props、key、ref等配置的对象
 * @param children 子元素，可以是多个参数
 * @returns 返回一个ReactElement对象
 */
export function createElement<P extends {}>(
  type: any,
  config: (P & { key?: Key; ref?: Ref }) | null,
  ...children: any[]
): ReactElement<P> {
  let propName: string;
  
  // 提取保留的属性
  // props将包含所有传递给组件的属性，除了key和ref
  const props: any = {};
  let key: Key | null = null;  // key用于React的diff算法优化
  let ref: Ref | null = null;  // ref用于获取DOM节点或组件实例的引用

  // 处理 config 对象（包含所有JSX属性）
  if (config != null) {
    // 提取 ref - React中的特殊属性，不会传递给组件
    // ref允许父组件直接访问子组件的DOM节点或实例
    if (config.ref !== undefined) {
      ref = config.ref;
    }
    
    // 提取 key - React中的特殊属性，用于列表渲染时的优化
    // key帮助React识别哪些元素发生了变化、添加或删除
    if (config.key !== undefined) {
      key = '' + config.key; // 强制转换为字符串，确保一致性
    }

    // 复制其他属性到 props
    // 遍历config中的所有属性，排除key和ref，其余都作为props传递给组件
    for (propName in config) {
      if (
        Object.prototype.hasOwnProperty.call(config, propName) &&
        propName !== 'key' &&
        propName !== 'ref'
      ) {
        props[propName] = config[propName];
      }
    }
  }

  // 处理 children（子元素）
  // children是JSX中标签内部的内容，可以是文本、其他元素或组件
  const childrenLength = children.length;
  if (childrenLength === 1) {
    // 只有一个子元素时，直接赋值（不使用数组）
    props.children = children[0];
  } else if (childrenLength > 1) {
    // 多个子元素时，使用数组
    props.children = children;
  }
  // 如果没有children，props.children将是undefined

  // 处理默认 props（如果组件有 defaultProps）
  // defaultProps是React类组件的特性，为未传递的props提供默认值
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        // 只有当props中没有该属性时，才使用默认值
        props[propName] = defaultProps[propName];
      }
    }
  }

  // 返回ReactElement对象
  // 这个对象包含了React渲染所需的所有信息
  return {
    $$typeof: REACT_ELEMENT_TYPE,  // 标识这是一个ReactElement
    type,                          // 元素类型（'div'、函数组件、类组件等）
    key,                          // 用于diff算法的唯一标识
    ref,                          // DOM引用或组件实例引用
    props,                        // 传递给组件的所有属性（包括children）
  };
}

/**
 * 验证是否为有效的 React Element
 * 
 * 这个函数用于运行时检查一个对象是否是真正的ReactElement
 * 主要用于开发时的类型检查和安全验证
 * 
 * @param object 要检查的对象
 * @returns 如果是有效的ReactElement返回true，否则返回false
 */
export function isValidElement(object: any): object is ReactElement {
  return (
    typeof object === 'object' &&    // 必须是对象
    object !== null &&               // 不能是null
    object.$$typeof === REACT_ELEMENT_TYPE  // 必须有正确的类型标识
  );
}

/**
 * 克隆 React Element
 */
export function cloneElement<P>(
  element: ReactElement<P>,
  config?: Partial<P> & { key?: Key; ref?: Ref },
  ...children: any[]
): ReactElement<P> {
  if (element === null || element === undefined) {
    throw new Error('React.cloneElement(...): The argument must be a React element, but you passed ' + element + '.');
  }

  let propName: string;
  const props: any = Object.assign({}, element.props);
  let key: Key | null = element.key;
  let ref: Ref | null = element.ref;

  if (config != null) {
    if (config.ref !== undefined) {
      ref = config.ref;
    }
    if (config.key !== undefined) {
      key = '' + config.key;
    }

    for (propName in config) {
      if (
        Object.prototype.hasOwnProperty.call(config, propName) &&
        propName !== 'key' &&
        propName !== 'ref'
      ) {
        props[propName] = config[propName];
      }
    }
  }

  const childrenLength = children.length;
  if (childrenLength === 1) {
    props.children = children[0];
  } else if (childrenLength > 1) {
    props.children = children;
  }

  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type: element.type,
    key,
    ref,
    props,
  };
}