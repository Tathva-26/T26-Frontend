export function expoTiming(mobile) {
  const exitStart = mobile ? 1.4 : 1.2
  return { exitStart, duration: exitStart + .45, scrollUnit: mobile ? 1.5 : 2.4 }
}
