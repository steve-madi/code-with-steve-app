import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ImageBackground,
  SafeAreaView,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Login: undefined;
};

const { width, height } = Dimensions.get('window');

const LandingPage = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground 
        source={require('./img/land.jpg')} // Using local image
        style={styles.backgroundImage}
        blurRadius={2}
      >
        <View style={styles.overlay}>
          <Text style={styles.tagline}>CODE WITH STEVE</Text>
          <Text style={styles.title}>Learn Programming online!</Text>
          
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => navigation.navigate('login')}
          >
            <Text style={styles.buttonText}>START</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  appTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tagline: {
    color: 'white',
    fontSize: 24,
    fontWeight: '300',
    marginBottom: 10,
    textAlign: 'center',
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  startButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default LandingPage;