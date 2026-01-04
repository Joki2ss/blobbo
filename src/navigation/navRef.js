import * as React from "react";

export const navigationRef = React.createRef();

export function getCurrentRouteName() {
  try {
    return navigationRef.current?.getCurrentRoute()?.name || "";
  } catch {
    return "";
  }
}
