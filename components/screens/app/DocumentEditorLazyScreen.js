import React, { Suspense } from "react";
import { Screen } from "../../components/Screen";

const Lazy = React.lazy(() => import("./DocumentEditorScreen").then((m) => ({ default: m.DocumentEditorScreen })));

export function DocumentEditorLazyScreen(props) {
  return (
    <Suspense fallback={<Screen />}>
      <Lazy {...props} />
    </Suspense>
  );
}
