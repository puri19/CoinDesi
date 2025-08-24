import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import store from './src/redux/store/store';
import Navigation from './src/navigation/Navigation';
import { requestUserPermission, getFcmToken, notificationListener } from './src/services/firebase';
import { createTheme } from './src/utils/theme';
import { NetworkProvider } from './src/contexts/NetworkContext';
import { getFromStorage } from './src/Asyc/storage';
import { uploadUserinfo, UpdateSkip, UpdateisLoggedin, UpdateonboardingDone } from "./src/redux/action/action"
import { flushPendingNavigation, navigationRef } from './src/navigation/NavigationService';  // ✅ import global ref
import { setTheme } from './src/redux/action/themeActions';

const AppContent = () => {
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);
  const theme = createTheme(isDarkMode);
  const dispatch = useDispatch();
  const [rehydrated, setRehydrated] = useState(false);

  useEffect(() => {
    const loadPersistedState = async () => {
      const savedUser = await getFromStorage("userinfo");
      const savedSkip = await getFromStorage("skip");
      const savedLogin = await getFromStorage("isLoggedin");
      const savedOnboardingDone = await getFromStorage("onboardingDone");
      const savedTheme = await getFromStorage("isDarkMode");
  
      if (savedUser) dispatch(uploadUserinfo(savedUser));
      if (savedSkip !== null) dispatch(UpdateSkip(savedSkip));
      if (savedLogin !== null) dispatch(UpdateisLoggedin(savedLogin));
      if (savedOnboardingDone !== null) dispatch(UpdateonboardingDone(savedOnboardingDone));
      if (savedTheme !== null) dispatch(setTheme(savedTheme));
  
      setRehydrated(true); // ✅ now your app knows Redux is hydrated
    };
  
    loadPersistedState();
  }, [dispatch]);
  
  useEffect(() => {
    if (rehydrated) {
      requestUserPermission();
      getFcmToken();
      const unsubscribe = notificationListener(); // ✅ no need to pass navigation
      return () => unsubscribe();
    }
  }, [rehydrated]);

  if (!rehydrated) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={[styles.container, { backgroundColor: theme.background }]}>
        <NavigationContainer ref={navigationRef}
        onReady={() => {
          flushPendingNavigation();   // ✅ handle notifications fired before app was ready
        }}>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={theme.background}
          />
          <Navigation />
        </NavigationContainer>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <NetworkProvider>
        <AppContent />
      </NetworkProvider>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default App;
