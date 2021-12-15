// begin non-navigation types

export interface PoolSearchQuery {
  time: string;
  startPoint: string;
  endPoint: string; 
}

export interface Pool {
  id: string;
  title: string;
  time: string;
  startPoint: string;
  endPoint: string;
}

export interface PoolDetails {
  id: string;
  startPoint: string;
  endPoint: string;
  startCoords: {
    latitude: number;
    longitude: number;
  };
  endCoords: {
    latitude: number;
    longitude: number;
  };
  time: string;
  estimatedCost: string;
  availableSeats: number;
  description: string;
}

export interface AvailableChat {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  profilePicture: string;
}

export interface Account {
  id: string;
}