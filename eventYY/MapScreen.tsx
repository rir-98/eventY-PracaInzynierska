import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import axios from 'axios';
import * as Location from 'expo-location';
import CustomButton from './components/CustomButton';

const MapScreen = () => {
  const [location, setLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [mapRegion, setMapRegion] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [loading, setLoading] = useState(true);

  const GEOCODING_API_KEY = 'caf40d4bf62b49799181a6adab362d42';
  const FOURSQUARE_API_KEY = 'fsq3zUSer/J2X0b0Upgd3cR00xYOf5h2dahp89KZ/hZtioM=';
  const ORS_API_KEY = '5b3ce3597851110001cf6248eb17de4d2d3648cba370035186d98b2c';

  // Pobieranie lokalizacji użytkownika
  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
          });
          setLocation(location);
          setLoading(false);
        }
      } catch (error) {
        console.error("Błąd podczas pobierania lokalizacji:", error);
      }
    };
    getLocation();
  }, []);

  // Pobieranie miejsc na podstawie wyszukanej lokalizacji i wybranych kategorii
  useEffect(() => {
    if (searchedLocation) {
      fetchPlaces(searchedLocation.latitude, searchedLocation.longitude);
    }
  }, [selectedCategories, searchedLocation]);

  // Obsługa wyszukiwania lokalizacji
  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const geoResponse = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json?q=${searchQuery}&key=${GEOCODING_API_KEY}`
      );
      if (geoResponse.data.results.length > 0) {
        const coords = geoResponse.data.results[0].geometry;
        setSearchedLocation({
          latitude: coords.lat,
          longitude: coords.lng,
        });
        setMapRegion({
          latitude: coords.lat,
          longitude: coords.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } else {
        Alert.alert('Błąd', 'Nie znaleziono miejscowości');
      }
    } catch (error) {
      console.error("Błąd geokodowania:", error);
      Alert.alert('Błąd', 'Nie udało się wyszukać miejscowości');
    }
  };

  // Pobieranie trasy między dwoma punktami
  const fetchRoute = async (start, end) => {
    try {
      const response = await axios.get(
        `https://api.openrouteservice.org/v2/directions/driving-car`,
        {
          params: {
            api_key: ORS_API_KEY,
            start: `${start.longitude},${start.latitude}`,
            end: `${end.longitude},${end.latitude}`,
          }
        }
      );
      const coords = response.data.features?.[0]?.geometry?.coordinates;
      if (!coords) {
        Alert.alert('Błąd', 'Nie udało się pobrać trasy');
        return;
      }
      const route = coords.map(coord => ({
        latitude: coord[1],
        longitude: coord[0],
      }));
      setRouteCoordinates(route);
    } catch (error) {
      console.error("Błąd pobierania trasy:", error?.response?.data || error.message);
      Alert.alert('Błąd', 'Nie udało się pobrać trasy');
    }
  };

  // Obsługa kliknięcia na miejsce
  const handlePlacePress = (place) => {
    Alert.alert(
      place.name || "Brak nazwy",
      place.distance ? `Odległość: ~${(place.distance / 1000).toFixed(1)} km` : "Brak danych o odległości",
      [
        {
          text: "Wyznacz trasę",
          onPress: () => {
            if (location) {
              fetchRoute(
                {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude
                },
                {
                  latitude: place.geocodes.main.latitude,
                  longitude: place.geocodes.main.longitude,
                }
              );
            }
          }
        },
        {
          text: "Zamknij",
          style: "cancel"
        }
      ]
    );
  };

  // Lista kategorii, w przyszlości dodam więcej kategorii
  const CATEGORY_RANGES = {
    restauracje: ['13000', '13392'],
    atrakcje: ['10000', '10069'],
  };

  const categoriesList = [
    { id: 'restauracje', name: 'Restauracje' },
    { id: 'atrakcje', name: 'Atrakcje' },
  ];

  // Przełączanie kategorii
  const toggleCategory = (categoryId) => {
    setSelectedCategories(prevSelected => {
      if (prevSelected.includes(categoryId)) {
        return prevSelected.filter(id => id !== categoryId);
      } else {
        return [...prevSelected, categoryId];
      }
    });
  };

  // Pobieranie miejsc na podstawie lokalizacji i wybranych kategorii
  const fetchPlaces = async (lat, lng) => {
    try {
      const selectedRanges = selectedCategories.length > 0 
        ? selectedCategories.map(category => CATEGORY_RANGES[category]).flat()
        : Object.values(CATEGORY_RANGES).flat();
      const response = await axios.get(
        `https://api.foursquare.com/v3/places/search?ll=${lat},${lng}&radius=6000&categories=${selectedRanges.join(',')}&limit=50`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: FOURSQUARE_API_KEY,
          },
        }
      );
      const updatedPlaces = response.data.results.map(place => {
        const latDiff = place.geocodes.main.latitude - lat;
        const lngDiff = place.geocodes.main.longitude - lng;
        place.distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000;
        return place;
      });
      setPlaces(updatedPlaces);
    } catch (error) {
      console.error("Błąd pobierania miejsc:", error);
      Alert.alert('Błąd', 'Nie udało się pobrać miejsc');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder='Wpisz miejscowość'
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <CustomButton title="Szukaj" style={styles.findButton} onPress={handleSearch} />
      </View>
      <View style={styles.filterContainer}>
        {categoriesList.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.filterButton,
              selectedCategories.includes(category.id) && styles.filterButtonSelected
            ]}
            onPress={() => toggleCategory(category.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.filterButtonText}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {location ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          region={mapRegion || {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          zoomEnabled={true}
          zoomControlEnabled={true}
          provider="google"
        >
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="blue"
              strokeWidth={3}
            />
          )}
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            }}
            title='Twoja lokalizacja'
            pinColor='blue'
          />
          {places.map(place => (
            <Marker
              key={place.fsq_id}
              coordinate={{
                latitude: place.geocodes.main.latitude,
                longitude: place.geocodes.main.longitude,
              }}
              title={place.name}
              pinColor={
                Array.isArray(place.categories) &&
                place.categories.length > 0 &&
                place.categories[0].id
                  ? place.categories[0].id.toString().startsWith('13')
                    ? 'orange'  // Restauracje
                    : place.categories[0].id.toString().startsWith('100')
                      ? 'yellow' // Atrakcje
                      : 'red'    // Inne
                  : 'red'
              }
              onPress={() => handlePlacePress(place)}
            />
          ))}
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Ładowanie mapy...</Text>
        </View>
      )}
      <ScrollView style={styles.placesList}>
        {places.map((place, index) => (
          <Text key={index} style={styles.placeItem}>
            {place.name} - {place.location.address}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 10 },
  map: { flex: 1 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 5, marginRight: 10 },
  filterContainer: { flexDirection: 'row', justifyContent: 'center', padding: 10 },
  filterButton: { padding: 10, margin: 5, backgroundColor: '#ccc', borderRadius: 5 },
  filterButtonSelected: { backgroundColor: '#007bff' },
  findButton: { backgroundColor: "#1703fc" },
  placeItem: { fontSize: 16, marginVertical: 5 },
  placesList: { flex: 1, bottom: 10, left: 10, right: 10, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 10, padding: 10, maxHeight: 150 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default MapScreen;
