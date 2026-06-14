import { Link } from "expo-router";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { MainTheme } from "@roboapps/shared";
import { useState } from "react";

export default function HomeScreen() {
  const [IPAddress, setIPAddress] = useState('192.168.4.1');

  return (
    <View style={MainTheme.container}>
      <View style={styles.ipInputContainer}>
        <TextInput value={IPAddress} onChangeText={setIPAddress} />
      </View>
      <Link href={{pathname: '/Controller', params: {ip: IPAddress}}} asChild>
        <Button title="Go to Controller" />
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  ipInputContainer: {
    
  }
})