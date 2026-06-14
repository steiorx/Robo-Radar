import { Platform, PermissionsAndroid } from "react-native";
import BleManager from "react-native-ble-manager";

export class BluetoothManager {
    isScanning = false;
    peripherals = new Map();
    connectedPeripheral = null;

    discoveredDevice = '';
    discoveredCharacteristic = '';

    setup() {
        BleManager.start({
            showAlert: false
        });

        // if (Platform.OS == 'android' && Platform.Version >= 23) {
        //     PermissionsAndroid.requestMultiple([
        //         PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        //         PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        //     ]);
        // }
    }

    addDiscoverListener(handleDiscoverPeripheral: (event: any) => void) {
        return BleManager.onDiscoverPeripheral(handleDiscoverPeripheral);
    }

    addStopScanListener(handleStopScan: () => void) {
        return BleManager.onStopScan(handleStopScan);
    }

    addUpdateListener(handleUpdate: (data: any) => void) {
        return BleManager.onStopScan(handleUpdate);
    }

    startScan() {
        if (!this.isScanning) {
            this.peripherals = new Map();
            BleManager.scan({
                seconds: 5
            })
            .then(() => this.isScanning = true)
            .catch((err) => console.error(err));
        }
    }
}