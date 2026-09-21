import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { PermissionsAndroid } from "react-native";
import BleManager, { Peripheral } from "react-native-ble-manager";
import { Device } from "@shared/types";

export default function useESPBT(deviceName: string) {
  // Switch back to useState if not working
  const device = useRef<Device | undefined>(undefined);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const router = useRouter();

  useEffect(() => {
    PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
  }, []);

  useEffect(() => {
    if (device.current) BleManager.disconnect(device.current.peripheral.id);
    device.current = undefined;
    BleManager.start({ showAlert: false });

    const discoverListener = BleManager.onDiscoverPeripheral(
      (peripheral: Peripheral) => {
        if (!deviceName) return;
        if (peripheral.name?.includes(deviceName)) {
          if (peripheral.advertising.serviceUUIDs?.length !== 0) {
            handleConnect(peripheral);
            BleManager.stopScan();
            setIsScanning(false);
          } else return;
        }
      },
    );

    const disconnectListener = BleManager.onDisconnectPeripheral(() => {
      console.log("Disconnected");
      device.current = undefined;
      if (router.canDismiss()) router.dismissAll();
    });

    return () => {
      discoverListener.remove();
      disconnectListener.remove();
    };
  }, [deviceName]);

  const handleScan = async () => {
    setIsScanning(true);
    BleManager.stopScan();
    device.current = undefined;
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
  }

  const handleConnect = async (targetDevice: Peripheral) => {
    try {
      setIsConnecting(true);
      if (device.current) BleManager.disconnect(device.current.peripheral.id);
      device.current = undefined;
      await BleManager.stopScan();
      await new Promise((resolve) => setTimeout(resolve, 150));
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
        device.current = {peripheral: targetDevice, service: finalService, char: finalChar}
      }
    } catch (err) {
      console.error(err);
    }
    setIsConnecting(false);
  };

  const handleDisconnect = async (targetDevice: Peripheral) => {
    await BleManager.disconnect(targetDevice.id).then((value) =>
      console.log("Disconnected", value),
    );
    device.current = undefined;
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
    isScanning,
    isConnecting,
    handleScan,
    stopScan,
    handleConnect,
    handleDisconnect,
    handleSend,
  };
}
