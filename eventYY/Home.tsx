import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import CustomButton from './components/CustomButton';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: { navigation: HomeScreenNavigationProp }) => {
  const [user, setUser] = useState<{ email: string, username: string } | null>(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  // Pobieranie danych użytkownika
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert('Brak autoryzacji', 'Zaloguj się, aby kontynuować');
          navigation.navigate('Login');
          return;
        }

        const response = await axios.get('https://ririt.org/users/me/', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          setUser(response.data);
        } else {
          Alert.alert('Błąd', 'Nie udało się pobrać danych użytkownika');
        }
      } catch (error) {
        console.error('Błąd pobierania danych użytkownika:', error);
        Alert.alert('Błąd', 'Nie udało się pobrać danych użytkownika');
        navigation.navigate('Login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Pobieranie wydarzeń użytkownika
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const response = await axios.get('http://ririt.org/events/my-events/', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          setEvents(response.data);
        } else {
          Alert.alert('Błąd', 'Nie udało się pobrać wydarzeń');
        }
      } catch (error) {
        console.error('Błąd pobierania wydarzeń:', error);
        Alert.alert('Błąd', 'Nie udało się pobrać wydarzeń');
      }
    };

    fetchEvents();
  }, []);

  // Odświeżanie listy wydarzeń
  const refreshEvents = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('http://ririt.org/events/my-events/', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        setEvents(response.data);
      } else {
        Alert.alert('Błąd', 'Nie udało się pobrać wydarzeń');
      }
    } catch (error) {
      console.error('Błąd pobierania wydarzeń:', error);
      Alert.alert('Błąd', 'Nie udało się pobrać wydarzeń');
    }
  };

  // Obsługa dołączania do wydarzenia
  const handleJoinEvent = async () => {
    if (!joinCode) {
      Alert.alert("Błąd", "Proszę podać kod wydarzenia.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Błąd", "Brak tokenu autoryzacji.");
        return;
      }

      const url = `http://ririt.org/invite/invite/events/join/${joinCode}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Zostałeś pomyślnie dodany do wydarzenia!');
      Alert.alert("Powodzenie", "Zostałeś pomyślnie dodany do wydarzenia!")
      refreshEvents();
    } catch (error) {
      console.error("Wystąpił błąd: ", error);
      Alert.alert("Błąd", "Coś poszło nie tak, spróbuj ponownie.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Witaj w eventY!</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : user ? (
        <>
          <Text style={styles.info}>Zalogowany jako: {user.username}</Text>

          {/* Przycisk do dołączania do wydarzeń */}
          <View style={styles.joinEventButton}>
            <CustomButton title="Dołącz do wydarzenia" onPress={() => setModalVisible(true)} />
          </View>

          {/* Przycisk do tworzenia nowego wydarzenia */}
          <View style={styles.createEventButton}>
            <CustomButton
              title="Utwórz nowe wydarzenie"
              onPress={() => navigation.navigate('Events')}
            />
          </View>

          {/* Modal do wprowadzania kodu do dołączenia */}
          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Wprowadź kod wydarzenia</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Kod wydarzenia"
                  value={joinCode}
                  onChangeText={setJoinCode}
                />
                <CustomButton title="Dołącz" onPress={handleJoinEvent} />
                <CustomButton title="Anuluj" onPress={() => setModalVisible(false)} />
              </View>
            </View>
          </Modal>

          <ScrollView style={styles.scrollContainer}>
            <View style={styles.eventsContainer}>
              {events.length > 0 ? (
                events.map((event, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.eventItem}
                    onPress={() =>
                      navigation.navigate('EventDetails', { eventId: event.id })
                    }
                  >
                    <Text style={styles.eventTitle}>Nazwa eventu: {event.name || 'Brak nazwy'}</Text>
                    <Text style={styles.eventTitle}>Lokalizacja: {event.location || 'Brak lokalizacji'}</Text>
                    <Text style={styles.eventUsername}>Użytkownicy:</Text>
                    {event.participants && event.participants.length > 0 ? (
                      event.participants.map((participant, pIndex) => (
                        <Text key={pIndex} style={styles.participant}>
                          Imie: {participant.username}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.participant}>Brak uczestników</Text>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noEvents}>Nie masz jeszcze żadnych wydarzeń.</Text>
              )}
            </View>
          </ScrollView>
        </>
      ) : (
        <CustomButton title="Logowanie" onPress={() => navigation.navigate('Login')} />
      )}
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  info: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
  },
  createEventButton: {
    alignItems: 'center',
  },
  joinEventButton: {
    alignItems: 'center',
    marginVertical: 10,
  },
  eventItem: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '90%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  eventUsername: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  participant: {
    fontSize: 14,
    color: '#777',
  },
  noEvents: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  scrollContainer: {
    width: '100%',
    paddingTop: 20,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    width: '100%',
  },
});