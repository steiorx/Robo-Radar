import React from "react";
import { View, Text, Button } from "react-native";
import { MainTheme } from "../utils/themes";

export function ControllerScreen()
{
    return (
        <View>
            <Text style={MainTheme.text}>{"Hello"}</Text>
        </View>
    )
}