import { ControllerScreen, MainTheme } from "@roboapps/shared";
import { useLocalSearchParams } from "expo-router";
import { useRef } from "react";
import BleManager, { Peripheral } from "react-native-ble-manager";
import { MoveData, toBT } from "@roboapps/shared";

export default function Controller() {
  const { deviceID, service, char } = useLocalSearchParams<{
    deviceID: string,
    service: string,
    char: string
  }>();
  console.log(deviceID, service, char);
  const shouldSend = useRef<boolean>(true);

  let list: Peripheral[] = [];

  const handleSend = async (data: ArrayBuffer) => {
    const uintdata = new Uint8Array(data);
    const bytes = Array.from(uintdata);

    await BleManager.writeWithoutResponse(
      deviceID,
      service,
      char,
      bytes,
    ).then(() => console.log("Sent"));
  };

  function sendToController(data: string, force: boolean) {
    if (!shouldSend.current && !force) return;

    const json = JSON.parse(data);
    shouldSend.current = false;

    if (json["route"] == "move") {
      const moveData = json as MoveData;
      const buffer = toBT(moveData);
      handleSend(buffer);
    }

    setTimeout(() => {
      shouldSend.current = true;
    }, 50);
  }

  return (
    <ControllerScreen
      sendToController={sendToController}
    />
  );
}
