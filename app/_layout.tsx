import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';
import { ThemeProvider } from "./components/ThemeContext";
import { toastConfig } from './toastConfig';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Slot />
        <Toast 
          config={toastConfig}
          onPress={() => Toast.hide()}
        />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}