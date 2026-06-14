import { NativeModules, Text, View, PermissionsAndroid } from "react-native";
import { ControllerScreen, MainTheme } from "@roboapps/shared";
import { useLocalSearchParams } from "expo-router";
import { useRef, useEffect, useState } from "react";
import BleManager, { Peripheral } from "react-native-ble-manager";
import { MoveData, toBT } from "@roboapps/shared";

export default function Controller() {
  // const device = useRef<Peripheral>(null);
  // const list = useRef<Peripheral[]>([]);
  // const bleTarget = useRef({ service: "", char: "" });
  const [connected, setConnected] = useState(false);
  const [device, setDevice] = useState<Peripheral>();
  const [bleTarget, setBleTarget] = useState<{
    service: string;
    char: string;
  }>();

  const shouldSend = useRef<boolean>(true);

  let list: Peripheral[] = [];

  useEffect(() => {
    BleManager.start({ showAlert: false });

    PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]).then((perms) => {
      console.log(perms["android.permission.BLUETOOTH_SCAN"]);
    });

    const discoverListener = BleManager.onDiscoverPeripheral(
      (peripheral: Peripheral) => {
        if (
          (peripheral.name || peripheral.advertising.localName)?.includes(
            "ESP",
          ) &&
          !list.some((d) => d.id == peripheral.id)
        ) {
          if (peripheral.advertising.serviceUUIDs?.length !== 0) {
            console.log(peripheral);
            list.push(peripheral);
          } else return;
          if (!connected) {
            handleConnect(peripheral);
            setConnected(true);
          }
        }
      },
    );

    const updateListener = BleManager.onDidUpdateValueForCharacteristic(
      ({ value }) => {
        console.log("Updated Characteristic");
      },
    );

    handleScan();

    return () => {
      discoverListener.remove();
      updateListener.remove();
    };
  });

  const handleScan = async () => {
    list = [];
    await BleManager.scan({
      seconds: 5,
      serviceUUIDs: [],
      allowDuplicates: true,
      scanMode: 2,
      matchMode: 1,
    });
    console.log("Started");
  };

  const handleConnect = async (targetDevice: Peripheral) => {
    try {
      await BleManager.stopScan();
      await new Promise((resolve) => setTimeout(resolve, 150));
      await BleManager.connect(targetDevice.id);
      setDevice(targetDevice);
      // setConnected(true);
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

      console.log(info.characteristics);
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

      if (target) {
        setBleTarget({
          service: finalService,
          char: finalChar,
        });
        console.log(bleTarget);
        await BleManager.startNotification(
          targetDevice.id,
          finalService,
          finalChar,
        );
        BleManager.requestConnectionPriority(targetDevice.id, 1).then(() =>
          console.log("Priority given"),
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (data: ArrayBuffer) => {
    const uintdata = new Uint8Array(data);
    const bytes = Array.from(uintdata);

    if (device && bleTarget) {
      await BleManager.writeWithoutResponse(
        device.id,
        bleTarget.service,
        bleTarget.char,
        bytes,
      ).then(() => console.log("Sent"));
    }
  };

  function sendToController(data: string, force: boolean) {
    if (!shouldSend.current && !force && !connected) return;

    const json = JSON.parse(data);
    shouldSend.current = false;

    if (json["route"] == "move") {
      const moveData = json as MoveData;
      const buffer = toBT(moveData);
      handleSend(buffer);
    }

    setTimeout(() => {
      shouldSend.current = true;
    }, 50);
  }

  return (
    <ControllerScreen
      sendToController={sendToController}
      connected={connected}
    />
  );
}
