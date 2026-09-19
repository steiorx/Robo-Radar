import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Fragment } from "react";
import "../global.css";

export default function RootLayout() {
  return (
    <Fragment>
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
    </Fragment>
  );
}
