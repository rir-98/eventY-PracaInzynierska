import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from './types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CustomButton from './components/CustomButton';

type EventScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Events'>;

const CreateEventScreen = ({ navigation }: { navigation: EventScreenNavigationProp }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const handleCreateEvent = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Błąd', 'Brak tokena autoryzacyjnego.');
        return;
      }

      const eventData = {
        name,
        location,
        description,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      };

      const response = await axios.post('http://ririt.org/events/', eventData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        Alert.alert('Sukces', 'Wydarzenie zostało utworzone.');
        navigation.goBack(); // Powrót do poprzedniego ekranu
      } else {
        Alert.alert('Błąd', 'Nie udało się utworzyć wydarzenia.');
      }
    } catch (error) {
      console.error('Błąd tworzenia wydarzenia:', error);
      Alert.alert('Błąd', 'Nie udało się utworzyć wydarzenia.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Utwórz nowe wydarzenie</Text>
      <TextInput style={styles.input} placeholder="Nazwa" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Lokalizacja" value={location} onChangeText={setLocation} />
      <TextInput style={styles.input} placeholder="Opis" value={description} onChangeText={setDescription} />
      <View style={styles.dateTimeContainer}>
        <CustomButton title="Wybierz datę rozpoczęcia" style={styles.dateButton} onPress={() => setShowStartDatePicker(true)} />
        <CustomButton title="Wybierz godzinę rozpoczęcia" style={styles.timeButton} onPress={() => setShowStartTimePicker(true)} />
      </View>
      <View style={styles.dateTimeContainer}>
        <CustomButton title="Wybierz datę zakończenia" style={styles.dateButton} onPress={() => setShowEndDatePicker(true)} />
        <CustomButton title="Wybierz godzinę zakończenia" style={styles.timeButton} onPress={() => setShowEndTimePicker(true)} />
      </View>
      <CustomButton title="Utwórz wydarzenie" style={styles.createButton} onPress={handleCreateEvent} />
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}
      {showStartTimePicker && (
        <DateTimePicker
          value={startDate}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowStartTimePicker(false);
            if (selectedTime) {
              const newStartDate = new Date(startDate);
              newStartDate.setHours(selectedTime.getHours());
              newStartDate.setMinutes(selectedTime.getMinutes());
              setStartDate(newStartDate);
            }
          }}
        />
      )}
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )}
      {showEndTimePicker && (
        <DateTimePicker
          value={endDate}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowEndTimePicker(false);
            if (selectedTime) {
              const newEndDate = new Date(endDate);
              newEndDate.setHours(selectedTime.getHours());
              newEndDate.setMinutes(selectedTime.getMinutes());
              setEndDate(newEndDate);
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateButton: {
    flex: 1,
    marginRight: 5,
    backgroundColor: '#007bff',
  },
  timeButton: {
    flex: 1,
    marginLeft: 5,
    backgroundColor: '#28a745',
  },
  createButton: {
    backgroundColor: '#1703fc',
    marginTop: 20,
  },
});

export default CreateEventScreen;