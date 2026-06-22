import { Button, Column, Host } from "@expo/ui";
import MenuView, { MenuAction } from "@expo/ui/community/menu";
import { useState, useEffect } from "react";
import BleManager, { Peripheral } from "react-native-ble-manager";
import { Link, useRouter } from "expo-router";
import {
  PermissionsAndroid,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";

// function WaitingCard() {}

export default function DeviceSelector() {
  const [deviceList, setDeviceList] = useState<Peripheral[]>([]);
  const [device, setDevice] = useState<Peripheral>();
  const [bleTarget, setBleTarget] = useState<{
    service: string;
    char: string;
  }>();

  const router = useRouter();

  useEffect(() => {
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
        if (
          (peripheral.name || peripheral.advertising.localName)?.includes(
            "ESP",
          ) &&
          !deviceList.some((d) => d.id == peripheral.id)
        ) {
          if (peripheral.advertising.serviceUUIDs?.length !== 0) {
            setDeviceList([...deviceList, peripheral]);
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
      setDeviceList([]);
      handleScan();
      router.dismissAll();
    });

    handleScan();

    return () => {
      discoverListener.remove();
      updateListener.remove();
      disconnectListener.remove();
    };
  }, []);

  const handleScan = async () => {
    BleManager.stopScan();
    setDeviceList([]);
    setDevice(undefined);
    await BleManager.scan({
      seconds: 5,
      serviceUUIDs: [],
      allowDuplicates: true,
      scanMode: 2,
      matchMode: 1,
    });
    console.log("Started scan");
  };

  const handleConnect = async (targetDevice: Peripheral) => {
    try {
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
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.devicesContainer}>
        {deviceList.length > 0 ? (
          // Does not need filter because handleScan already filters the names
          deviceList.map((p) => {
            return (
              <Pressable
                key={p.id}
                style={{
                  ...styles.deviceContainer,
                  backgroundColor:
                    device?.id === p.id ? "#00c82b" : "#00000000",
                }}
                onPress={() => handleConnect(p)}
              >
                <Text>{p.name}</Text>
              </Pressable>
            );
          })
        ) : (
          <Text>Looking for devices...</Text>
        )}
      </ScrollView>
      {/* TODO: Animate color transitions */}
      
      <Pressable
        style={{
          ...styles.connectContainer,
          backgroundColor: !!device ? "#41a3ff" : "rgb(159, 159, 223)",
        }}
        onPress={() => {
          if (!!device) {
            router.navigate({pathname: './Controller', params: {
              deviceID: device.id,
              service: bleTarget?.service,
              char: bleTarget?.char
            }})
          } else handleScan();
        }}
      >
        <Text style={styles.connectScanText}>
          {!!device ? "Go to Controller" : "SCAN"}
        </Text>
      </Pressable>
    </View>
  );
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
  devicesContainer: {
    width: "100%",

    borderColor: "gray",
    borderRadius: 5,
    borderWidth: 2,
    padding: 10,
  },
  // A View for each device
  deviceContainer: {
    // flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 30,
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
    borderRadius: 5,
  },
  connectScanText: {
    fontWeight: 600,
    fontSize: 30,
    color: 'black'
  }
});
