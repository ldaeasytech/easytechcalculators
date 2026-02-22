export function sameDimension(dim1, dim2) {
  return ["M", "L", "T", "Th"].every(
    key => (dim1[key] || 0) === (dim2[key] || 0)
  );
}

export function formatDimension(dim) {
  return Object.entries(dim)
    .filter(([_, v]) => v !== 0)
    .map(([k, v]) => v === 1 ? k : `${k}${v}`)
    .join(" ");
}
