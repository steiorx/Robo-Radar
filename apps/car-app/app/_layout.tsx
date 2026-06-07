import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

export default function Layout()
{
    return (
        <React.Fragment>
            <StatusBar style="auto" />
            <Stack>
                <Stack.Screen name="index" />
                <Stack.Screen name="Controller" 
                options={{orientation: "landscape", headerShown: false, statusBarHidden: true}} />
            </Stack>
        </React.Fragment>
    )
}