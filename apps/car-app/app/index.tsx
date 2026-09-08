import { StyleSheet, View } from "react-native";
import DeviceSelector from "../src/components/DeviceSelector";
import "../global.css";

export default function HomeScreen() {
  return (
    <View className="flex items-center justify-center h-full">
      <DeviceSelector />
    </View>
  );
}