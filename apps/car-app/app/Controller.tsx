import { ControllerScreen } from "@roboapps/shared";
import { useBluetooth } from "../src/components/bluetooth-context";
import { Text } from "react-native";
import { MoveData } from "@shared/types";
import { useRef } from "react";
import { CtoBT } from "@shared/utils/Structures";

export default function Controller() {
  const {
    bluetooth: { device, handleSend },
    carData: { speed, isOverridden },
  } = useBluetooth();

  const shouldSend = useRef(true);

  /**
   *
   * @param data Data to be sent to controller
   * @param force Whether to override the timeout and send the data right away. You should only use this for passive actions like braking.
   */
  function sendToController(data: MoveData, force: boolean = false) {
    if (!shouldSend.current && !force) return;

    shouldSend.current = false;

    const buffer = CtoBT(data);
    handleSend(buffer);

    setTimeout(() => {
      shouldSend.current = true;
    }, 75);
  }

  // if (!device) return <Text>Error! No device is connected!</Text>;

  return <ControllerScreen sendToController={sendToController} speed={speed} isOverridden={isOverridden} />;
}
