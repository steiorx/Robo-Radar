// components/Joystick.tsx
import React, { useRef } from "react";
import { View, Animated } from "react-native";
import { StyleSheet } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";

const JOYSTICK_SIZE = 150;
const KNOB_SIZE = 60;
const CENTER_OFFSET = JOYSTICK_SIZE / 2;

type JoystickProps = {
  gestureRef?: React.Ref<any>;
  simultaneousHandlers?: React.Ref<any> | React.Ref<any>[];
  changeDirection: (moveX: number, moveY: number) => void;
};

export function Joystick({ gestureRef, simultaneousHandlers, changeDirection }: JoystickProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  return (
    <View style={styles.container}>
      <PanGestureHandler
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
          if (nativeEvent.state === 5 /* END */) {
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
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
    borderRadius: JOYSTICK_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ddd",
    marginTop: "auto",
    left: "8%",
    bottom: "8%",
    position: "absolute",
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: "#333",
  },
});
