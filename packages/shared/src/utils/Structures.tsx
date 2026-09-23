import { MoveData, RadarMoveData } from "@shared/types";

export function CtoBT(data: MoveData) {
  const buffer = new ArrayBuffer(3);
  const view = new DataView(buffer);

  view.setUint8(0, data.id);
  view.setInt16(1, data.value, true);

  return buffer;
}

export function RtoBT(data: RadarMoveData) {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);

  view.setUint8(0, data.password);
  view.setUint8(1, data.moveData.id);
  view.setInt16(2, data.moveData.value, true);

  return buffer;
}

export function fromBT(data: number[]) {
  const buffer = new Uint8Array(data).buffer;
  const view = new DataView(buffer);

  let res: MoveData = {
    id: view.getUint8(0),
    value: view.getInt16(1, true),
  };

  return res;
}
