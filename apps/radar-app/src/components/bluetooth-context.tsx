import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  use,
  useEffect,
  useState,
} from "react";
import useESPBT from "../hooks/useESPBT";
import BleManager, { Peripheral } from "react-native-ble-manager";
import { fromBT } from "@shared/utils/Structures";
import { Device } from "@shared/types";

export type RadarContextProps = {
  bluetooth: {
    device: Device | undefined;
    devices: Device[];
    isScanning: boolean;
    isConnecting: boolean;
    handleScan: () => Promise<void>;
    handleConnect: (targetDevice: Peripheral) => Promise<void>;
    handleDisconnect: (targetDevice: Peripheral) => Promise<void>;
    handleSend: (data: ArrayBuffer) => Promise<void>;
    selectDevice: (targetDevice: Device) => Promise<void>;
  };
  carsData: {
    speeds: Record<string, number>;
  };
};

const BluetoothContext = createContext<RadarContextProps | null>(null);

/**
 * 
 * @todo Add RSSI refreshing for carsData
 */
export function BluetoothProvider({ children }: { children: ReactNode }) {
  const [speeds, setSpeeds] = useState<Record<string, number>>({});
  const bluetooth = useESPBT();

  useEffect(() => {
    const updateListener = BleManager.onDidUpdateValueForCharacteristic(
      ({ value, peripheral }) => {
        const data = fromBT(value);

        if (data.id === 5) {
          setSpeeds((prevSpeeds) => ({
            ...prevSpeeds,
            [peripheral]: data.value
          }))
        }
      },
    );

    return () => {
      updateListener.remove();
    };
  });

  return (
    <BluetoothContext
      value={{
        bluetooth,
        carsData: {
          speeds,
        },
      }}
    >
      {children}
    </BluetoothContext>
  );
}

export function useBluetooth() {
  const context = use(BluetoothContext);

  if (!context) {
    throw new Error("useBluetooth must be used within a BluetoothProvider");
  }

  return context;
}
