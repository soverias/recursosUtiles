export const environment = {
  production: false,
  // For local dev we point to the prod backend so push notifications work E2E without
  // spinning up a local .NET server. Swap to 'http://localhost:5014' if iterating on backend.
  apiBase: 'http://192.168.1.101:5014',
};
