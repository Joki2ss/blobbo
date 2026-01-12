import React, { Suspense } from "react";
import { Screen } from "../../components/Screen";

const Lazy = React.lazy(() => import("./DeveloperFeedControlScreen").then((m) => ({ default: m.DeveloperFeedControlScreen })));

export function DeveloperFeedControlLazyScreen(props) {
  return (
    <Suspense fallback={<Screen />}>
      <Lazy {...props} />
    </Suspense>
  );
}
