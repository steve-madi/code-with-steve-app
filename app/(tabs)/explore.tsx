import { addDoc, collection } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { db } from '../../firebase';

const ExploreScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'users'), {
        name,
        email,
        password, // In production, never store plain passwords!
        createdAt: new Date(),
      });
      Alert.alert('Success', 'Registration successful!');
      setName('');
      setEmail('');
      setPassword('');
    } catch (error) {
      console.log('Registration error:', error);
      Alert.alert('Error', 'Registration failed.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.activeTab}>Sign Up</Text>
        <Text style={styles.inactiveTab}>Login</Text>
      </View>

      <Image
        source={{
          uri: 'https://cdn-icons-png.flaticon.com/512/847/847969.png',
        }}
        style={styles.profileImage}
      />

      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholderTextColor="#999"
      />
      <TextInput
        placeholder="Email address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#999"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.inputPassword}
          secureTextEntry={!passwordVisible}
          placeholderTextColor="#999"
        />
        <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
          <Icon
            name={passwordVisible ? 'eye-off' : 'eye'}
            size={22}
            color="#999"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.registerButton} 
        onPress={handleRegister} 
        disabled={loading}
      >
        <Text style={styles.registerButtonText}>
          {loading ? 'Registering...' : '✓ SIGN UP'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.terms}>Terms of Service</Text>
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
  registerButton: {
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
  registerButtonText: {
    color: '#3366cc',
    fontWeight: 'bold',
    fontSize: 16,
  },
  terms: {
    textAlign: 'center',
    color: '#777',
    marginVertical: 10,
  },
});

export default ExploreScreen;