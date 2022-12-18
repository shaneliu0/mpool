
import Toast, { ToastShowParams } from "react-native-toast-message";


export function Error(error: any, toastOptions?: ToastShowParams) {
    // if there exists error.response.data, then log it
    if (error.response && error.response.data) {
        console.log(error.response.data);
    }
    console.log(error);
    Toast.show({
        type: 'error',
        text1: 'Something went wrong!',
        ...toastOptions,
    })
}