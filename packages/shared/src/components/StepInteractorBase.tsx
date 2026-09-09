import React from "react";
import { View, ViewStyle } from "react-native";
import { LongPressGestureHandler, State } from "react-native-gesture-handler";

type Props = {
  children: React.JSX.Element;
  gestureRef?: React.Ref<any>;
  simultaneousHandlers?: React.Ref<any> | React.Ref<any>[];
  onPressBegin: () => void;
  onPressEnd: () => void;
  setHeightRatio: (ratio: number) => void;
  style: ViewStyle;
  className?: string;
};

export default function StepInteractorBase(props: Props) {
  return (
    <View
      style={{ ...props.style, boxShadow: '2px 2px 3px 3px' }}
      className={`${props.className} ml-auto absolute bg-transparent flex-col`}
    >
      <LongPressGestureHandler
        ref={props.gestureRef}
        simultaneousHandlers={props.simultaneousHandlers}
        minDurationMs={0}
        maxDist={1000}
        shouldCancelWhenOutside={false}
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.ACTIVE) {
            props.setHeightRatio(0.9);
            props.onPressBegin();
          }
          if (
            nativeEvent.state === State.END ||
            nativeEvent.state === State.CANCELLED ||
            nativeEvent.state === State.FAILED
          ) {
            props.setHeightRatio(1.0);
            props.onPressEnd();
          }
        }}
      >
        {props.children}
      </LongPressGestureHandler>
    </View>
  );
}