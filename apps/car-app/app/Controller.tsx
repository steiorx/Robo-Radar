import { ControllerScreen, fromBT, MainTheme } from "@roboapps/shared";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import BleManager, { Peripheral } from "react-native-ble-manager";
import { MoveData, toBT } from "@roboapps/shared";

export default function Controller() {
  const { deviceID, service, char } = useLocalSearchParams<{
    deviceID: string,
    service: string,
    char: string
  }>();
  const shouldSend = useRef<boolean>(true);
  const [speed, setSpeed] = useState<number>(0);
  
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

  useEffect(() => {
    const updateListener = BleManager.onDidUpdateValueForCharacteristic(
      ({ value }) => {
        const data = fromBT(value);

        if (data.id === 5) {
          setSpeed(data.value);
        }
      },
    );

    return () => {
      updateListener.remove();
    }
  })

  /**
   * 
   * @param data Data to be sent to controller
   * @param force Whether to override the timeout and send the data right away. You should only use this for passive actions like braking.
   */
  function sendToController(data: MoveData, force: boolean = false) {
    if (!shouldSend.current && !force) return;

    shouldSend.current = false;

    const buffer = toBT(data);
    handleSend(buffer);

    setTimeout(() => {
      shouldSend.current = true;
    }, 75);
  }

  return (
    <ControllerScreen
      sendToController={sendToController}
      speed={speed}
    />
  );
}
