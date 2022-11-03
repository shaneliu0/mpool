
import Toast, { ToastShowParams } from "react-native-toast-message";


export function Error(error: any, toastOptions?: ToastShowParams) {
    console.log(error);
    Toast.show({
        type: 'error',
        text1: 'Something went wrong!',
        ...toastOptions,
    })
}