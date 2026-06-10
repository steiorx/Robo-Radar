import React from "react";
import { View, StyleSheet, ViewStyle, Text } from "react-native";
import { LongPressGestureHandler, State } from "react-native-gesture-handler";

type Props = {
  children: React.JSX.Element;
  gestureRef?: React.Ref<any>;
  simultaneousHandlers?: React.Ref<any> | React.Ref<any>[];
  setHeightRatio: (ratio: number) => void;
  style: ViewStyle;
}

export default function StepInteractorBase(props: Props)
{
    return (
        <View style={{...styles.container, ...props.style}}>
          <LongPressGestureHandler
            ref={props.gestureRef}
            simultaneousHandlers={props.simultaneousHandlers}
            minDurationMs={0}
            maxDist={1000}
            shouldCancelWhenOutside={false}
            onHandlerStateChange={({ nativeEvent }) => {
              if (nativeEvent.state === State.ACTIVE) {
                props.setHeightRatio(0.9);
              }
              if (
                nativeEvent.state === State.END ||
                nativeEvent.state === State.CANCELLED ||
                nativeEvent.state === State.FAILED
              ) {
                props.setHeightRatio(1.0);
              }
            }}
          >
            {props.children}
          </LongPressGestureHandler>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: "auto",
    position: "absolute",
    backgroundColor: 'rgba(255, 255, 255, 0)',

    boxShadow: "2px 2px 3px rgba(0, 0, 0, 0.5)",
    flexDirection: 'column'
  }
})