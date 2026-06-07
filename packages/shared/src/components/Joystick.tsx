// components/Joystick.tsx
import React, { useRef } from "react";
import { View, Animated } from "react-native";
import { StyleSheet } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";

const JOYSTICK_SIZE = 150;
const KNOB_SIZE = 60;
const CENTER_OFFSET = JOYSTICK_SIZE / 2;

export function Joystick() {
  //   const [position] = useState(() => new Animated.ValueXY({ x: 0, y: 0 }));
  //   const touchID = useRef("");
  //   let startX: number, startY: number;

  //   const panResponder = React.useRef(
  //     PanResponder.create({
  //       onStartShouldSetPanResponder: (evt, gestureState) => gestureState.numberActiveTouches == 1,
  //       onMoveShouldSetPanResponder: (evt, gestureState) => gestureState.numberActiveTouches == 1,
  //       onPanResponderGrant: (evt, gestureState) => {
  //         touchID.current = evt.nativeEvent.identifier;

  //         const { locationX, locationY } = evt.nativeEvent;
  //         startX = locationX - CENTER_OFFSET;
  //         startY = locationY - CENTER_OFFSET;

  //         position.setOffset({ x: startX, y: startY });
  //         position.setValue({ x: 0, y: 0 });
  //       },
  //       onPanResponderMove: (evt, gestureState) => {
  //         if (gestureState.numberActiveTouches > 1) return;
  //         if (touchID.current != evt.nativeEvent.identifier) return;

  //         const { dx, dy } = gestureState;
  //         let newX = dx,
  //           newY = dy;
  //         const distance = Math.sqrt((newX + startX) ** 2 + (newY + startY) ** 2);
  //         if (distance > CENTER_OFFSET) {
  //           const sizeOffset = CENTER_OFFSET / distance;
  //           newX = (newX + startX) * sizeOffset - startX;
  //           newY = (newY + startY) * sizeOffset - startY;
  //         }
  //         position.setValue({ x: newX, y: newY });
  //       },
  //       onPanResponderRelease: (evt) => {
  //         if (touchID.current != evt.nativeEvent.identifier) return;
  //         position.flattenOffset();
  //         Animated.spring(position, {
  //           toValue: { x: 0, y: 0 },
  //           useNativeDriver: false,
  //         }).start();
  //       },
  //         onPanResponderTerminate: (evt) => {
  //         if (touchID.current != evt.nativeEvent.identifier) return;
  //           position.flattenOffset();
  //           Animated.spring(position, {
  //             toValue: { x: 0, y: 0 },
  //             useNativeDriver: false,
  //           }).start();
  //         },
  //     }),
  //   ).current;

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  return (
    <View style={styles.container}>
      <PanGestureHandler
        maxPointers={1}
        onGestureEvent={({ nativeEvent }) => {
            console.log(translateX, translateY, nativeEvent.translationX, nativeEvent.translationY)
          const distance = Math.sqrt(Number(nativeEvent.translationX) ** 2 + Number(nativeEvent.translationY) ** 2);
          let sizeOffset = CENTER_OFFSET / distance;
          if (sizeOffset > 1) sizeOffset = 1;
          translateX.setValue(nativeEvent.translationX * sizeOffset);
          translateY.setValue(nativeEvent.translationY * sizeOffset);
        }}
        onHandlerStateChange={({ nativeEvent }) => {
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
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: "#333",
  },
});
