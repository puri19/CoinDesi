import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import {createTheme, RFValue, RW, RH } from '../utils/theme';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const InAppBrowser = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { url } = route.params;
  const isDarkMode = useSelector((state: any) => state.theme.isDarkMode);
    const theme = createTheme(isDarkMode);
    const insets = useSafeAreaInsets(); // ✅ safe area insets

  const getDomain = (url) => {
    try {
      let hostname = new URL(url).hostname; // e.g. "www.example.com"
      if (hostname.startsWith("www.")) {
        hostname = hostname.replace("www.", ""); // remove "www."
      }
      return hostname; // e.g. "example.com"
    } catch (e) {
      return url; // fallback if url is invalid
    }
  };
  

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header,{              backgroundColor: theme.card,
              borderBottomColor: theme.border,
              borderTopColor: theme.border,
              marginTop:insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialCommunityIcons
              name="chevron-left"
              size={ 28}
              color={theme.text}
            />
        </TouchableOpacity>
        <Text numberOfLines={1} style={[styles.title,{color: theme.text}]}>
  {getDomain(url)}
</Text>

      </View>
      <WebView source={{ uri: url }} style={styles.webview} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: RH(13),
    borderBottomWidth: 1,
    borderTopWidth: 1,
  },
  backButton: {
    justifyContent:"center",
    alignItems:"center",
    marginTop:RH(5),
    padding: RW(0),
    marginRight: RW(1),
  },
  title: {
    flex: 1,
    fontSize: RFValue(24),
    color: '#000',
  },
  webview: {
    flex: 1,
  },
});

export default InAppBrowser;
