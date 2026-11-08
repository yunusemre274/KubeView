import { Vector3 } from "three";
const projected = new Vector3();
// Keep a caption inside the viewport. Fault captions sit beside the moving
// marker, choosing the side with room rather than covering the falling box.
export function captionPosition(
  object,
  camera,
  size,
  maxWidth = 320,
  beside = false,
) {
  projected.setFromMatrixPosition(object.matrixWorld).project(camera);
  const width = Math.min(maxWidth, Math.max(120, size.width - 32));
  const half = width / 2;
  let x = (projected.x * 0.5 + 0.5) * size.width;
  const y = (-projected.y * 0.5 + 0.5) * size.height;
  if (beside) x += (x > size.width / 2 ? -1 : 1) * (half + 30);
  return [
    Math.max(half + 16, Math.min(size.width - half - 16, x)),
    Math.max(55, Math.min(size.height - 65, y)),
  ];
}
