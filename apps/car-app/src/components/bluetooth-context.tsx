import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  use,
  useEffect,
  useRef,
  useState,
} from "react";
import useESPBT from "../hooks/useESPBT";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BleManager, { Peripheral } from "react-native-ble-manager";
import { fromBT } from "@shared/utils/Structures";
import { Device } from "@shared/types";

type ContextProps = {
  bluetooth: {
    device: Device | undefined;
    isScanning: boolean;
    isConnecting: boolean;
    handleScan: () => Promise<void>;
    stopScan: () => void;
    handleConnect: (targetDevice: Peripheral) => Promise<void>;
    handleDisconnect: (targetDevice: Peripheral) => Promise<void>;
    handleSend: (data: ArrayBuffer) => Promise<void>;
  };
  deviceName: {
    deviceName: string;
    setDeviceName: (newDeviceName: string) => void;
    handleSave: (deviceName: string) => Promise<void>;
  };
  carData: {
    speed: number;
    isOverridden: boolean;
  };
};

const BluetoothContext = createContext<ContextProps | null>(null);

export function BluetoothProvider({ children }: { children: ReactNode }) {
  const [deviceName, _setDeviceName] = useState("");
  const [speed, setSpeed] = useState<number>(0);
  const [isOverridden, setIsOverridden] = useState(false);
  const bluetooth = useESPBT(deviceName);
  const shouldSave = useRef(false);

  useEffect(() => {
    // Get stored device name
    AsyncStorage.getItem("deviceName")
      .then((value) => {
        if (value) _setDeviceName(value);
      })
      .catch((reason) => {
        AsyncStorage.setItem("deviceName", "ESP32");
      });
  }, []);

  function setDeviceName(newDeviceName: string) {
    _setDeviceName(newDeviceName);
    shouldSave.current = true;
  }

  // Saves deviceName to storage when user exits app
  async function handleSave(deviceName: string) {
    if (!deviceName || !shouldSave.current) return;
    console.log("Saving:", deviceName);
    await AsyncStorage.setItem("deviceName", deviceName).then(
      (value) => {
        console.log("Saved successfully");
        shouldSave.current = false;
      },
      (reason) => console.log("Didnt work bc ", reason),
    );
  }

  useEffect(() => {
    const updateListener = BleManager.onDidUpdateValueForCharacteristic(
      ({ value }) => {
        const data = fromBT(value);

        switch (data.id) {
          case 4:
            setIsOverridden(data.value != 0 ? true : false);
            break;

          case 5:
            setSpeed(data.value);
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
        deviceName: {
          deviceName,
          setDeviceName,
          handleSave,
        },
        carData: {
          speed,
          isOverridden
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
