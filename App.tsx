import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import PlayScreen from './screens/PlayScreen';
import BuildScreen from './screens/BuildScreen';
import AuthScreen from './screens/AuthScreen';
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);

const Stack = createNativeStackNavigator();

export default function App() {
      return (
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen
                  name='Auth'
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
                  name='Build'
                  component={ BuildScreen }
                  options={{ headerShown: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
      );
}
