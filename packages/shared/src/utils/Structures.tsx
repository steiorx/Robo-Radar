export type MoveData = {
  moveX: number;
  moveY: number;
  accelerate: number;
}

export function toBT(data: MoveData)
{
  const buffer = new ArrayBuffer(9);
  const view = new DataView(buffer);

  view.setFloat32(0, data.moveX, true);
  view.setFloat32(4, data.moveY, true);
  view.setInt8(8, data.accelerate);

  return buffer;
}