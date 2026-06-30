export function isTestEndpointEnabled(
  env: {
    ENABLE_TEST_ENDPOINTS?: string;
    NODE_ENV?: string;
  } = process.env,
): boolean {
  return env.ENABLE_TEST_ENDPOINTS === "1" && env.NODE_ENV !== "production";
}
