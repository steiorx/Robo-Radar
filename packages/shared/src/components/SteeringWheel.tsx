import { View, StyleSheet } from "react-native";
import {
  GestureDetector,
  GestureStateManager,
  usePanGesture,
  useRotationGesture,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  measure,
  useAnimatedRef,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import SteeringWheelSvg from "../assets/icons/steering-wheel.svg";

type SteeringWheelProps = {
  changeDirection: (direction: number, force?: boolean) => void;
};

export default function SteeringWheel({ changeDirection }: SteeringWheelProps) {
  const rotation = useSharedValue(0);
  const lastRotation = useSharedValue(0);
  const animatedRef = useAnimatedRef<View>();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${(rotation.value / Math.PI) * 180}deg` }],
    };
  });

  function getRelativePosition(absoluteX: number, absoluteY: number) {
    "worklet";

    const m = measure(animatedRef);

    if (!m) return [0, 0];

    const centerX = m.pageX + m.width / 2;
    const centerY = m.pageY + m.height / 2;

    return [absoluteX - centerX, absoluteY - centerY];
  }

  const steeringGesture = usePanGesture({
    manualActivation: true,
    onTouchesDown: (event) => {
      "use worklet";
      const [relativeX, relativeY] = getRelativePosition(
        event.changedTouches[0].absoluteX,
        event.changedTouches[0].absoluteY,
      );
      lastRotation.set(Math.atan2(relativeY, relativeX));
    },
    onTouchesMove: (event) => {
      "use worklet";
      if (event.numberOfTouches === 1) {
        GestureStateManager.activate(event.handlerTag);
      } else GestureStateManager.fail(event.handlerTag);
    },
    onUpdate: (event) => {
      "use worklet";

      const [relativeX, relativeY] = getRelativePosition(
        event.absoluteX,
        event.absoluteY,
      );

      const angle = Math.atan2(relativeY, relativeX);

      let delta = angle - lastRotation.value;

      if (delta > Math.PI) delta -= 2 * Math.PI;
      else if (delta < -Math.PI) delta += 2 * Math.PI;

      let newRotation = rotation.value + delta;

      if (newRotation > Math.PI) newRotation = Math.PI;
      else if (newRotation < -Math.PI) newRotation = -Math.PI;

      rotation.value = newRotation;

      lastRotation.value = angle;

      scheduleOnRN(changeDirection, (newRotation / Math.PI) * 180);
    },
    onTouchesUp: (event) => {
      "use worklet";
      rotation.set(withSpring(0));
      scheduleOnRN(changeDirection, 0, true);
    },
  });

  const steeringGesturex = useRotationGesture({
    manualActivation: true,
    onTouchesMove: (event) => {
      "use worklet";
      if (event.numberOfTouches <= 2) {
        GestureStateManager.activate(event.handlerTag);
      } else {
        GestureStateManager.fail(event.handlerTag);
      }
    },
    onUpdate: (event) => {
      "use worklet";
      let newRotation = rotation.value + event.rotationChange;

      if (newRotation > Math.PI) newRotation = Math.PI;
      else if (newRotation < -Math.PI) newRotation = -Math.PI;

      rotation.value = newRotation;

      scheduleOnRN(changeDirection, (newRotation / Math.PI) * 180);
    },
    onTouchesUp: (event) => {
      "use worklet";
      console.log("Fingers up");
      rotation.set(withSpring(0));
      scheduleOnRN(changeDirection, 0, true);
    },
  });

  return (
    <View style={styles.container}>
      <View ref={animatedRef}>
        <GestureDetector gesture={steeringGesture}>
          <Animated.View style={[animatedStyle]}>
            <SteeringWheelSvg width={200} height={200} />
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // width: 'auto',
    // height: 200,
    left: "8%",
    bottom: "8%",
    position: "absolute",
  },
});
