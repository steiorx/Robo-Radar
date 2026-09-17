import { useState, useEffect, useRef } from "react";
import BleManager, { Peripheral } from "react-native-ble-manager";
import { useRouter } from "expo-router";
import {
  PermissionsAndroid,
  View,
  Text,
  Pressable,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated from "react-native-reanimated";

export default function DeviceSelector() {
  const [device, setDevice] = useState<Peripheral>();
  const [bleTarget, setBleTarget] = useState<{
    service: string;
    char: string;
  }>();
  const [deviceName, setDeviceName] = useState<string>();
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const shouldSave = useRef(false);

  const router = useRouter();

  useEffect(() => {
    PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]).then((perms) => {
      // console.log(perms["android.permission.BLUETOOTH_SCAN"]);
    });
  });

  useEffect(() => {
    // Get stored device name
    AsyncStorage.getItem("deviceName")
      .then((value) => {
        if (value) setDeviceName(value);
        console.log("Fetched deviceName:", value);
      })
      .catch((reason) => {
        AsyncStorage.setItem("deviceName", "ESP32");
        console.log("Created new value for deviceName");
      });
  })

  useEffect(() => {
    if (device) BleManager.disconnect(device?.id);
    setDevice(undefined);
    BleManager.start({ showAlert: false });

    const discoverListener = BleManager.onDiscoverPeripheral(
      (peripheral: Peripheral) => {
        // console.log(peripheral);
        if (!deviceName) return;
        if (peripheral.name?.includes(deviceName)) {
          console.log("Found?")
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
      setDevice(undefined);
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
    setDevice(undefined);
    BleManager.scan({
      seconds: 5,
      serviceUUIDs: [],
      allowDuplicates: true,
      scanMode: 2,
      matchMode: 1,
    });
    setTimeout(() => {
      setIsScanning(false);
      console.log("Stop scan");
    }, 5000);
  };

  const handleConnect = async (targetDevice: Peripheral) => {
    try {
      setIsConnecting(true);
      if (device) BleManager.disconnect(device.id);
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
        setDevice(targetDevice);
        setBleTarget({
          service: finalService,
          char: finalChar,
        });
        await BleManager.startNotification(
          targetDevice.id,
          finalService,
          finalChar,
        );
        await new Promise((resolve) => setTimeout(resolve, 150));
        BleManager.requestConnectionPriority(targetDevice.id, 1).then(() =>
          console.log("Priority given"),
        );
      }
    } catch (err) {
      console.error(err);
    }
    setIsConnecting(false);
  };

  const handleDisconnect = async (targetDevice: Peripheral) => {
    await BleManager.disconnect(targetDevice.id).then((value) => console.log("Disconnected", value));
    setDevice(undefined);
  };

  // Saves deviceName to storage when user exits app
  async function handleSave(deviceName: string) {
    if (!deviceName || !shouldSave.current) return;
    console.log("Saving:", deviceName)
    await AsyncStorage.setItem("deviceName", deviceName)
      .then((value) => {
        console.log("Saved successfully");
        shouldSave.current = false;
      }, (reason) => console.log("Didnt work bc ", reason));
  };

  function getBGColor() {
    if (!!device) 
    {
      return "#3bff1d"
    } else if (isScanning) {
      return "#8adcff"
    } else {
      if (isConnecting) {
        return "#ffb428"
      } 
      else return "#13b8ff"
    }
  }

  function getStateText() {
    if (!!device) 
    {
      return "Control"
    } else if (isScanning) {
      return "Scanning..."
    } else {
      if (isConnecting) {
        return "Connecting..."
      } 
      else return "Scan"
    }
  }

  return (
    <View className="h-1/2 w-3/4 justify-center items-center gap-4">
      <TextInput
        className="w-full rounded-lg border-[1px] border-[#999999] text-center h-[15%]"
        defaultValue={deviceName}
        value={deviceName}
        onChangeText={async (value) => {
          if (isScanning) {
            BleManager.stopScan();
            setIsScanning(false);
          }
          if (!!device) {
            await handleDisconnect(device);
          }
          if (value.endsWith(' ')) value.slice(0, value.length - 1);
          setDeviceName(value);
          shouldSave.current = true;
        }}
        onEndEditing={() => {
          if (!deviceName) return;
          let deviceReal = deviceName
          if (deviceReal.endsWith(' ')) {
            deviceReal = deviceReal.slice(0, deviceReal.length - 1);
            setDeviceName(deviceReal)
          }
          handleSave(deviceReal);
          }}
        // editable={!isScanning}
      />
      <Animated.View
        style={{
          backgroundColor: getBGColor(),
          transitionProperty: 'backgroundColor',
          transitionDuration: '300ms',
          transitionBehavior: 'allow-discrete',
          transitionTimingFunction: 'ease-in-out'
        }}
        className="h-1/5 w-full justify-center items-center android:elevation-md ios:shadow-md rounded-lg"
      >
        <Pressable
          className="items-center justify-center size-full"
          onPress={async () => {
            if (!!device) {
              router.navigate({
                pathname: "./Controller",
                params: {
                  deviceID: device.id,
                  service: bleTarget?.service,
                  char: bleTarget?.char,
                },
              });
            } else if (!isScanning) handleScan();
          }}
        >
          <Text className="font-semibold text-4xl color-white">
            {getStateText()}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}