import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Battery() {
  const [batteryPercentage, setBatteryPercentage] = useState(1);

  return (
    <View style={styles.container}>
      <View style={styles.outline}>
        <View style={styles.batteryCorner}>
          <View
            style={{
              ...styles.batteryBody,
              width: `${batteryPercentage * 100}%`,
            }}
          />
        </View>
      </View>
      <View style={styles.batteryNode} />
      <Text style={styles.batteryText}>{`${batteryPercentage * 100}%`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    left: "3%",
    top: "5%",
    justifyContent: "center",
    width: 110,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute'
  },
  outline: {
    borderColor: "black",
    borderRadius: 10,
    borderWidth: 5,
    width: 110-5,
    height: 40,
    color: "blue",
    justifyContent: 'center'
  },
  batteryCorner: {
    marginHorizontal: 3,
    height: 24,
    color: "black",
  },
  batteryBody: {
    backgroundColor: "green",
    height: "100%",
    borderRadius: 4,
  },
  batteryNode: {
    width: 5,
    height: 20,
    backgroundColor: "black",
    marginLeft: 'auto',
  },
  batteryText: {
    marginLeft: 8,
    fontWeight: 700
  }
});
