import type { ReactNode } from "react";
import { StorefrontFooter } from "./storefront-footer";
import { StorefrontHeader } from "./storefront-header";

export function StorefrontPageShell({ children }: { children: ReactNode }) {
  return <><StorefrontHeader /><main className="interior-main">{children}</main><StorefrontFooter /></>;
}
