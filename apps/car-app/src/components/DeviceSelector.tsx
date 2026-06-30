import { useState, useEffect, useRef } from "react";
import BleManager, { Peripheral } from "react-native-ble-manager";
import { Link, useRouter } from "expo-router";
import {
  PermissionsAndroid,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  AppState,
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

    if (device) BleManager.disconnect(device?.id);
    setDevice(undefined);
    BleManager.start({ showAlert: false });

    PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]).then((perms) => {
      // console.log(perms["android.permission.BLUETOOTH_SCAN"]);
    });

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

    const updateListener = BleManager.onDidUpdateValueForCharacteristic(
      ({ value }) => {
        console.log("Updated Characteristic");
      },
    );

    const disconnectListener = BleManager.onDisconnectPeripheral(() => {
      console.log("Disconnected");
      setDevice(undefined);
      if (router.canDismiss()) router.dismissAll();
    });

    return () => {
      discoverListener.remove();
      updateListener.remove();
      disconnectListener.remove();
    };
  }, []);

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

  const [overlay, setOverlay] = useState(false);

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
    <View style={styles.container}>
      <TextInput
        style={styles.deviceNameContainer}
        defaultValue={deviceName}
        value={deviceName}
        onChangeText={async (value) => {
          console.log(value, deviceName);
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
          ...styles.connectContainer,
          backgroundColor: getBGColor(),
          transitionProperty: 'backgroundColor',
          transitionDuration: '300ms',
          transitionBehavior: 'allow-discrete',
          transitionTimingFunction: 'ease-in-out'
        }}
      >
        <Pressable
          style={styles.connectPressable}
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
          <Text style={styles.connectScanText}>
            {getStateText()}
          </Text>
        </Pressable>
      </Animated.View>
    </View>

    // <View style={styles.container}>
    //   <Pressable style={{...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center', backgroundColor: 'blue'}} onPress={() => setOverlay(true)}>
    //     <Text style={{color: 'white'}}>Open Overlay</Text>
    //   </Pressable>

    //   {overlay && (
    //     <View style={{backgroundColor: 'red', position: 'absolute', top: '-10%'}}>
    //       <Pressable onPress={() => setOverlay(false)}>
    //         <Text>Close</Text>
    //       </Pressable>
    //     </View>
    //   )}
    // </View>
  );

  // return (
  //   <View style={styles.container}>
  //     <ScrollView style={styles.devicesContainer}>
  //       {deviceList.length > 0 ? (
  //         // Does not need filter because handleScan already filters the names
  //         deviceList.map((p) => {
  //           // TODO: Add battery perchance
  //           // TODO: Add PIN perchance

  //           // TODO + REMAKE: Remove list and look for built-in name
  //           return (
  //             <Pressable
  //               key={p.id}
  //               style={{
  //                 ...styles.deviceContainer,
  //                 backgroundColor:
  //                   device?.id === p.id ? "#00c82b" : "#00000000",
  //               }}
  //               onPress={() => handleConnect(p)}
  //             >
  //               <Text>{p.name}</Text>
  //             </Pressable>
  //           );
  //         })
  //       ) : (
  //         <Text>Looking for devices...</Text>
  //       )}
  //     </ScrollView>
  //     {/* TODO: Animate color transitions */}

  //     <Pressable
  //       style={{
  //         ...styles.connectContainer,
  //         backgroundColor: !!device ? "#41a3ff" : "rgb(159, 159, 223)",
  //       }}
  //       onPress={() => {
  //         if (!!device) {
  //           router.navigate({pathname: './Controller', params: {
  //             deviceID: device.id,
  //             service: bleTarget?.service,
  //             char: bleTarget?.char
  //           }})
  //         } else handleScan();
  //       }}
  //     >
  //       <Text style={styles.connectScanText}>
  //         {!!device ? "Go to Controller" : "SCAN"}
  //       </Text>
  //     </Pressable>
  //   </View>
  // );
}

const styles = StyleSheet.create({
  // The ScrollView that lists all the detected ESP32s
  container: {
    height: "50%",
    width: "75%",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  deviceNameContainer: {
    height: "15%",
    width: "100%",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#999999",
    textAlign: "center",
    color: "black"
  },
  connectContainer: {
    height: "20%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "black",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { height: 2, width: 2 },
    elevation: 6,
    backgroundColor: "white",
    borderRadius: 10,
    
  },
  connectPressable: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  connectScanText: {
    fontWeight: 600,
    fontSize: 30,
    color: "white",
  },
});
