import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import DiscoverScreens from './DiscoverScreens';
import EventsScreen from './EventsScreen';
import Profilepage from './Profilepage';
import { createTheme, RFValue, RW, RH } from '../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

interface HomeProps {
  route?: {
    params?: {
      screen?: string;
      articleId?: string;
    };
  };
}

const Home = ({ route }: HomeProps) => {
  const [activeTab, setActiveTab] = useState(route?.params?.screen || 'Discover');
  const [articleId, setArticleId] = useState(route?.params?.articleId || null);

  const isDarkMode = useSelector((state: any) => state.theme.isDarkMode);
  const theme = createTheme(isDarkMode);
  const insets = useSafeAreaInsets();

  // Update state if route params change
  useEffect(() => {
    if (route?.params?.screen) setActiveTab(route.params.screen);
    if (route?.params?.articleId) setArticleId(route.params.articleId);
  }, [route?.params]);

  useFocusEffect(
    React.useCallback(() => {
      if (route?.params?.screen) setActiveTab(route.params.screen);
    }, [route?.params?.screen])
  );

  const renderTabIcon = (tabName: string, isActive: boolean) => {
    let iconName = '';
    switch (tabName) {
      case 'Discover':
        iconName = isActive ? 'compass' : 'compass-outline';
        break;
      case 'EventScreen':
        iconName = isActive ? 'calendar' : 'calendar-outline';
        break;
      case 'ProfilePage':
        iconName = isActive ? 'person' : 'person-outline';
        break;
    }
    return (
      <Ionicons
        name={iconName}
        size={RFValue(isTablet ? 28 : 24)}
        color={isActive ? theme.primary : theme.textSecondary}
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Main Content */}
      <View style={styles.content}>
        {/* ✅ Keep screens mounted and just toggle visibility */}
        <View style={{ flex: 1, display: activeTab === 'Discover' ? 'flex' : 'none' }}>
          <DiscoverScreens articleId={articleId} />
        </View>
        <View style={{ flex: 1, display: activeTab === 'EventScreen' ? 'flex' : 'none' }}>
          <EventsScreen />
        </View>
        <View style={{ flex: 1, display: activeTab === 'ProfilePage' ? 'flex' : 'none' }}>
          <Profilepage />
        </View>
      </View>

      {/* Bottom Navigation */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
            paddingBottom: insets.bottom, // keeps nav visible above gesture/nav bar
            height: RH(isTablet ? 80 : 60) + insets.bottom,
          },
        ]}
      >
        {/* Discover Tab */}
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Discover' && styles.activeTabButton ,]}
          onPress={() => {
            setActiveTab('Discover');
            setArticleId(null);
          }}
        >
          {renderTabIcon('Discover', activeTab === 'Discover')}
          {activeTab === 'Discover' && (
            <Text style={[styles.tabLabel, { color:isDarkMode ?"white"  :theme.primary}]}>Discover</Text>
          )}
        </TouchableOpacity>

        {/* Events Tab */}
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'EventScreen' && styles.activeTabButton]}
          onPress={() => {
            setActiveTab('EventScreen');
            setArticleId(null);
          }}
        >
          {renderTabIcon('EventScreen', activeTab === 'EventScreen')}
          {activeTab === 'EventScreen' && (
            <Text style={[styles.tabLabel, { color:isDarkMode ?"white"  :theme.primary}]}>Events</Text>
          )}
        </TouchableOpacity>

        {/* Profile Tab */}
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'ProfilePage' && styles.activeTabButton]}
          onPress={() => {
            setActiveTab('ProfilePage');
            setArticleId(null);
          }}
        >
          {renderTabIcon('ProfilePage', activeTab === 'ProfilePage')}
          {activeTab === 'ProfilePage' && (
            <Text style={[styles.tabLabel, { color:isDarkMode ?"white"  :theme.primary}]}>Profile</Text>
          )}
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RH(isTablet ? 12 : 8),
    paddingHorizontal: RW(isTablet ? 20 : 16),
    borderRadius: RFValue(isTablet ? 24 : 20),
    minWidth: RW(isTablet ? 80 : 60),
    minHeight: RH(isTablet ? 50 : 40),
    gap: RW(isTablet ? 8 : 5),
    backgroundColor: 'rgba(0, 104, 255, 0.1)',
  },
  activeTabButton: {
    backgroundColor: 'rgba(0, 104, 255, 0.2)',
  },
  tabLabel: {
    fontSize: RFValue(isTablet ? 14 : 12),
       fontFamily:"Lato-Regular",
    fontWeight:"400"
  },
  gestureHandle: {
  },
});
