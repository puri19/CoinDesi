import {configureStore} from "@reduxjs/toolkit"
import userReducer from '../action/action';
import themeReducer from '../action/themeActions';

const store = configureStore({
  reducer: {
    user: userReducer,
    theme: themeReducer
  }
});

export default store;