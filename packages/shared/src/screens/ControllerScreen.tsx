import React from "react";
import { View, Text, Button } from "react-native";
import { MainTheme } from "../utils/themes";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Joystick } from "../components/Joystick";
import { StyleSheet } from "react-native";

export function ControllerScreen()
{
    return (
        <View style={styles.container}>
            <GestureHandlerRootView style={styles.container} >
                <Joystick />
            </GestureHandlerRootView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})