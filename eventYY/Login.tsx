import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FormData from 'form-data';
import { RootStackParamList } from './types';
import CustomButton from './components/CustomButton';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const Logowanie = ({ navigation }: { navigation: LoginScreenNavigationProp }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post('http://ririt.org/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200) {
        const token = response.data.access_token;
        await AsyncStorage.setItem('token', token);
        Alert.alert('Sukces', 'Zalogowano pomyślnie');
        navigation.navigate('Home');
      } else {
        Alert.alert('Błąd', 'Nieprawidłowe dane logowania');
      }
    } catch (error) {
      console.error('Błąd logowania:', error.response?.data || error);
      Alert.alert('Błąd', 'Wystąpił problem z logowaniem');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Logowanie</Text>
      <>
        <TextInput
          style={styles.input}
          placeholder="Nazwa użytkownika"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Hasło"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <CustomButton title="Zaloguj się" style={styles.loginButton} onPress={handleLogin} />
        <CustomButton title="Anuluj" style={styles.cancelButton} onPress={() => navigation.navigate('MainScreen')} />
      </>
    </View>
  );
};

export default Logowanie;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '80%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  loginButton: {
    backgroundColor: '#1703fc',
    padding: 10,
    borderRadius: 5555555555,
    marginTop: 20,
    width: '80%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#1703fc',
    padding: 100,
    borderRadius: 55555555,
    marginTop: 5,
    width: '80%',
    alignItems: 'center',
  },
});
