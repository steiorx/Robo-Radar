import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native";
import {
  GestureDetector,
  GestureStateManager,
  usePanGesture,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const JOYSTICK_SIZE = 150;
const KNOB_SIZE = 60;
const CENTER_OFFSET = JOYSTICK_SIZE / 2;

type JoystickProps = {
  gestureRef?: React.Ref<any>;
  simultaneousHandlers?: React.Ref<any> | React.Ref<any>[];
  changeDirection: (moveX: number, moveY: number, force?: boolean) => void;
};

export function Joystick({ changeDirection }: JoystickProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  function sendDirection(dirX: number, dirY: number, force: boolean = false) {
    changeDirection(dirX, dirY, force);
  }

  const joystickGesture = usePanGesture({
    manualActivation: true,
    onTouchesMove: (event) => {
      "use worklet";
      if (event.numberOfTouches === 1) {
        GestureStateManager.activate(event.handlerTag);
      } else {
        GestureStateManager.fail(event.handlerTag);
      }
    },

    onUpdate: (event) => {
      "use worklet";
      const distance = Math.sqrt(
        Number(event.translationX) ** 2 + Number(event.translationY) ** 2,
      );
      let sizeOffset = CENTER_OFFSET / distance;
      if (sizeOffset > 1) sizeOffset = 1;
      const newTranslateX = event.translationX * sizeOffset;
      const newTranslateY = event.translationY * sizeOffset;
      translateX.set(newTranslateX);
      translateY.set(newTranslateY);
      scheduleOnRN(sendDirection, newTranslateX / CENTER_OFFSET, newTranslateY / CENTER_OFFSET);
    },

    onTouchesUp: (event) => {
      translateX.set(withSpring(0));
      translateY.set(withSpring(0));
      scheduleOnRN(sendDirection, 0, 0, true);
    },
  });

  return (
    <View style={styles.container} className="justify-center items-center absolute">
      <GestureDetector gesture={joystickGesture}>
        <Animated.View style={[styles.knob, animatedStyle]} />
      </GestureDetector>
      {/* <PanGestureHandler
        ref={gestureRef}
        simultaneousHandlers={simultaneousHandlers}
        maxPointers={1}
        onGestureEvent={({ nativeEvent }) => {
          const distance = Math.sqrt(
            Number(nativeEvent.translationX) ** 2 +
              Number(nativeEvent.translationY) ** 2,
          );
          let sizeOffset = CENTER_OFFSET / distance;
          if (sizeOffset > 1) sizeOffset = 1;
          const newTranslateX = nativeEvent.translationX * sizeOffset;
          const newTranslateY = nativeEvent.translationY * sizeOffset;
          translateX.setValue(newTranslateX);
          translateY.setValue(newTranslateY);
          changeDirection(newTranslateX / distance, newTranslateY / distance);
        }}
        onHandlerStateChange={({ nativeEvent }) => {
          changeDirection(0, 0);
          if (nativeEvent.state === 5) {
            Animated.parallel([
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
              }),
              Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
              }),
            ]).start();
          }
        }}
      >
        <Animated.View
          style={[styles.knob, { transform: [{ translateX }, { translateY }] }]}
        />
      </PanGestureHandler> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
    borderRadius: JOYSTICK_SIZE / 2,
    backgroundColor: "#ddd",
    left: "8%",
    bottom: "8%",
    position: 'absolute'
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: "#333",
  },
});
