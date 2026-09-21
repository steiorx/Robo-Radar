import { ControllerScreen } from "@shared/screens/ControllerScreen";
import { useBluetooth } from "../src/components/bluetooth-context";
import { Text } from "react-native";

export default function Controller() {
  const {
    bluetooth: { device, handleSend },
    carsData: { speeds },
  } = useBluetooth();

  if (!device) return <Text>Error! No device is connected!</Text>;

  return <ControllerScreen handleSend={handleSend} speed={speeds[device.peripheral.id]} />;
}
