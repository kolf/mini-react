import { createElement } from "./my-react/react";
import { createRoot } from "./my-react/react-dom/client";

const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(createElement("div", { className: "hello" }, "1Hello My React"));
