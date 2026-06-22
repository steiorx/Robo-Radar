import { Link } from "expo-router";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { MainTheme } from "@roboapps/shared";
import { useState } from "react";
import DeviceSelector from "../src/components/DeviceSelector";

export default function HomeScreen() {
  return (
    <View style={MainTheme.centerContent}>
      <DeviceSelector />

    </View>
  );
}

const styles = StyleSheet.create({
  ipInputContainer: {
    
  }
})