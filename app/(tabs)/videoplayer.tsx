import { RouteProp, useRoute } from '@react-navigation/native';
import { Video } from 'expo-av';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Define the expected params type
interface VideoPlayerParams {
  videoUrl?: string;
}

const VideoPlayer = () => {
    const route = useRoute<RouteProp<{ params: VideoPlayerParams }, 'params'>>();
    const videoUrl = route.params?.videoUrl;

    if (!videoUrl) {
      return (
        <View style={styles.container}>
          <Text style={{ color: 'white', textAlign: 'center', marginTop: 40 }}>
            No video URL provided.
          </Text>
        </View>
      );
    }

    return (
        <View style={styles.container}>
            <Video
                source={{ uri: videoUrl }}
                style={styles.video}
                useNativeControls
                resizeMode="contain"
                shouldPlay
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
});

export default VideoPlayer;