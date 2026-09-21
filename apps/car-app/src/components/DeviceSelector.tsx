import BleManager from "react-native-ble-manager";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  Pressable,
  TextInput,
} from "react-native";
import Animated from "react-native-reanimated";
import { useBluetooth } from "./bluetooth-context";

export default function DeviceSelector() {
  const {
    bluetooth: {
      device,
      isScanning,
      isConnecting,
      handleScan,
      stopScan,
      handleDisconnect,
    },
    deviceName: { deviceName, setDeviceName, handleSave },
  } = useBluetooth();

  const router = useRouter();

  function getBGColor() {
    if (!!device) {
      return "#3bff1d";
    } else if (isScanning) {
      return "#8adcff";
    } else {
      if (isConnecting) {
        return "#ffb428";
      } else return "#13b8ff";
    }
  }

  function getStateText() {
    if (!!device) {
      return "Control";
    } else if (isScanning) {
      return "Scanning...";
    } else {
      if (isConnecting) {
        return "Connecting...";
      } else return "Scan";
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
            stopScan();
          }
          if (!!device) {
            await handleDisconnect(device.peripheral);
          }
          if (value.endsWith(" ")) value.slice(0, value.length - 1);
          setDeviceName(value);
        }}
        onEndEditing={() => {
          if (!deviceName) return;
          let deviceReal = deviceName;
          if (deviceReal.endsWith(" ")) {
            deviceReal = deviceReal.slice(0, deviceReal.length - 1);
            setDeviceName(deviceReal);
          }
          handleSave(deviceReal);
        }}
        // editable={!isScanning}
      />
      <Animated.View
        style={{
          backgroundColor: getBGColor(),
          transitionProperty: "backgroundColor",
          transitionDuration: "300ms",
          transitionBehavior: "allow-discrete",
          transitionTimingFunction: "ease-in-out",
        }}
        className="h-1/5 w-full justify-center items-center android:elevation-md ios:shadow-md rounded-lg"
      >
        <Pressable
          className="items-center justify-center size-full"
          onPress={async () => {
            if (!!device) {
              router.navigate({
                pathname: "./Controller"
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
