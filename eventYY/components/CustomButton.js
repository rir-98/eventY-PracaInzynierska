// components/CustomButton.js
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

const CustomButton = ({ title, onPress, style }) => {
  return (
    <Pressable 
      onPress={onPress} 
      style={({ pressed }) => [
        styles.button,
        style,
        pressed && styles.pressedButton
      ]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1703fc',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4, // Lepszy cień na Androidzie
    
  },
  pressedButton: {
    backgroundColor: '#1703fc', // Lekko ciemniejszy odcień przy naciśnięciu
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  }
});

export default CustomButton;
