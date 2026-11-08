// React Router v6 "future flags": opt in to the v7 behaviour now, so upgrading later changes
// nothing (and v6 stops logging warnings about it). Shared by the app and the tests.
export const ROUTER_FUTURE = { v7_startTransition: true, v7_relativeSplatPath: true } as const;
