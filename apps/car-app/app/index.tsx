import { Link } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";
import { MainTheme } from "@roboapps/shared";

export default function HomeScreen() {
  return (
    <View style={MainTheme.container}>
      <Text>{"Hello"}</Text>
      <Link href="/Controller" asChild>
        <Button title="Go to Controller" />
      </Link>
    </View>
  );
}
