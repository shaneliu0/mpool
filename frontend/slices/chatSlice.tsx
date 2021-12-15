import { createSlice } from '@reduxjs/toolkit'

export const authSlice = createSlice({
    name: 'chat',
    initialState: {
        status: 'idle',
        messages: [],
        conversations: [],
    },
    reducers: {
        setConversations: (state, action) => {
            state.status = 'fulfilled';
            state.conversations = action.payload;
        }
    }
})

export const { setConversations } = authSlice.actions;

export default authSlice.reducer;