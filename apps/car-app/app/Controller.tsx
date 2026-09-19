import { ControllerScreen } from "@roboapps/shared";
import { useRef } from "react";
import { MoveData, toBT } from "@roboapps/shared";
import { useBluetooth } from "../src/components/bluetooth-context";
import { Text } from "react-native";

export default function Controller() {
  const shouldSend = useRef<boolean>(true);
  const {
    bluetooth: { bleTarget, device, handleSend },
    carData: { speed },
  } = useBluetooth();

  if (!bleTarget || !device) return <Text>Error! No device is connected!</Text>;

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

  return <ControllerScreen sendToController={sendToController} speed={speed} />;
}
