import { Text, View } from "react-native";
import { ControllerScreen, MainTheme } from "@roboapps/shared";
import { useLocalSearchParams } from "expo-router";
import { useRef, useEffect } from "react";
import UdpSockets from "react-native-udp";
import UdpSocket from "react-native-udp/lib/types/UdpSocket";

export default function Controller() {
  const { ip } = useLocalSearchParams<{ip: string}>();
  const udpSocket = useRef<UdpSocket>(null);
  const shouldSend = useRef<boolean>(true);

  const onMessage = (msg: any, rinfo: {address: string, port: number, family: string}) => {
    console.log('Message received');
  }

  const onError = (err: Error) => {
    console.error('Socket error')
  }

  useEffect(() => {
    if (UdpSockets) {
      udpSocket.current = UdpSockets.createSocket({
        type: 'udp4',
        debug: true
      });

      udpSocket.current.bind(1234);
      udpSocket.current.on('message', onMessage);
      udpSocket.current.once('listening', () => console.log("Listening on ", udpSocket.current?.address()));
      udpSocket.current.on('error', onError);

      return () => {
        udpSocket.current?.off('message', onMessage);
        udpSocket.current?.off('error', onError);
        udpSocket.current?.close();
      }
    }
  }, []);

  function sendToController(data: string, force: boolean)
  {
    if (force || shouldSend.current)
    {
      if (udpSocket.current && ip) udpSocket.current.send(data, 0, data.length, 1234, ip);
    }
    else return;
    if (force) return;

    shouldSend.current = false;

    setTimeout(() => {
      shouldSend.current = true;
    }, 100);
  }

  return (
    <ControllerScreen sendToController={sendToController} />
  )
}
