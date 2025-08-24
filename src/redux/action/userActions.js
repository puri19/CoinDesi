import { uploadUserinfo, setNewsList ,setLikes,setHistory,setEvents, removeFromHistory, clearAllHistory} from '../action/action';
import firestore from '@react-native-firebase/firestore';
import { Alert } from 'react-native';
import storage from '@react-native-firebase/storage';
// Temporarily removed network checking imports for testing
// import { withNetworkCheck, withRetry } from '../services/apiService';

export const saveUserInfoToFirestore = (userinfo) => async (dispatch) => {
  try {
    console.log('saveUserInfoToFirestore: Bypassing network check for testing...');
    
    // Temporarily bypass network check to test if the issue is with the network service
    dispatch(uploadUserinfo(userinfo));

    const userRef = firestore().collection('users').doc(userinfo.uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // Update only necessary fields if user already exists
      await userRef.set(
        {
          name: userinfo.name || '',
          email: userinfo.email || '',
          phone: userinfo.phone || '',
          fcmToken: userinfo.fcmToken || '',
        },
        { merge: true }
      );
    } else {
      // Create new user with createdAt
      await userRef.set({
        uid: userinfo.uid,
        name: userinfo.name || '',
        email: userinfo.email || '',
        phone: userinfo.phone || '',
        fcmToken: userinfo.fcmToken || '',
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    }
    
    console.log('saveUserInfoToFirestore: User info saved successfully');
    
  } catch (error) {
    console.error('saveUserInfoToFirestore: Error in catch block:', error);
    Alert.alert('Error', 'Failed to save user data.');
  }
};

export const fetchNewsList = () => async (dispatch, getState) => {
  console.log('fetchNewsList: Function called');
  
  try {
    console.log('fetchNewsList: Bypassing network check for testing...');
    
    // Temporarily bypass network check to test if the issue is with the network service
    const state = getState();
    const userinfo = state.user.userinfo;

    if (!userinfo || !userinfo.uid) {
      console.warn("User not logged in or missing uid");
      return;
    }

    console.log('fetchNewsList: Fetching articles from Firestore...');
    
    // Step 1: Fetch all articles
    const snapshot = await firestore().collection('crypto_articles_test_2').get();
    const allArticles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('fetchNewsList: Articles fetched, count:', allArticles.length);

    // Step 2: Get user document
    const userDoc = await firestore().collection('users').doc(userinfo.uid).get();
    const userData = userDoc.data() || {};

    const bookmarked = userData.bookmarked || [];
    const history = userData.history || [];

    // Step 3: Filter unseen articles
    const seenIds = new Set([...bookmarked, ...history]);
    const unseenArticles = allArticles.filter(article => !seenIds.has(article.id));

    console.log('fetchNewsList: Unseen articles count:', unseenArticles.length);

    // Step 2: Dispatch
    dispatch(setNewsList(unseenArticles));
    
    console.log('fetchNewsList: News list fetched successfully');
    
  } catch (error) {
    console.error("fetchNewsList: Error in catch block:", error);
    
    // Check if it's a network-related error
    if (error.message && (error.message.includes('network') || error.message.includes('connection'))) {
      Alert.alert("Network Error", "Please check your internet connection and try again.");
    } else {
      Alert.alert("Error", "Unable to fetch news. Please try again later.");
    }
  }
};

export const fetchAtributes = () => async (dispatch, getState) => {
  try {
    console.log('fetchAtributes: Bypassing network check for testing...');
    
    // Temporarily bypass network check to test if the issue is with the network service
    const state = getState();
    const userinfo = state.user.userinfo;

    if (!userinfo || !userinfo.uid) {
      console.warn("No user info available");
      return;
    }

    // Fetch fresh user data from Firestore
    const userDoc = await firestore().collection('users').doc(userinfo.uid).get();
    const userData = userDoc.data();

    if (!userData) {
      console.warn("User document not found");
      return;
    }

    const bookmarked = userData.bookmarked || [];
    const history = userData.history || [];

    dispatch(setLikes(bookmarked));
    dispatch(setHistory(history));
    
    console.log('fetchAtributes: User attributes fetched successfully');
    
  } catch (error) {
    console.error("fetchAtributes: Error in catch block:", error);
    
    // Check if it's a network-related error
    if (error.message && (error.message.includes('network') || error.message.includes('connection'))) {
      Alert.alert("Network Error", "Please check your internet connection and try again.");
    } else {
      Alert.alert("Error", "Failed to fetch user attributes. Please try again later.");
    }
  }
};

export const fetchEvents = () => async (dispatch, getState) => {
  try {
    console.log('fetchEvents: Bypassing network check for testing...');
    
    // Temporarily bypass network check to test if the issue is with the network service
    const state = getState();
    const userinfo = state.user.userinfo;
    if (!userinfo || !userinfo.uid) {
      console.warn("No user info available");
      return;
    }
    const userDoc = await firestore().collection('users').doc(userinfo.uid).get();
    const userData = userDoc.data();
    const events = userData.events || [];
    dispatch(setEvents(events));
    
    console.log('fetchEvents: Events fetched successfully');
    
  } catch (error) {
    console.error("fetchEvents: Error in catch block:", error);
    
    // Check if it's a network-related error
    if (error.message && (error.message.includes('network') || error.message.includes('connection'))) {
      Alert.alert("Network Error", "Please check your internet connection and try again.");
    } else {
      Alert.alert("Error", "Failed to fetch events. Please try again later.");
    }
  }
}

export const fetchAllArticles = () => async (dispatch) => {
  try {
    console.log('fetchAllArticles: Bypassing network check for testing...');
    
    // Temporarily bypass network check to test if the issue is with the network service
    // Fetch all articles without user filters for skip login users
    const snapshot = await firestore().collection('crypto_articles_test_2').get();
    const allArticles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Dispatch all articles without filtering
    dispatch(setNewsList(allArticles));
    
    console.log('fetchAllArticles: All articles fetched successfully');
    
  } catch (error) {
    console.error("fetchAllArticles: Error in catch block:", error);
    Alert.alert("Error", "Unable to fetch articles.");
  }
};

export const removeHistoryItem = (articleId) => async (dispatch, getState) => {
  try {
    console.log('removeHistoryItem: Bypassing network check for testing...');
    
    // Temporarily bypass network check to test if the issue is with the network service
    const state = getState();
    const userinfo = state.user.userinfo;

    if (!userinfo || !userinfo.uid) {
      console.warn("No user info available");
      return;
    }

    // Remove from Firebase
    await firestore()
      .collection('users')
      .doc(userinfo.uid)
      .update({
        history: firestore.FieldValue.arrayRemove(articleId)
      });

    // Update Redux state
    dispatch(removeFromHistory(articleId));
    
    console.log('removeHistoryItem: History item removed successfully');
    
  } catch (error) {
    console.error("removeHistoryItem: Error in catch block:", error);
    Alert.alert("Error", "Failed to remove item from history");
  }
};

export const clearAllHistoryAction = () => async (dispatch, getState) => {
  try {
    console.log('clearAllHistoryAction: Bypassing network check for testing...');
    
    // Temporarily bypass network check to test if the issue is with the network service
    const state = getState();
    const userinfo = state.user.userinfo;

    if (!userinfo || !userinfo.uid) {
      console.warn("No user info available");
      return;
    }

    // Clear from Firebase
    await firestore()
      .collection('users')
      .doc(userinfo.uid)
      .update({
        history: []
      });

    // Update Redux state
    dispatch(clearAllHistory());
    
    console.log('clearAllHistoryAction: History cleared successfully');
    
  } catch (error) {
    console.error("clearAllHistoryAction: Error in catch block:", error);
    Alert.alert("Error", "Failed to clear history");
  }
};


