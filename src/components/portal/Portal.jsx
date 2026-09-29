import { createPortal } from "react-dom";

/**
 * Renders children into document.body so fixed-position overlays are never
 * trapped by ancestor transform/filter/backdrop-blur containing blocks.
 */
export function Portal({ children }) {
  return createPortal(children, document.body);
}
