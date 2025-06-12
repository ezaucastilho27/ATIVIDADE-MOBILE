import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import HomeScreen from './screens/HomeScreen';
import AddBookScreen from './screens/AddLivroTela';

const Stack = createStackNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Minha Biblioteca" component={HomeScreen} />
          <Stack.Screen name="Adicionar Livro" component={AddBookScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
// teste