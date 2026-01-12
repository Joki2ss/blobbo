import React, { Suspense } from "react";
import { Screen } from "../../components/Screen";

const Lazy = React.lazy(() => import("./PublicFeedScreen").then((m) => ({ default: m.PublicFeedScreen })));

export function PublicFeedLazyScreen(props) {
  return (
    <Suspense fallback={<Screen />}>
      <Lazy {...props} />
    </Suspense>
  );
}
