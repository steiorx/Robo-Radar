import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AppState, PermissionsAndroid, Platform } from "react-native";
import BleManager, { BleState, Peripheral } from "react-native-ble-manager";
import { Device, MoveData, RadarMoveData } from "@shared/types";
import { CtoBT, RtoBT } from "@shared/utils/Structures";
import licenses from "../../assets/licenses.json";
import { useAudioPlayer } from "expo-audio";
import audioSource from "../../assets/danger-alarm-sound-effect-meme.mp3";

export default function useESPBT() {
  // Switch back to useState if not working
  const device = useRef<Device | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false); // does nothing here
  const bluetoothStarted = useRef(false);
  const pathname = usePathname();
  const isControllingDevice = pathname === "/Controller";
  const tempDevices = useRef<Device[]>([]);

  const [hasClose, setHasClose] = useState<boolean>(false);
  const [minRSSI, setMinRSSI] = useState(-60);
  const player = useAudioPlayer(audioSource);
  player.loop = true;

  const refreshInterval = 200;

  const router = useRouter();

  const toUnique = () => {
    let set: Device[] = [];
    let hasCloseTemp = false;
    tempDevices.current.forEach((device) => {
      if (set.find((dev) => dev.peripheral.id == device.peripheral.id)) return;
      if (!device.licensed) {
        device.close = device.peripheral.rssi > minRSSI;
        if (device.close) hasCloseTemp = true;
      }
      set.push(device);
    });
    setHasClose(hasCloseTemp);
    set.sort((a, b) => a.peripheral.id.localeCompare(b.peripheral.id));
    setDevices(set);
  };

  useEffect(() => {
    tempDevices.current = [];

    const discoverListener = BleManager.onDiscoverPeripheral(
      (peripheral: Peripheral) => {
        if (
          peripheral.name?.includes("ESP") &&
          peripheral.advertising.serviceUUIDs?.length !== 0 &&
          !devices.find((device) => device.peripheral.id == peripheral.id)
        ) {
          handleConnect(peripheral);
        }
      },
    );

    const disconnectListener = BleManager.onDisconnectPeripheral((event) => {
      // If doesn't work, inspect event.peripheral (it is supposed to be device.id)
      tempDevices.current = tempDevices.current.filter(
        (device) => device.peripheral.id != event.peripheral,
      );
      console.log("Disconnected");
      if (device.current?.peripheral.id == event.peripheral) {
        device.current = null;
        if (router.canDismiss()) router.dismissAll();
      }
    });

    return () => {
      discoverListener.remove();
      disconnectListener.remove();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(toUnique, refreshInterval);

    return () => clearInterval(interval);
  }, [minRSSI]);

  useEffect(() => {
    if (!isControllingDevice) unselectDevice();
  }, [isControllingDevice]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextAppState) => {
      unselectDevice();
      if (router.canDismiss()) router.dismissAll();
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (hasClose && !isControllingDevice) player.play();
    else {
      player.pause();
      player.seekTo(0);
    }
  }, [hasClose, isControllingDevice]);

  const handleScan = async () => {
    try {
      if (Platform.OS === "android") {
        if (AppState.currentState !== "active") return;

        const permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ];
        const results = await PermissionsAndroid.requestMultiple(permissions);
        const denied = Object.entries(results).filter(
          ([, result]) => result !== PermissionsAndroid.RESULTS.GRANTED,
        );

        if (denied.length !== 0) {
          console.error("Bluetooth permissions denied", denied);
          return;
        }

        const btState = await BleManager.checkState();

        if (btState === BleState.Off)
          try {
            await BleManager.enableBluetooth();
          } catch {
            return;
          }
      }

      if (!bluetoothStarted.current) {
        await BleManager.start({ showAlert: false });
        bluetoothStarted.current = true;
      }

      tempDevices.current = [];

      setIsScanning(true);
      BleManager.stopScan();
      await BleManager.scan({
        serviceUUIDs: [],
        allowDuplicates: true,
        scanMode: 2,
        matchMode: 1,
      });
    } catch (error) {
      setIsScanning(false);
      console.error("Bluetooth scan failed", error);
    }
  };

  const stopScan = () => {
    BleManager.stopScan();
    setIsScanning(false);
  };

  const handleConnect = async (targetDevice: Peripheral) => {
    if (await BleManager.isPeripheralConnected(targetDevice.id)) {
      const devIndex = tempDevices.current.findIndex(
        (device) => device.peripheral.id,
      );
      if (devIndex != -1)
        tempDevices.current[devIndex].peripheral.rssi = targetDevice.rssi;
      return;
    }
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

      const finalService = target.service;
      const finalChar = target.characteristic;

      if (target) {
        await BleManager.startNotification(
          targetDevice.id,
          finalService,
          finalChar,
        );
        await new Promise((resolve) => setTimeout(resolve, 150));
        await BleManager.requestConnectionPriority(targetDevice.id, 1);
        tempDevices.current.push({
          peripheral: targetDevice,
          service: finalService,
          char: finalChar,
          licensed: licenses.names.includes(targetDevice.name ?? ""),
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectDevice = async (targetDevice: Device) => {
    if (targetDevice?.peripheral.id === device.current?.peripheral.id) return;
    device.current = targetDevice;

    const alertRadar: MoveData = {
      id: 4,
      value: 69,
    };
    // Firmware handles new owner with car structure
    await handleSend(CtoBT(alertRadar));

    if (targetDevice)
      router.navigate({
        pathname: "./Controller",
      });
  };

  const unselectDevice = async () => {
    if (!device.current) return;

    const alertRadar: RadarMoveData = {
      password: 67,
      moveData: {
        id: 4,
        value: 67,
      },
    };

    await handleSend(RtoBT(alertRadar));

    device.current = null;
  };

  const handleDisconnect = async (targetDevice: Peripheral) => {
    await BleManager.disconnect(targetDevice.id).then((value) =>
      console.log("Disconnected", value),
    );
    setDevices(
      devices.filter((device) => device.peripheral.id != targetDevice.id),
    );
    if (device.current?.peripheral.id == targetDevice.id) {
      device.current = null;
    }
  };

  const handleSend = async (data: ArrayBuffer) => {
    if (!device.current) return;
    const uintdata = new Uint8Array(data);
    const bytes = Array.from(uintdata);

    console.log("sent");

    await BleManager.writeWithoutResponse(
      device.current.peripheral.id,
      device.current.service,
      device.current.char,
      bytes,
    );
  };

  return {
    device,
    devices,
    isScanning,
    isConnecting, // Not doing anything for now
    handleScan,
    stopScan,
    handleConnect,
    handleDisconnect,
    handleSend,
    selectDevice,
    unselectDevice,
    minRSSI,
    setMinRSSI,
  };
}
