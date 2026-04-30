interface WtrTermReplacerBridge {
  ready?: boolean;
  bridgeVersion?: number;
  [key: string]: unknown;
}

interface Window {
  __WTR_TERM_REPLACER_BRIDGE_REGISTERED__?: boolean;
  WTR_LAB_TERM_REPLACER?: WtrTermReplacerBridge;
}

interface Event {
  detail?: any;
  target: any;
}

interface Element {
  checked: boolean;
  click(): void;
  dataset: DOMStringMap;
  disabled: boolean;
  rows: number;
  style: CSSStyleDeclaration;
  value: string;
}

interface EventTarget {
  checked: boolean;
}

interface HTMLElement {
  checked: boolean;
  rows: number;
  value: string;
}

interface Node {
  className?: string;
  hasAttribute?: (qualifiedName: string) => boolean;
  id?: string;
  querySelector?: (selectors: string) => Element | null;
}
