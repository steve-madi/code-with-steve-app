import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { Video } from 'expo-av';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';

interface VideoPlayerParams {
  videoUrl?: string;
}

const VideoPlayer = () => {
    const route = useRoute<RouteProp<{ params: VideoPlayerParams }, 'params'>>();
    const navigation = useNavigation();
    const videoUrl = route.params?.videoUrl;
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
        Dimensions.get('window').width > Dimensions.get('window').height ? 'landscape' : 'portrait'
    );
    const videoRef = React.useRef<Video>(null);

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setOrientation(window.width > window.height ? 'landscape' : 'portrait');
        });

        // Allow all orientations when this component mounts
        ScreenOrientation.unlockAsync();

        return () => {
            subscription.remove();
            // Reset to default orientation when component unmounts
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        };
    }, []);

    const toggleOrientation = async () => {
        if (orientation === 'portrait') {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } else {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        }
    };

    if (!videoUrl) {
        return (
            <View style={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={{ color: 'white', textAlign: 'center', marginTop: 40 }}>
                    No video URL provided.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity style={[
                styles.backButton,
                orientation === 'landscape' && styles.backButtonLandscape
            ]} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={[
                    styles.rotateButton,
                    orientation === 'landscape' && styles.rotateButtonLandscape
                ]} 
                onPress={toggleOrientation}
            >
                <Ionicons 
                    name={orientation === 'portrait' ? 'phone-landscape' : 'phone-portrait'} 
                    size={24} 
                    color="white" 
                />
            </TouchableOpacity>

            <Video
                ref={videoRef}
                source={{ uri: videoUrl }}
                style={orientation === 'portrait' ? styles.video : styles.videoLandscape}
                useNativeControls
                resizeMode="contain"
                shouldPlay
                onFullscreenUpdate={async (e) => {
                    if (e.fullscreenUpdate === Video.FULLSCREEN_UPDATE_PLAYER_DID_PRESENT) {
                        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
                    } else if (e.fullscreenUpdate === Video.FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS) {
                        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
                    }
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    video: {
        flex: 1,
    },
    videoLandscape: {
        width: '100%',
        height: '100%',
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 1,
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    backButtonLandscape: {
        top: 20,
        left: 20,
    },
    rotateButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 1,
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    rotateButtonLandscape: {
        top: 20,
        right: 20,
    }
});

export default VideoPlayer;