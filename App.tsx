import { LogBox } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import PlayScreen from './screens/PlayScreen';

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
            </Stack.Navigator>
          </NavigationContainer>
      );
}
