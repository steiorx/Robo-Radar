import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { ControllerScreen, MainTheme } from "@roboapps/shared";
import { useColorScheme } from "react-native";

export default function App() {
  const theme = useColorScheme();
  return (
    <View style={styles.container}>
      <Text style={MainTheme.text}>Open up App.tsx to start working on your app!</Text>
      <ControllerScreen />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  }
});
