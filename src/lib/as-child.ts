import { isValidElement, type ReactNode } from "react";

/**
 * Base UI needs to know whether the element it renders is a real `<button>`, so it can decide
 * between native button semantics and ARIA ones. Our `asChild` shim hands it an arbitrary child,
 * so infer it: anything carrying an `href` (a `<Link>` or `<a>`) is not a native button.
 */
export function rendersNativeButton(children: ReactNode): boolean {
  if (!isValidElement(children)) return true;
  const props = children.props as { href?: unknown } | null;
  return children.type !== "a" && !(props && "href" in props);
}
