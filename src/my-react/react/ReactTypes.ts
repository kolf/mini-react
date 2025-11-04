// React 类型定义

export type ReactText = string | number;
export type ReactChild = ReactElement | ReactText;

export type ReactNode =
  | ReactElement
  | string
  | number
  | boolean
  | null
  | undefined
  | ReactNodeArray;

type ReactNodeArray = Array<ReactNode>

// Hook 相关类型
export type Dispatch<A> = (value: A) => void;
export type SetStateAction<S> = S | ((prevState: S) => S);

export interface Dispatcher {
  useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
}

export type ReactFragment = {} | ReactNodeArray;
export type Key = string | number;
export type Ref<T = any> =
  | { current: T }
  | ((instance: T | null) => void)
  | null;

export interface ReactElement<
  P = any,
  T extends string | JSXElementConstructor<any> =
    | string
    | JSXElementConstructor<any>
> {
  type: T;
  props: P;
  key: Key | null;
  ref: Ref<any> | null;
  $$typeof: symbol;
}

export type JSXElementConstructor<P> =
  | ((props: P) => ReactElement<any, any> | null)
  | (new (props: P) => Component<P, any>);

export interface Component<P = {}, S = {}> {
  props: P;
  state: S;
  setState(
    partialState: Partial<S> | ((prevState: S, props: P) => Partial<S>)
  ): void;
  render(): ReactNode;
}

export interface ComponentClass<P = {}, S = {}> {
  new (props: P): Component<P, S>;
}
