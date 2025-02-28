import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';


// Importowanie rzeczywistych ekranów
import { RootStackParamList } from './types';
import HomeScreen from './Home';
import Login from './Login';
import Register from './Register';
import MainScreen from './MainScreen';
import Events from './Events';
import EventDetailsScreen from './EventDetailsScreen';
import MapScreen from './MapScreen';


const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
      <Stack.Screen name="MainScreen" component={MainScreen} options={{ title: 'eventY' }} />
        <Stack.Screen name="Register" component={Register} options={{ title: 'Rejestracja' }} />
        <Stack.Screen name="Login" component={Login} options={{ title: 'Logowanie' }} />   
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Strona główna' }} />  
        <Stack.Screen name="Events" component={Events} options={{ title: 'Wydarzenia' }} />   
        <Stack.Screen name="EventDetails" component={EventDetailsScreen} options={{ title: 'Wydarzenia' }}/>        
        <Stack.Screen name="MapScreen" component={MapScreen} options={{ title: 'Mapy'}}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
