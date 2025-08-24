// src/navigation/NavigationService.ts
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();
let pendingNavigation: { name: string; params?: any } | null = null;

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  } else {
    console.log("⏳ Navigation not ready, storing pending nav:", name, params);
    pendingNavigation = { name, params };
  }
}

// Call this once NavigationContainer mounts
export function flushPendingNavigation() {
  if (pendingNavigation && navigationRef.isReady()) {
    const { name, params } = pendingNavigation;
    navigationRef.navigate(name as never, params as never);
    pendingNavigation = null;
  }
}
