import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image, 
  Alert, Animated, Easing 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buttonScale] = useState(new Animated.Value(1));
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Error', 'Please fill all fields', false);
      return;
    }

    setLoading(true);
    pulseAnimation();

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email), where('password', '==', password));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        showAlert('Error', 'Invalid email or password', false);
      } else {
        showAlert('Success', 'Login successful!', true);
        // Navigate to home after successful login
        setTimeout(() => {
          navigation.navigate('home');
        }, 1500);
      }
    } catch (error) {
      console.error('Login error:', error);
      showAlert('Error', 'Login failed. Please try again.', false);
    } finally {
      setLoading(false);
    }
  };

  const pulseAnimation = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1.05,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showAlert = (title, message, isSuccess) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'OK',
          onPress: () => {
            if (isSuccess) {
              navigation.navigate('Home');
            }
          },
          style: 'default',
        },
      ],
      {
        cancelable: false,
        containerStyle: styles.alertContainer,
        titleStyle: isSuccess ? styles.alertTitleSuccess : styles.alertTitleError,
        messageStyle: styles.alertMessage,
        overlayStyle: styles.alertOverlay,
      }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.activeTab}>Login</Text>
        <Text style={styles.inactiveTab}>Sign Up</Text>
      </View>

      <Image
        source={{
          uri: 'https://cdn-icons-png.flaticon.com/512/847/847969.png',
        }}
        style={styles.profileImage}
      />

      <TextInput
        placeholder="Email address"
        placeholderTextColor="#999"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Password"
          placeholderTextColor="#999"
          style={styles.inputPassword}
          secureTextEntry={!passwordVisible}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
          <Icon
            name={passwordVisible ? 'eye-off' : 'eye'}
            size={22}
            color="#999"
          />
        </TouchableOpacity>
      </View>

      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? (
              <Icon name="loading" size={20} color="#3366cc" />
            ) : (
              '✓ LOG IN'
            )}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.loginWithText}>Login with</Text>

      <View style={styles.socialIcons}>
        <TouchableOpacity>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/281/281764.png' }}
            style={styles.icon}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2111/2111432.png' }}
            style={styles.icon}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/733/733579.png' }}
            style={styles.icon}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/733/733547.png' }}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecfcf7',
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activeTab: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  inactiveTab: {
    fontSize: 18,
    color: '#bbb',
    marginTop: 10,
  },
  profileImage: {
    width: 90,
    height: 90,
    alignSelf: 'center',
    marginBottom: 40,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ddd',
    marginBottom: 25,
    fontSize: 16,
    color: '#000',
    paddingBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    marginBottom: 30,
    justifyContent: 'space-between',
  },
  inputPassword: {
    fontSize: 16,
    color: '#000',
    flex: 1,
    paddingBottom: 8,
  },
  loginButton: {
    backgroundColor: '#f5f7fa',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#3366cc',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginWithText: {
    textAlign: 'center',
    color: '#777',
    marginVertical: 10,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  icon: {
    width: 36,
    height: 36,
  },
  // Alert styles
  alertContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  alertTitleSuccess: {
    color: '#34A853',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  alertTitleError: {
    color: '#EA4335',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  alertMessage: {
    color: '#5F6368',
    fontSize: 16,
  },
  alertOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});

export default LoginScreen;