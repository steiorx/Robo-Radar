import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  breakCar: () => void;
}

export default function Handbrake({breakCar}: Props) {
  return (
    <View style={styles.container} className="bg-orange-300 p-5 rounded-md shadow-xl shadow-orange-500">
      <Pressable
        onPress={breakCar}
        className="size-full"
      >
        <Text>
          BRAKE
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    left: "40%",
    bottom: "15%",
    // borderRadius: 16,
    position: 'absolute'
  },
});