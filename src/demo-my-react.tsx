import { createElement } from "./my-react/react";
import { createRoot } from "./my-react/react-dom/client";
import './index.css'

const container = document.getElementById("root")!;
const root = createRoot(container);

export function Hello() {
  return createElement("div", { className: "hello-fn" }, "Hello Function Component");
}

root.render(createElement(Hello, null));
