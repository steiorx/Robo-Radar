import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Fragment } from "react";
import "../global.css";
import { BluetoothProvider } from "../src/components/bluetooth-context";

export default function RootLayout() {
  return (
    <BluetoothProvider>
      <StatusBar style="inverted" />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerTitle: "Radar",
            headerTitleAlign: "center",
            orientation: "portrait",
          }}
        />
        <Stack.Screen
          name="Controller"
          options={{
            orientation: "landscape",
            headerShown: false,
            statusBarHidden: true,
          }}
        />
      </Stack>
    </BluetoothProvider>
  );
}
