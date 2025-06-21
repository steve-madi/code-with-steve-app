import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ExploreScreen from './explore'; 
import LoginScreen from './login';
import HomeScreen from './home';
import UploadScreen from './upload';
import VideoPlayer from './videoplayer';
import LandingScreen from './landing';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="landing"
    screenOptions={{
      headerStyle: { backgroundColor: 'orange' }, // Change header background color
      headerTintColor: '#fff', // Change text and icon color
      headerTitleStyle: { fontWeight: 'bold' }, // Customize title style
    }}>

<Stack.Screen name="login" component={LoginScreen}  options={{ headerShown: false }}  />
      <Stack.Screen name="home" component={HomeScreen}  options={{ headerShown: false }} />
      <Stack.Screen name="explore" component={ExploreScreen}  options={{ headerShown: false }}  />
      <Stack.Screen name="upload" component={UploadScreen} options={{ headerShown: false }} />
      <Stack.Screen name="videoplayer" component={VideoPlayer} options={{ headerShown: false }} />
      <Stack.Screen name="landing" component={LandingScreen} options={{ headerShown: false }} />


</Stack.Navigator>
  );
};

export default AppNavigator;