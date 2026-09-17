import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import "../global.css";

export default function RootLayout() {
  return (
    <React.Fragment>
      <StatusBar style="inverted" />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerTitle: "Car Controller",
            headerTitleAlign: "center",
            orientation: "portrait"
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
    </React.Fragment>
  );
}
