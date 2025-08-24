import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// helper function for saving to AsyncStorage
const saveToStorage = async (key, value) => {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.log(`Error saving ${key}`, e);
    }
};

const initialState = {
    userinfo: {},
    newsList: [],
    likes: [],
    history: [],
    events: [],
    network: {
        isConnected: true,
        isInternetReachable: true,
        type: 'unknown',
        isWifi: false,
        isCellular: false
    },
    skip: true,
    isLoggedin: false,
    onboardingDone:false
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        uploadUserinfo: (state, action) => {
            state.userinfo = { ...state.userinfo, ...action.payload };
            saveToStorage("userinfo", state.userinfo);
        },
        loginUserinfo: (state, action) => {
            state.userinfo = { ...state.userinfo, ...action.payload };
            saveToStorage("userinfo", state.userinfo);
        },
        setNewsList: (state, action) => {
            state.newsList = action.payload;
        },
        setLikes: (state, action) => {
            state.likes = action.payload;
        },
        setHistory: (state, action) => {
            state.history = action.payload;
        },
        setEvents: (state, action) => {
            state.events = action.payload;
        },
        updateProfileImage: (state, action) => {
            state.userinfo.profileImageUrl = action.payload;
            saveToStorage("userinfo", state.userinfo);
        },
        removeFromHistory: (state, action) => {
            state.history = state.history.filter(id => id !== action.payload);
        },
        clearAllHistory: (state) => {
            state.history = [];
        },
        clearUser: (state) => {
            state.userinfo = {};
            state.newsList = [];
            state.likes = [];
            state.history = [];
            state.events = [];
            state.isLoggedin = false;
            state.skip = true;
            saveToStorage("userinfo", {});
            saveToStorage("isLoggedin", false);
            saveToStorage("skip", true);
        },
        updateNetworkStatus: (state, action) => {
            state.network = { ...state.network, ...action.payload };
        },
        UpdateSkip: (state, action) => {
            state.skip = action.payload;
            saveToStorage("skip", action.payload);
        },
        UpdateisLoggedin: (state, action) => {
            state.isLoggedin = action.payload;
            saveToStorage("isLoggedin", action.payload);
        },
        UpdateonboardingDone: (state, action) => {
            state.onboardingDone = action.payload;
            saveToStorage("onboardingDone", action.payload);
        },
    }
});

export const {
    uploadUserinfo,
    loginUserinfo,
    setNewsList,
    setHistory,
    setLikes,
    setEvents,
    updateProfileImage,
    removeFromHistory,
    clearAllHistory,
    clearUser,
    updateNetworkStatus,
    UpdateSkip,
    UpdateisLoggedin,
    UpdateonboardingDone
} = userSlice.actions;

export default userSlice.reducer;
