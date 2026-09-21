import { Peripheral } from "react-native-ble-manager";

export type Device = {
  peripheral: Peripheral;
  service: string;
  char: string;
};

export type MoveData = {
  /**
   * 1 - acceleration change
   * 2 - direction change
   * 3 - max speed change
   * 4 - battery change?
   */
  id: number;
  value: number;
}