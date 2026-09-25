import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import BleManager, { Peripheral } from "react-native-ble-manager";
import { Device } from "@shared/types";

export default function useESPBT(deviceName: string) {
  // TODO: Switch back to useState 
  const [device, setDevice] = useState<Device | undefined>(undefined);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const router = useRouter();

  useEffect(() => {
    const initializeBluetooth = async () => {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      ];

      const results = await PermissionsAndroid.requestMultiple(permissions);
      const denied = Object.entries(results).filter(
        ([, result]) => result !== PermissionsAndroid.RESULTS.GRANTED,
      );
      if (denied.length !== 0) {
        console.error("Bluetooth permissions denied", denied);
      }

      await BleManager.start({showAlert: false});
    };

    initializeBluetooth().catch((error) =>
      console.error("Bluetooth initialization failed", error),
    );
  }, []);

  useEffect(() => {
    if (device) BleManager.disconnect(device.peripheral.id);
    setDevice(undefined);
    let discoverListener: { remove: () => void } | undefined;
    let disconnectListener: { remove: () => void } | undefined;
    let cancelled = false;

    const initializeBluetooth = async () => {
      try {
        // await BleManager.start({ showAlert: false });
        if (cancelled) return;

        discoverListener = BleManager.onDiscoverPeripheral(
          (peripheral: Peripheral) => {
            console.log(peripheral);
            if (!deviceName) return;
            console.log(peripheral.name);
            if (peripheral.name?.includes(deviceName)) {
              if (peripheral.advertising.serviceUUIDs?.length !== 0) {
                handleConnect(peripheral);
                BleManager.stopScan();
                setIsScanning(false);
              } else return;
            }
          },
        );

        disconnectListener = BleManager.onDisconnectPeripheral(() => {
          console.log("Disconnected");
          setDevice(undefined);
          if (router.canDismiss()) router.dismissAll();
        });
      } catch (error) {
        console.error("Bluetooth manager start failed", error);
      }
    };

    initializeBluetooth();

    return () => {
      discoverListener?.remove();
      disconnectListener?.remove();
    };
  }, [deviceName]);

  const handleScan = async () => {
    console.log("Scanning");
    setIsScanning(true);
    BleManager.stopScan();
    setDevice(undefined);
    BleManager.scan({
      seconds: 5,
      // serviceUUIDs: [],
      // allowDuplicates: true,
      // scanMode: 2,
      // matchMode: 1,
    });
    setTimeout(() => {
      setIsScanning(false);
    }, 5000);
  };

  const stopScan = () => {
    console.log("stop");
    BleManager.stopScan();
    setIsScanning(false);
  };

  const handleConnect = async (targetDevice: Peripheral) => {
    try {
      setIsConnecting(true);
      if (device) BleManager.disconnect(device.peripheral.id);
      setDevice(undefined);
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
        setDevice({
          peripheral: targetDevice,
          service: finalService,
          char: finalChar,
        });
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
    setDevice(undefined);
  };

  const handleSend = async (data: ArrayBuffer) => {
    if (!device) return;
    const uintdata = new Uint8Array(data);
    const bytes = Array.from(uintdata);

    await BleManager.writeWithoutResponse(
      device.peripheral.id,
      device.service,
      device.char,
      bytes,
    );
  };

  return {
    device,
    isScanning,
    isConnecting,
    handleScan,
    stopScan,
    handleConnect,
    handleDisconnect,
    handleSend,
  };
}
