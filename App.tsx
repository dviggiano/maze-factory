import * as ScreenOrientation from 'expo-screen-orientation';
import { LogBox } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { UserProvider } from './src/context/UserContext';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import PlayScreen from './src/screens/PlayScreen';
import AdScreen from './src/screens/AdScreen';
import React from 'react';
import { MenuProvider } from './src/context/MenuContext';
import { MazeProvider } from './src/context/MazeContext';

ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <UserProvider>
            <MenuProvider>
                <MazeProvider>
                    <NavigationContainer>
                        <Stack.Navigator>
                            <Stack.Screen
                                name='Log In'
                                component={ AuthScreen }
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name='Home'
                                component={ HomeScreen }
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name='Play'
                                component={ PlayScreen }
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name='Ad'
                                component={ AdScreen }
                                options={{ headerShown: false }}
                            />
                        </Stack.Navigator>
                    </NavigationContainer>
                </MazeProvider>
            </MenuProvider>
        </UserProvider>
    );
}
