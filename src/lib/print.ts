export type PrintMode = "thermal" | "a4";

const PAGE_RULES: Record<PrintMode, string> = {
  thermal: "@page { size: 80mm auto; margin: 0; }",
  a4: "@page { size: A4; margin: 10mm; }",
};

const ROOT_ID = "print-root";

/**
 * Print the currently rendered `.print-sheet`.
 * The sheet is cloned into a top-level container so no preview wrapper
 * (dialog scroll box, zoom, overflow) can clip or shrink the paper output.
 */
export function printSheet(mode: PrintMode, selector = ".print-sheet") {
  const sheet = document.querySelector<HTMLElement>(selector);
  if (!sheet) {
    window.print();
    return;
  }

  const style = document.createElement("style");
  style.setAttribute("data-print-page", mode);
  style.textContent = PAGE_RULES[mode];
  document.head.appendChild(style);

  const host = document.createElement("div");
  host.id = ROOT_ID;
  host.dataset["printMode"] = mode;
  host.appendChild(sheet.cloneNode(true));
  document.body.appendChild(host);
  document.documentElement.classList.add("printing");

  const cleanup = () => {
    document.documentElement.classList.remove("printing");
    host.remove();
    style.remove();
  };

  try {
    window.print();
  } finally {
    setTimeout(cleanup, 500);
  }
}
