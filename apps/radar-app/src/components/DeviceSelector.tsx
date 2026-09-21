import { Pressable, Text, View } from "react-native";
import { useBluetooth } from "./bluetooth-context";
import { Device } from "@shared/types";

export default function DeviceSelector() {
  const {
    bluetooth: { devices, handleScan, isScanning, selectDevice },
    carsData: { speeds },
  } = useBluetooth();

  return (
    <View className="w-5/6 h-3/4 mx-auto flex justify-center gap-1">
      {devices.map((device) => (
        <Pressable
          key={device.peripheral.id}
          className="rounded-lg w-full h-max border-gray-600 border-2 p-2"
          onPress={() => selectDevice(device)}
        >
          <View className="flex-row">
            <View className="h-full w-3/5">
              {/* Device Name & ID */}
              <Text className="font-bold text-3xl">
                {device.peripheral.name ?? "Unnamed device"}
              </Text>
              <Text className="font-extralight text-xl">
                {device.peripheral.id}
              </Text>
              {/* Separator */}
              <View className="w-full h-px px-4 my-2 bg-gray-500" />

              {/* Device Data */}
              <View>
                <Text className="font-medium text-gray-600">
                  RSSI: <Text className="font-semibold text-black">{device.peripheral.rssi}</Text>
                </Text>
                <Text className="absolute right-0 font-medium text-gray-600">
                  Speed: <Text className="font-semibold text-black">{speeds[device.peripheral.id]}</Text>
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      ))}
      <Pressable className="p-3 m-2 bg-cyan-400 w-1/2 self-center rounded-xl" onPress={() => handleScan()}>
        <Text className="text-xl text-center">{isScanning ? "Scanning..." : "Scan"}</Text>
      </Pressable>
    </View>
  );
}
