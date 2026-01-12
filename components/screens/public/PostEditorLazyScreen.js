import React, { Suspense } from "react";
import { Screen } from "../../components/Screen";

const Lazy = React.lazy(() => import("./PostEditorScreen").then((m) => ({ default: m.PostEditorScreen })));

export function PostEditorLazyScreen(props) {
  return (
    <Suspense fallback={<Screen />}>
      <Lazy {...props} />
    </Suspense>
  );
}
