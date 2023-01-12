import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef()

export function navigate(name: any, params: any) {
    console.log("foo");
    
    if (navigationRef.isReady()) {
        console.log("bar");
        
        navigationRef.navigate(name, params);
    }
}

