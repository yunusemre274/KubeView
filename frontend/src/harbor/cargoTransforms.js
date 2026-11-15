// Compose a box in an already computed vessel basis. The basis has unit scale.
// Offsets stay unscaled, matching arrivalVisual's existing box-size transition.
export function writeCargoMatrix(out, basis, anchor, offset, size, scale = 1) {
  const e = basis.elements;
  const x = anchor[0] + offset[0],
    y = anchor[1] + offset[1],
    z = anchor[2] + offset[2];
  const k = Math.max(0.0001, scale),
    sx = size[0] * k,
    sy = size[1] * k,
    sz = size[2] * k;
  out.set(
    e[0] * sx,
    e[4] * sy,
    e[8] * sz,
    e[0] * x + e[4] * y + e[8] * z + e[12],
    e[1] * sx,
    e[5] * sy,
    e[9] * sz,
    e[1] * x + e[5] * y + e[9] * z + e[13],
    e[2] * sx,
    e[6] * sy,
    e[10] * sz,
    e[2] * x + e[6] * y + e[10] * z + e[14],
    0,
    0,
    0,
    1,
  );
  return out;
}
