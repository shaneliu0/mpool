import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./slices/authSlice"
import studentReducer from "./slices/chatSlice";

export default configureStore({
    reducer: {
        auth: authReducer,
        student: studentReducer
    }
});