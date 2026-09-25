import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { PermissionsAndroid } from "react-native";
import BleManager, { Peripheral } from "react-native-ble-manager";
import { Device, MoveData } from "@shared/types";
import { CtoBT } from "@shared/utils/Structures";
import licenses from "apps/radar-app/assets/licenses.json";

export default function useESPBT() {
  // Switch back to useState if not working
  const device = useRef<Device | undefined>(undefined);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false); // does nothing here
  const pathname = usePathname();
  const isControllingDevice = pathname === "/Controller";

  const router = useRouter();

  useEffect(() => {
    PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    ]);
    BleManager.start({ showAlert: false });
  }, []);

  useEffect(() => {
    const discoverListener = BleManager.onDiscoverPeripheral(
      (peripheral: Peripheral) => {
        if (peripheral.name?.includes("ESP")) {
          if (peripheral.advertising.serviceUUIDs?.length !== 0) {
            handleConnect(peripheral);
          }
        }
      },
    );

    const disconnectListener = BleManager.onDisconnectPeripheral((event) => {
      // If doesn't work, inspect event.peripheral (it is supposed to be device.id)
      setDevices(
        devices.filter((device) => device.peripheral.id != event.peripheral),
      );
      console.log("Disconnected");
      if (device.current?.peripheral.id == event.peripheral) {
        device.current = undefined;
        if (router.canDismiss()) router.dismissAll();
      }
    });

    return () => {
      discoverListener.remove();
      disconnectListener.remove();
    };
  }, []);

  useEffect(() => {
    if (!isControllingDevice) selectDevice(null); 
  }, [isControllingDevice]);

  const handleScan = async () => {
    setIsScanning(true);
    BleManager.stopScan();
    BleManager.scan({
      seconds: 5,
      serviceUUIDs: [],
      allowDuplicates: true,
      scanMode: 2,
      matchMode: 1,
    });
    setTimeout(() => {
      setIsScanning(false);
    }, 5000);
  };

  const stopScan = () => {
    BleManager.stopScan();
    setIsScanning(false);
  };

  const handleConnect = async (targetDevice: Peripheral) => {
    try {
      await BleManager.connect(targetDevice.id);
      console.log(
        "Connected:",
        targetDevice.id,
        targetDevice.advertising.serviceUUIDs,
      );

      await BleManager.requestMTU(targetDevice.id, 32);

      const info = await BleManager.retrieveServices(targetDevice.id);

      await new Promise((resolve) => setTimeout(resolve, 150));

      if (!info.characteristics) {
        console.error("No characteristics");
        return;
      }

      // Find the correct characteristic
      const target = info.characteristics.find((c) => {
        const uuid = c.characteristic.toLowerCase();
        const hasWrite =
          c.properties &&
          (c.properties.Write || Object.keys(c.properties).includes("Write"));
        const hasRead =
          c.properties &&
          (c.properties.Read || Object.keys(c.properties).includes("Read"));
        const hasNotify =
          c.properties &&
          (c.properties.Notify || Object.keys(c.properties).includes("Notify"));
        return hasWrite && hasRead && hasNotify;
      });

      if (!target) return;

      console.log(target);

      const finalService = target.service;
      const finalChar = target.characteristic;

      console.log(finalChar, finalService);

      if (target) {
        await BleManager.startNotification(
          targetDevice.id,
          finalService,
          finalChar,
        );
        await new Promise((resolve) => setTimeout(resolve, 150));
        BleManager.requestConnectionPriority(targetDevice.id, 1).then(() =>
          console.log("Priority given"),
        );
        setDevices([
          ...devices,
          { peripheral: targetDevice, service: finalService, char: finalChar, licensed: licenses.names.includes(targetDevice.name ?? "") },
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectDevice = async (targetDevice: Device | null) => {
    if (targetDevice?.peripheral.id === device.current?.peripheral.id) return;
    if (targetDevice === null) device.current = undefined;
    else device.current = targetDevice;

    const alertRadar: MoveData = {
      id: 4,
      value: 69,
    };
    // Firmware handles new owner with car structure
    await handleSend(CtoBT(alertRadar));

    if (targetDevice) router.navigate({
      pathname: "./Controller",
    });
  };

  const handleDisconnect = async (targetDevice: Peripheral) => {
    await BleManager.disconnect(targetDevice.id).then((value) =>
      console.log("Disconnected", value),
    );
    setDevices(
      devices.filter((device) => device.peripheral.id != targetDevice.id),
    );
    if (device.current?.peripheral.id == targetDevice.id) {
      device.current = undefined;
    }
  };

  const handleSend = async (data: ArrayBuffer) => {
    if (!device.current) return;
    const uintdata = new Uint8Array(data);
    const bytes = Array.from(uintdata);

    await BleManager.writeWithoutResponse(
      device.current.peripheral.id,
      device.current.service,
      device.current.char,
      bytes,
    );
  };

  return {
    device: device.current,
    devices,
    isScanning,
    isConnecting, // Not doing anything for now
    handleScan,
    stopScan,
    handleConnect,
    handleDisconnect,
    handleSend,
    selectDevice,
  };
}
