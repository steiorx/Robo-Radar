import { MoveData } from "@shared/types";

export function toBT(data: MoveData)
{
  const buffer = new ArrayBuffer(3);
  const view = new DataView(buffer);

  view.setUint8(0, data.id);
  view.setInt16(1, data.value, true);

  return buffer;
}

export function fromBT(data: number[]) 
{
  const buffer = new Uint8Array(data).buffer;
  const view = new DataView(buffer);

  let res: MoveData = {
    id: view.getUint8(0),
    value: view.getInt16(1, true)
  };

  return res;
}