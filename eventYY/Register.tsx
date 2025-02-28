import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import CustomButton from './components/CustomButton';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

const Register = ({ navigation }: { navigation: RegisterScreenNavigationProp }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      const response = await axios.post('http://ririt.org/register', {
        username,
        email,
        password,
      });

      if (response.status === 200) {
        Alert.alert('Sukces', 'Rejestracja zakończona pomyślnie. Możesz się teraz zalogować.');
        navigation.navigate('Login');
      }
    } catch (error) {
      console.error('Błąd rejestracji:', error.response?.data || error);
      Alert.alert('Błąd', 'Wystąpił problem z rejestracją');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rejestracja</Text>
      <TextInput
        style={styles.input}
        placeholder="Nazwa użytkownika"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Hasło"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <CustomButton title="Zarejestruj się" style={styles.registerButton} onPress={handleRegister} />
      <CustomButton title="Powrót" style={styles.returnButton} onPress={() => navigation.navigate('MainScreen')} />
    </View>
  );
};

export default Register;

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
  registerButton: {
    backgroundColor: '#1703fc',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    width: '80%',
    alignItems: 'center',
  },
  returnButton: {
    backgroundColor: '#1703fc',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
    width: '80%',
    alignItems: 'center',
  },
});
