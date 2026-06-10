import React, { useRef } from "react";
import { View, Text, Button } from "react-native";
import { MainTheme } from "../utils/themes";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Joystick } from "../components/Joystick";
import { StyleSheet } from "react-native";
import Accelerator from "../components/Accelerator";
import Braker from "../components/Braker";

export function ControllerScreen() {
  const joystickGestureRef = useRef(null);
  const acceleratorGestureRef = useRef(null);
  const brakerGestureRef = useRef(null);

  return (
    <View style={styles.container}>
      <GestureHandlerRootView style={styles.container}>
        <Joystick
          gestureRef={joystickGestureRef}
          simultaneousHandlers={[acceleratorGestureRef, brakerGestureRef]}
        />
        <Accelerator
          gestureRef={acceleratorGestureRef}
          simultaneousHandlers={[joystickGestureRef, brakerGestureRef]}
        />
        <Braker 
          gestureRef={brakerGestureRef}
          simultaneousHandlers={[joystickGestureRef, acceleratorGestureRef]}
        />
      </GestureHandlerRootView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
