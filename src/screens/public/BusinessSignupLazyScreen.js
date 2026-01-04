import React, { Suspense } from "react";

import { Screen } from "../../components/Screen";

const Inner = React.lazy(() => import("./BusinessSignupScreen").then((m) => ({ default: m.BusinessSignupScreen })));

export function BusinessSignupLazyScreen(props) {
  return (
    <Suspense fallback={<Screen />}>
      <Inner {...props} />
    </Suspense>
  );
}
