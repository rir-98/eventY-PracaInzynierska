import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import CustomButton from './components/CustomButton';


type EventDetailsScreenRouteProp = RouteProp<RootStackParamList, 'EventDetails'>;

type Props = {
  route: EventDetailsScreenRouteProp;
};

axios.defaults.baseURL = 'http://ririt.org';

const EventDetailsScreen: React.FC<Props> = ({ route }) => {
  const { eventId } = route.params;
  const [tripDetails, setTripDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  

  // Pop-up i edycja
  const [modalVisible, setModalVisible] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [editField, setEditField] = useState('');
  const [isOrganizer, setIsOrganizer] = useState(false);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!eventId) {
        console.error('eventId jest niepoprawny:', eventId);
        Alert.alert('Błąd', 'Niepoprawne ID wydarzenia.');
        return;
      }

      setLoading(true);

      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert('Brak autoryzacji', 'Zaloguj się, aby kontynuować');
          navigation.navigate('Login');
          return;
        }

        console.log('Pobrany token:', token);
        console.log('Pełny URL:', `/trip_details/${eventId}`);

        const response = await axios.get(`/trip_details/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          setTripDetails(response.data);
          const userData = await axios.get('/users/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (userData.data.id === response.data.organizer_id) {
            setIsOrganizer(true);
          } else {
            setIsOrganizer(false);
          }        
        } else {
          Alert.alert('Błąd', 'Nie udało się pobrać szczegółów podróży');
        }
        


      } catch (error: any) {
        console.error('Błąd pobierania szczegółów podróży:', error.response || error.message);
        Alert.alert('Błąd', 'Nie udało się pobrać szczegółów podróży');
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [eventId]);
// Funkcja generująca zaproszenie
const generateInvite = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert('Brak autoryzacji', 'Zaloguj się, aby kontynuować');
      navigation.navigate('Login');
      return;
    }

    const response = await axios.post(`/invite/invite/events/${eventId}/generate-invite`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const {code, expires_at } = response.data;
    if (response.status === 200) {
      Alert.alert(
        'Sukces',
        `Kod zaproszenia: ${code}\nWygasa: ${expires_at}`,
        [
          
          { text: 'OK' }
        ]
      );
    } else {
      Alert.alert('Błąd', 'Nie udało się wygenerować zaproszenia.');
    }
  } catch (error) {
    console.error('Błąd generowania zaproszenia:', error);
    Alert.alert('Błąd', 'Wystąpił problem z generowaniem zaproszenia.');
  }
};
  // Funkcja zapisu
  const deleteEvent = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Brak autoryzacji', 'Zaloguj się, aby kontynuować');
        navigation.navigate('Login');
        return;
      }
  
      // Potwierdzenie usunięcia
      Alert.alert(
        'Potwierdzenie',
        'Czy na pewno chcesz usunąć to wydarzenie?',
        [
          { text: 'Anuluj', style: 'cancel' },
          {
            text: 'Usuń',
            style: 'destructive',
            onPress: async () => {
              const response = await axios.delete(`/events/${eventId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
  
              if (response.status === 200) {
                Alert.alert('Sukces', 'Wydarzenie zostało usunięte.');
                navigation.goBack(); // Powrót do poprzedniego ekranu
              } else {
                Alert.alert('Błąd', 'Nie udało się usunąć wydarzenia.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Błąd usuwania wydarzenia:', error);
      Alert.alert('Błąd', 'Wystąpił problem z usunięciem wydarzenia.');
    }
  };

  
  const saveChanges = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Brak autoryzacji', 'Zaloguj się, aby kontynuować');
        navigation.navigate('Login');
        return;
      }
  
      if (['plan', 'packing_list', 'budget'].includes(editField)) {
      // Przygotowanie danych dla TripDetails
      const updatedTripDetailsData = {
        name: tripDetails.event?.name || "",
          location: tripDetails.event?.location || "",
          description: tripDetails.event?.description || "",
          start_date: tripDetails.event?.start_date ? new Date(tripDetails.event.start_date).toISOString() : null,
          end_date: tripDetails.event?.end_date ? new Date(tripDetails.event.end_date).toISOString() : null,
        plan: tripDetails.plan || "",
        packing_list: tripDetails.packing_list || "",
        budget: tripDetails.budget || 0
      };

      // Aktualizacja tylko edytowanego pola
      updatedTripDetailsData[editField] = editValue;

      
      console.log("Wysyłanie do /trip_details:", updatedTripDetailsData);

      const response = await axios.put(`/trip_details/${eventId}`, updatedTripDetailsData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        // Aktualizacja lokalnego stanu aplikacji
        setTripDetails(prevState => ({
          ...prevState,
          [editField]: editValue
        }));
        setModalVisible(false);
        Alert.alert('Sukces', 'Zmiany zostały zapisane.');
      } else {
        Alert.alert('Błąd', 'Nie udało się zapisać zmian w TripDetails.');
      }
    }
  } catch (error) {
    console.error('Błąd zapisu:', error);
    console.error('Błąd szczegóły:', error.response?.data); // Więcej szczegółów o błędzie
    Alert.alert('Błąd', 'Nie udało się zapisać zmian.');
  }
};
  


  // Wyświetlanie danych
  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : tripDetails ? (
        <ScrollView contentContainerStyle={styles.scrollView}>
          <Text style={styles.tripTitle}>Trip Details</Text>
          <View style={styles.tripCard}>                      
            
              <Text style={styles.tripLabel}>Nazwa:</Text>
              <Text style={styles.tripValue}>{tripDetails.event.name}</Text>
            
            
            
              <Text style={styles.tripLabel}>Lokalizacja:</Text>
              <Text style={styles.tripValue}>{tripDetails.event.location}</Text>
            
            
            
              <Text style={styles.tripLabel}>Opis:</Text>
              <Text style={styles.tripValue}>{tripDetails.event.description}</Text>
            
            
            
              <Text style={styles.tripLabel}>Rozpoczęcie:</Text>
              <Text style={styles.tripValue}>{tripDetails.event.start_date}</Text>
            
            
            
              <Text style={styles.tripLabel}>Zakończenie:</Text>
              <Text style={styles.tripValue}>{tripDetails.event.end_date}</Text>
            

            {/* Plan */}
            <TouchableOpacity
              onPress={() => {
                setEditField('plan');
                setEditValue(tripDetails.plan || '');
                setModalVisible(true);
              }}
            >
              <Text style={styles.tripLabel}>Plan:</Text>
              <Text style={styles.tripValue}>{tripDetails.plan || 'Brak planu'}</Text>
            </TouchableOpacity>

            {/* Lista rzeczy do spakowania */}
            <TouchableOpacity
              onPress={() => {
                setEditField('packing_list');
                setEditValue(tripDetails.packing_list || '');
                setModalVisible(true);
              }}
            >
              <Text style={styles.tripLabel}>Lista rzeczy do spakowania:</Text>
              <Text style={styles.tripValue}>{tripDetails.packing_list || 'Brak listy'}</Text>
            </TouchableOpacity>

            {/* Budżet */}
            <TouchableOpacity
              onPress={() => {
                setEditField('budget');
                setEditValue(tripDetails.budget.toString());
                setModalVisible(true);
              }}
            >
              <Text style={styles.tripLabel}>Budżet:</Text>
              <Text style={styles.tripValue}>{tripDetails.budget} PLN</Text>
            </TouchableOpacity>

           
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={generateInvite}
          >
            <Text style={styles.inviteButtonText}>Invite</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => navigation.navigate('MapScreen')}
          >
            <Text style={styles.mapButtonText}>Pokaż na Mapie</Text>
          </TouchableOpacity>
         </View>
         
            <TouchableOpacity style={styles.deleteButton} onPress={deleteEvent}>
              <Text style={styles.deleteButtonText}>Usuń Wydarzenie</Text>
            </TouchableOpacity>
          
        </ScrollView>
      ) : (
        <Text style={styles.errorText}>Nie znaleziono szczegółów podróży.</Text>
      )}

      {/* Modal Pop-up */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Edytuj {editField}</Text>
      <TextInput
        style={styles.input}
        value={editValue}
        onChangeText={(text) => setEditValue(text)}
        placeholder={`Nowa wartość dla ${editField}`}
      />
      <View style={styles.buttonContainer}>
        <CustomButton title="Zapisz" onPress={saveChanges} />
        <CustomButton title="Anuluj" onPress={() => setModalVisible(false)} color="red" />
      </View>
    </View>
  </View>
</Modal>
    </View>
  );
};

export default EventDetailsScreen;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f4f9',
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    
  },
  tripCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  tripLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    
    marginTop: 10,
  },
  tripValue: {
    fontSize: 18,
    color: '#6b6b9b',
    marginBottom: 10,
  },
  participantContainer: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#e9e9f2',
    borderRadius: 5,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  participantEmail: {
    fontSize: 14,
    color: '#6b6b9b',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 10, // Cień na Androidzie
    shadowColor: '#000', // Cień na iOS
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Przyciemnione tło
  }, 

  mapButton: {
    backgroundColor: '#1703fc',
    padding: 10,
    borderRadius: 5,
    
    alignItems: 'center',
  },

  mapButtonText:{
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inviteButton: {
    backgroundColor: '#1703fc',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#ff4d4d',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }, 
  
});