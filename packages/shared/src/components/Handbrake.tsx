import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  breakCar: () => void;
};

export default function Handbrake({ breakCar }: Props) {
  return (
    <Pressable
      style={styles.container}
      onPress={breakCar}
      hitSlop={30}
      className="p-6 bg-orange-300 rounded-md shadow-xl shadow-orange-500"
    >
      <Text>BRAKE</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    left: "35%",
    bottom: "15%",
    // borderRadius: 16,
    position: "absolute",
  },
});
