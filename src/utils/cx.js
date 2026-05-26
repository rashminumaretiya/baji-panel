// Tiny className joiner. Falsy values (false, null, undefined, 0, '') drop
// out, so conditional class expressions like `isActive && 'bg-red'` work as
// expected. Re-implemented in many files before centralization; import from
// here going forward.
export function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default cx
