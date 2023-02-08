import * as functions from "firebase-functions";
import axios from 'axios';

axios.defaults.baseURL = functions.config().config.base_url;
axios.defaults.headers.common['server_recipient_key'] = functions.config().config.server_recipient_key;


// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

export const postUserData = functions.auth.user().onCreate(async (user) => {
    const { uid, email, displayName, photoURL } = user;
    const data = {
        uid,
        email,
        displayName,
        photoURL
    };
    await axios.post("/functions/createuser", data);
    return null;
});
