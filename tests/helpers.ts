// Unique per run, so tests can be re-run against the same database
export const uniqueId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const newTestUser = () => {
  const id = uniqueId();
  return {
    username: `e2e-${id}`.slice(0, 30),
    email: `e2e-${id}@example.com`,
    password: 'e2e-password-123',
  };
};
