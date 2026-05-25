// Maps a betType value (BACK/LAY/YES/NO) to the same colours Angular uses
// in styles.scss (`.type-back / .type-yes` → blue, `.type-lay / .type-no` → red).
// Returned classes resolve to the global `--blue` / `--red` CSS variables.
export function betTypeColorClass(betType) {
  const t = (betType ?? '').toString().toUpperCase()
  if (t === 'BACK' || t === 'YES') return 'text-(--blue) uppercase'
  if (t === 'LAY' || t === 'NO') return 'text-(--red) uppercase'
  return ''
}
