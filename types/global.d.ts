// Ambient module declarations for ad-hoc start preloads
declare module '#start/socket' {
  const io: any
  export default io
}

// Generic fallback for other #start/* imports (helps editor/tsc resolution)
declare module '#start/*' {
  const value: any
  export default value
}
