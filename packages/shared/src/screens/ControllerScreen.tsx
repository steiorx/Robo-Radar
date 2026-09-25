import React, { useRef } from "react";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Accelerator from "../components/Accelerator";
import Braker from "../components/Braker";
import Battery from "../components/Battery";
import SteeringWheel from "../components/SteeringWheel";
import SpeedCounter from "../components/SpeedCounter";
import { MoveData } from "@shared/types";

type Props = {
  sendToController: (data: MoveData, force: boolean) => void;
  speed: number;
  isOverridden?: boolean;
};

export function ControllerScreen({ sendToController, speed, isOverridden }: Props) {
  const joystickGestureRef = useRef(null);
  const acceleratorGestureRef = useRef(null);
  const brakerGestureRef = useRef(null);
  const lastDirection = useRef<number>(0);

  function changeDirection(direction: number, force: boolean = false) {
    direction = Math.round(direction);
    if (lastDirection.current === direction) return;
    sendToController(
      {
        id: 2,
        value: direction,
      },
      force,
    );
    lastDirection.current = direction;
  }

  function changeAccelerateState(accelerate: number) {
    sendToController(
      {
        id: 1,
        value: accelerate,
      },
      true,
    );
  }

  return (
    <View className="size-full">
      <GestureHandlerRootView className="size-full">
        <SteeringWheel changeDirection={changeDirection} />
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
        <SpeedCounter speed={speed} />
        {isOverridden ? <OverriddenMessage /> : null}
      </GestureHandlerRootView>
    </View>
  );
}

function OverriddenMessage() {
  return (
    <View className="size-full absolute bg-slate-600/80 backdrop-blur-lg">
      <View className="bg-red-900 h-2/3 w-2/3 m-auto items-center justify-center rounded-xl">
        <Text className="text-red-500 text-5xl font-bold">
          CONTROL OVERRIDE
        </Text>
        <Text className="text-white text-4xl">
          You have been detected by a radar
        </Text>
      </View>
    </View>
  );
}
