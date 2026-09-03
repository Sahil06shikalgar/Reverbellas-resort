export function gstTaxLabel(billing) {
  const percent = Number(billing?.taxPercent || 0);
  return percent > 0 ? `GST Tax (${percent}%)` : 'GST Tax';
}
