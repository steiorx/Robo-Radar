import React, { useRef } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Accelerator from "../components/Accelerator";
import Braker from "../components/Braker";
import Battery from "../components/Battery";
import { toBT } from "@shared/utils/Structures";
import SteeringWheel from "../components/SteeringWheel";
import SpeedCounter from "../components/SpeedCounter";
import { MoveData } from "@shared/types";

type Props = {
  handleSend: (buffer: ArrayBuffer) => Promise<void>;
  speed: number;
}

export function ControllerScreen({handleSend, speed}: Props) {
  const shouldSend = useRef<boolean>(true);
  const joystickGestureRef = useRef(null);
  const acceleratorGestureRef = useRef(null);
  const brakerGestureRef = useRef(null);
  const lastDirection = useRef<number>(0);

  /**
   *
   * @param data Data to be sent to controller
   * @param force Whether to override the timeout and send the data right away. You should only use this for passive actions like braking.
   */
  function sendToController(data: MoveData, force: boolean = false) {
    if (!shouldSend.current && !force) return;

    shouldSend.current = false;

    const buffer = toBT(data);
    handleSend(buffer);

    setTimeout(() => {
      shouldSend.current = true;
    }, 75);
  }
  
  function changeDirection (direction: number, force: boolean = false) {
    direction = Math.round(direction);
    if (lastDirection.current === direction) return;
    sendToController({
      id: 2,
      value: direction
    }, force);
    lastDirection.current = direction;
  }

  function changeAccelerateState (accelerate: number) {
    sendToController({
      id: 1,
      value: accelerate
    }, true);
  } 
  
  return (
    <View className="size-full">
      <GestureHandlerRootView className="size-full">
        {/* <Joystick
          gestureRef={joystickGestureRef}
          simultaneousHandlers={[acceleratorGestureRef, brakerGestureRef]}
          changeDirection={changeDirection}
        /> */}
        <SteeringWheel 
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
        <SpeedCounter speed={speed} />
      </GestureHandlerRootView>
    </View>
  );
}
