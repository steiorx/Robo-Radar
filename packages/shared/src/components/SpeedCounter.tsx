import { StyleSheet, Text, View } from "react-native";

type Props = {
  speed: number;
}

export default function SpeedCounter({speed}: Props) {
  return (
    <View style={styles.container}>
      <Text className="text-6xl text-green-500 font-semibold" style={{
        color: speed >= 0 ? 'green' : 'red'
      }}>{speed}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '5%',
    right: '10%'
  },
})