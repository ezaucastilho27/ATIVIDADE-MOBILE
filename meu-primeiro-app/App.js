import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Importação das telas
import HomeScreen from './screens/HomeScreen';
import DetailsScreen from './screens/DetailsScreen';
import FavoritesScreen from './screens/FavoritesScreen';

// Criação dos navegadores
const StackNav = createStackNavigator();
const TabNav = createBottomTabNavigator();

// Tema customizado
const customTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1e90ff',
  },
};

// Configuração dos ícones das abas
const getTabBarIcon = (routeName, { color, size }) => {
  const icons = {
    'Início': 'sports-soccer',
    'Favoritos': 'favorite'
  };
  
  return (
    <Icon 
      name={icons[routeName] || 'home'} 
      size={size} 
      color={color} 
    />
  );
};

// Navegador de abas
const MainTabNavigator = () => {
  return (
    <TabNav.Navigator
      initialRouteName="Início"
      screenOptions={({ route }) => ({
        tabBarIcon: (props) => getTabBarIcon(route.name, props),
        tabBarActiveTintColor: '#1e90ff',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingVertical: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        }
      })}
    >
      <TabNav.Screen 
        name="Início" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início'
        }}
      />
      <TabNav.Screen 
        name="Favoritos" 
        component={FavoritesScreen}
        options={{
          tabBarLabel: 'Favoritos'
        }}
      />
    </TabNav.Navigator>
  );
};

// Componente principal da aplicação
const App = () => {
  return (
    <PaperProvider theme={customTheme}>
      <NavigationContainer>
        <StackNav.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1e90ff',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <StackNav.Screen
            name="MainTabs"
            component={MainTabNavigator}
            options={{ 
              headerShown: false 
            }}
          />
          <StackNav.Screen
            name="Details"
            component={DetailsScreen}
            options={({ route }) => ({
              title: route.params?.matchTitle || 'Detalhes',
              headerBackTitleVisible: false,
            })}
          />
        </StackNav.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App;