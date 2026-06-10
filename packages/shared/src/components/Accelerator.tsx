import { StyleSheet } from "react-native";
import AcceleratorSvg from "../assets/icons/accelerator.svg";
import { useState } from "react";
import StepInteractorBase from "./StepInteractorBase";

type Props = {
  gestureRef?: React.Ref<any>;
  simultaneousHandlers?: React.Ref<any> | React.Ref<any>[];
};

export default function Accelerator({
  gestureRef,
  simultaneousHandlers,
}: Props) {
  const [heightRatio, setHeightRatio] = useState(1.0);

  return (
    <StepInteractorBase
      setHeightRatio={setHeightRatio}
      gestureRef={gestureRef}
      simultaneousHandlers={simultaneousHandlers}
      style={styles.container}
    >
      <AcceleratorSvg
        style={styles.image}
        width={styles.image.width}
        height={heightRatio * styles.image.height}
        preserveAspectRatio="none"
      />
    </StepInteractorBase>
  );
}

const styles = StyleSheet.create({
  container: {
    right: "10%",
    bottom: "10%",
    borderRadius: 16,
  },
  image: {
    width: 100,
    height: 200,
  },
});
