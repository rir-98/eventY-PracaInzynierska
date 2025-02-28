import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import CustomButton from './components/CustomButton';


type MainScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainScreen'>;

const MainScreen = ({ navigation }: { navigation: MainScreenNavigationProp }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Witaj w eventY</Text>
      <CustomButton title="Zaloguj się" style={styles.loginButton} onPress={() => navigation.navigate('Login')} />
      <CustomButton title="Zarejestruj się" style={styles.registerButton} onPress={() => navigation.navigate('Register')} />
    </View>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#1703fc',
    padding: 10,
    borderRadius: 5555555555,
    marginTop: 20,
    width: '80%',
    alignItems: 'center',
  },
  registerButton: {
    backgroundColor: '#1703fc',
    padding: 100,
    borderRadius: 55555555,
    marginTop: 5,
    width: '80%',
    alignItems: 'center',
  },
});
