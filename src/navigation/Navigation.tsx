import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import SplashScreen from '../screens/SplashScreen';
import Onboarding from '../screens/Onboarding';
import Login from '../auth/Login';
import Signup from '../auth/Signup';
import OtpVerification from '../auth/OtpVerification';
import Home from '../screens/Home';
import Liked from '../screens/Liked';
import History from '../screens/History';
import Events from '../screens/Events';
import EventsScreen from '../screens/EventsScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import DashBoard from '../screens/DashBoard';
import DiscoverScreens from '../screens/DiscoverScreens';
import { useSelector } from 'react-redux';
import InAppBrowser from '../screens/InAppBrowser';

const Navigation = () => {
  const Stack = createNativeStackNavigator();
  const isLoggedin = useSelector((state: any) => state.user.isLoggedin);
  const onboardingDone = useSelector((state: any) => state.user.onboardingDone);
  console.log(onboardingDone)
  return (
    <Stack.Navigator >

      {!isLoggedin && (
        <>
          {!onboardingDone && (

            <>
              <Stack.Screen name="SplashScreen" component={SplashScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Onboarding" component={Onboarding} options={{ headerShown: false }} />
            </>)

          }


          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={Signup} options={{ headerShown: false }} />
          <Stack.Screen name="OtpVerification" component={OtpVerification} options={{ headerShown: false }} />
        </>
      )}
      <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
      <Stack.Screen name="Liked" component={Liked} options={{ headerShown: false }} />
      <Stack.Screen name="History" component={History} options={{ headerShown: false }} />
      <Stack.Screen name="EventScreen" component={EventsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Events" component={Events} options={{ headerShown: false }} />
      <Stack.Screen
        name="DiscoverScreens"
        component={DiscoverScreens}
        options={{
          headerShown: false,
          unmountOnBlur: false   // 👈 important
        }}
      />

      <Stack.Screen name="Browser" component={InAppBrowser} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}

export default Navigation

const styles = StyleSheet.create({})