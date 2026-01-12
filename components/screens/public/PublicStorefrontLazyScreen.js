import React, { Suspense } from "react";
import { Screen } from "../../components/Screen";

const Lazy = React.lazy(() => import("./PublicStorefrontScreen").then((m) => ({ default: m.PublicStorefrontScreen })));

export function PublicStorefrontLazyScreen(props) {
  return (
    <Suspense fallback={<Screen />}>
      <Lazy {...props} />
    </Suspense>
  );
}
