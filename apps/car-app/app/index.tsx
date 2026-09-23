import { StyleSheet, View } from "react-native";
import DeviceSelector from "../src/components/DeviceSelector";
import "../global.css";
import { Link } from "expo-router";

export default function HomeScreen() {
  return (
    <View className="flex items-center justify-center h-full">
      <DeviceSelector />
      {/* Enable for debug: */}
      {/* <Link href={"./Controller"}>Link</Link> */}
    </View>
  );
}