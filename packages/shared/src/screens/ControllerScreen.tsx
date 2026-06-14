import React, { createRef, useRef } from "react";
import { View, Text, Button } from "react-native";
import { MainTheme } from "../utils/themes";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Joystick } from "../components/Joystick";
import { StyleSheet } from "react-native";
import Accelerator from "../components/Accelerator";
import Braker from "../components/Braker";
import Battery from "../components/Battery";
import { MoveData } from "@shared/utils/Structures";

type Props = {
  sendToController: (data: string, force: boolean) => void;
  connected: boolean;
}

export function ControllerScreen({sendToController, connected}: Props) {
  const joystickGestureRef = useRef(null);
  const acceleratorGestureRef = useRef(null);
  const brakerGestureRef = useRef(null);
  const moveData = useRef<MoveData>({
    moveX: 0.0,
    moveY: 0.0,
    accelerate: 0
  });

  function sendMoveData(force: boolean) {
    sendToController(JSON.stringify({
      route: "move",
      ...moveData.current
    }), force);
  }

  function changeDirection (moveX: number, moveY: number) {
    moveData.current.moveX = moveX;
    moveData.current.moveY = moveY;
    sendMoveData(false);
  }

  function changeAccelerateState (accelerate: number) {
    moveData.current.accelerate = accelerate;
    sendMoveData(true);
  } 
  
  return (
    <View style={{...styles.container, backgroundColor: connected ? 'blue': 'pink'}}>
      <GestureHandlerRootView style={styles.container}>
        <Joystick
          gestureRef={joystickGestureRef}
          simultaneousHandlers={[acceleratorGestureRef, brakerGestureRef]}
          changeDirection={changeDirection}
        />
        <Accelerator
          gestureRef={acceleratorGestureRef}
          simultaneousHandlers={[joystickGestureRef, brakerGestureRef]}
          changeAccelerateState={changeAccelerateState}
        />
        <Braker 
          gestureRef={brakerGestureRef}
          simultaneousHandlers={[joystickGestureRef, acceleratorGestureRef]}
          changeAccelerateState={changeAccelerateState}
        />
        <Battery />
      </GestureHandlerRootView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

});
