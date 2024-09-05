
import {Stack} from 'expo-router';
import { GlobalProvider } from './globalContext';

export default function RootLayout() {
    return (
        <GlobalProvider>
        <Stack>
            <Stack.Screen name = "index" options={{
                headerTitle: "到手退休金"
            }} />
            <Stack.Screen name = "citySelector" options={{
                headerTitle: "选择城市"
            }} />
        </Stack>
        </GlobalProvider>
    );
}