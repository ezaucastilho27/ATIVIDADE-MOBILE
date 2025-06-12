import React, { useEffect, useState, useMemo } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  Alert,
  RefreshControl,
  Dimensions 
} from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  ActivityIndicator,
  Chip,
  Divider,
  Surface,
  Text
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Serviço para requisições da API
const FootballApiService = {
  baseURL: 'https://api.football-data.org/v4',
  apiKey: '87b94f0551de4257a3232a62a3152c6e',
  
  async getMatchDetails(matchId) {
    const response = await fetch(`${this.baseURL}/matches/${matchId}`, {
      headers: { 'X-Auth-Token': this.apiKey }
    });
    
    if (!response.ok) {
      throw new Error('Erro ao buscar dados da partida');
    }
    
    return response.json();
  }
};

// Hook personalizado para gerenciar favoritos
const useFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  
  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem('matchesFavoritos');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Erro ao carregar favoritos:', error);
      return [];
    }
  };
  
  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem('matchesFavoritos', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Erro ao salvar favoritos:', error);
    }
  };
  
  const toggleFavorite = async (match) => {
    const currentFavorites = await loadFavorites();
    const isAlreadyFavorite = currentFavorites.some(fav => fav.id === match.id);
    
    let updatedFavorites;
    let message;
    
    if (isAlreadyFavorite) {
      updatedFavorites = currentFavorites.filter(fav => fav.id !== match.id);
      message = 'Partida removida dos favoritos';
    } else {
      updatedFavorites = [...currentFavorites, match];
      message = 'Partida adicionada aos favoritos!';
    }
    
    await saveFavorites(updatedFavorites);
    
    Alert.alert('Sucesso', message, [{ text: 'OK' }]);
    return !isAlreadyFavorite;
  };
  
  const checkIsFavorite = async (matchId) => {
    const currentFavorites = await loadFavorites();
    return currentFavorites.some(fav => fav.id === matchId);
  };
  
  return { toggleFavorite, checkIsFavorite };
};

const MatchDetailsScreen = ({ route, navigation }) => {
  const { matchId } = route.params;
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState(null);
  
  const { toggleFavorite, checkIsFavorite } = useFavorites();
  
  // Formatação de data melhorada
  const formatDate = useMemo(() => {
    if (!matchData?.utcDate) return 'Data não disponível';
    
    const date = new Date(matchData.utcDate);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [matchData?.utcDate]);
  
  // Status traduzido
  const getStatusDisplay = (status) => {
    const statusMap = {
      'SCHEDULED': 'Agendada',
      'LIVE': 'Ao Vivo',
      'IN_PLAY': 'Em Andamento',
      'PAUSED': 'Pausada',
      'FINISHED': 'Finalizada',
      'POSTPONED': 'Adiada',
      'CANCELLED': 'Cancelada',
      'SUSPENDED': 'Suspensa'
    };
    return statusMap[status] || status;
  };
  
  const fetchMatchData = async () => {
    try {
      setError(null);
      const data = await FootballApiService.getMatchDetails(matchId);
      setMatchData(data);
      
      const favoriteStatus = await checkIsFavorite(data.id);
      setIsFavorite(favoriteStatus);
      
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar detalhes:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMatchData();
    setRefreshing(false);
  };
  
  const handleFavoritePress = async () => {
    if (!matchData) return;
    
    try {
      const newFavoriteStatus = await toggleFavorite(matchData);
      setIsFavorite(newFavoriteStatus);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar os favoritos');
    }
  };
  
  useEffect(() => {
    fetchMatchData();
  }, [matchId]);
  
  // Componente de loading
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1e90ff" />
        <Text style={styles.loadingText}>Carregando detalhes...</Text>
      </View>
    );
  }
  
  // Componente de erro
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="error-outline" size={48} color="#ff5722" />
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={fetchMatchData}
          style={styles.retryButton}
        >
          Tentar Novamente
        </Button>
      </View>
    );
  }
  
  if (!matchData) {
    return (
      <View style={styles.centerContainer}>
        <Text>Dados da partida não encontrados</Text>
      </View>
    );
  }
  
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Card Principal da Partida */}
      <Card style={styles.mainCard}>
        <Card.Content>
          <View style={styles.headerSection}>
            <Title style={styles.matchTitle}>
              {`${matchData.homeTeam.name} × ${matchData.awayTeam.name}`}
            </Title>
            <Chip 
              mode="outlined" 
              style={[styles.statusChip, { 
                backgroundColor: matchData.status === 'FINISHED' ? '#4caf50' : '#ff9800' 
              }]}
            >
              {getStatusDisplay(matchData.status)}
            </Chip>
          </View>
          
          <Divider style={styles.divider} />
          
          {/* Placar */}
          <Surface style={styles.scoreSection}>
            <Text style={styles.scoreLabel}>Placar</Text>
            <Text style={styles.scoreText}>
              {matchData.score.fullTime.home ?? '-'} × {matchData.score.fullTime.away ?? '-'}
            </Text>
          </Surface>
        </Card.Content>
      </Card>
      
      {/* Card de Informações */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Informações da Partida</Title>
          
          <View style={styles.infoRow}>
            <Icon name="sports-soccer" size={20} color="#666" />
            <Text style={styles.infoLabel}>Competição:</Text>
            <Text style={styles.infoValue}>{matchData.competition.name}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Icon name="schedule" size={20} color="#666" />
            <Text style={styles.infoLabel}>Data:</Text>
            <Text style={styles.infoValue}>{formatDate}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Icon name="place" size={20} color="#666" />
            <Text style={styles.infoLabel}>Local:</Text>
            <Text style={styles.infoValue}>{matchData.venue || 'Não informado'}</Text>
          </View>
          
          {matchData.referee && (
            <View style={styles.infoRow}>
              <Icon name="person" size={20} color="#666" />
              <Text style={styles.infoLabel}>Árbitro:</Text>
              <Text style={styles.infoValue}>{matchData.referee}</Text>
            </View>
          )}
        </Card.Content>
      </Card>
      
      {/* Botão de Favoritos */}
      <Card style={styles.actionCard}>
        <Card.Actions style={styles.actionSection}>
          <Button 
            mode={isFavorite ? "outlined" : "contained"}
            onPress={handleFavoritePress}
            style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
            icon={({ color, size }) => (
              <Icon 
                name={isFavorite ? "favorite" : "favorite-border"} 
                size={size} 
                color={color} 
              />
            )}
          >
            {isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
          </Button>
        </Card.Actions>
      </Card>
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ff5722',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#1e90ff',
  },
  mainCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
  },
  infoCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  actionCard: {
    borderRadius: 12,
    elevation: 2,
    marginBottom: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1e90ff',
  },
  statusChip: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  scoreSection: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e90ff',
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 80,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
    color: '#333',
  },
  actionSection: {
    justifyContent: 'center',
    padding: 8,
  },
  favoriteButton: {
    backgroundColor: '#1e90ff',
    borderRadius: 8,
  },
  favoriteButtonActive: {
    borderColor: '#1e90ff',
    borderWidth: 2,
  },
});

export default MatchDetailsScreen;