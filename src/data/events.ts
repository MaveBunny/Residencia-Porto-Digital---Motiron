export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: "Workshop" | "Palestra" | "Networking" | "Conferência" | string;
  image: string;
  time: string;
  speaker: string;
  totalSpots: number;
  availableSpots: number;
  hours: number;
  isCanceled?: boolean;
  isConcluded?: boolean;
  registrationStatus?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
}

export interface Registration {
  activityId: string;
  status: "Confirmado" | "Pendente" | "Cancelado" | "Concluído";
  date: string;
  attendance?: "Pendente" | "Presente";
}

export interface Participant {
  id: string;
  userId: string;
  activityId: string;
  name: string;
  email: string;
  eventId: string;
  event: string;
  status: string;
  date: string;
  attendance?: "Pendente" | "Presente";
}

export const events: Event[] = [
  {
    id: "1",
    title: "Inovação Digital 2026",
    description: "Explorando as tendências que moldarão o futuro dos negócios digitais.",
    date: "15 de Mai",
    time: "09:00",
    location: "Auditório Central, São Paulo",
    category: "Conferência",
    image: "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=800",
    speaker: "Vários Palestrantes",
    totalSpots: 200,
    availableSpots: 15,
  },
  {
    id: "2",
    title: "Workshop de Liderança Criativa",
    description: "Desenvolva habilidades de liderança para o novo mercado corporativo.",
    date: "22 de Mai",
    time: "14:00",
    location: "Espaço Coworking, Rio de Janeiro",
    category: "Workshop",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800",
    speaker: "Maria Oliveira",
    totalSpots: 50,
    availableSpots: 0,
  },
  {
    id: "3",
    title: "Café com Networking",
    description: "Conecte-se com CEOs e diretores das maiores empresas da América Latina.",
    date: "05 de Jun",
    time: "08:30",
    location: "Hotel Fasano, Belo Horizonte",
    category: "Networking",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
    speaker: "Comunidade Executiva",
    totalSpots: 100,
    availableSpots: 42,
  },
  {
    id: "4",
    title: "Palestra: Futuro da IA",
    description: "Como a inteligência artificial está transformando a produtividade nas empresas.",
    date: "12 de Jun",
    time: "19:00",
    location: "Centro de Convenções, Curitiba",
    category: "Palestra",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
    speaker: "Dr. Carlos Santos",
    totalSpots: 300,
    availableSpots: 120,
  },
  {
    id: "5",
    title: "Senac Fashion Day",
    description: "Desfiles, tendências e o mercado da moda autoral em Pernambuco.",
    date: "20 de Jun",
    time: "10:30",
    location: "Teatro Senac, Recife",
    category: "Conferência",
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800",
    speaker: "Especialistas Senac",
    totalSpots: 150,
    availableSpots: 10,
  },
  {
    id: "6",
    title: "Mesa Redonda: Finanças 4.0",
    description: "O impacto do open banking e novos sistemas de pagamento.",
    date: "28 de Jun",
    time: "16:00",
    location: "Sala Executiva, Brasília",
    category: "Networking",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800",
    speaker: "Diretores Financeiros",
    totalSpots: 80,
    availableSpots: 5,
  }
];

export const api = {
  getActivities: async (): Promise<Event[]> => {
    const response = await fetch('/api/events');
    return response.json();
  },
  
  getActivityById: async (id: string): Promise<Event | undefined> => {
    const response = await fetch(`/api/events/${id}`);
    if (!response.ok) return undefined;
    return response.json();
  },

  getAllParticipants: async (): Promise<Participant[]> => {
    const response = await fetch('/api/registrations');
    return response.json();
  },

  getUserRegistrations: async (userId: string): Promise<Event[]> => {
    // Para simplificar, buscamos todos e filtramos ou criamos uma rota específica
    // Por enquanto, vamos buscar os eventos que o usuário está inscrito
    const response = await fetch(`/api/users/${userId}/agenda`);
    if (!response.ok) return [];
    return response.json();
  },

  getRawRegistrations: async (userId: string): Promise<Registration[]> => {
    const response = await fetch(`/api/users/${userId}/registrations`);
    if (!response.ok) return [];
    return response.json();
  },

  registerForActivity: async (userId: string, activityId: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, activityId }),
    });
    return response.json();
  },

  cancelRegistration: async (userId: string, activityId: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/registrations/${activityId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return response.json();
  },

  cancelEvent: async (eventId: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/events/${eventId}/cancel`, { method: 'POST' });
    return response.json();
  },

  finishEvent: async (eventId: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/events/${eventId}/finish`, { method: 'POST' });
    return response.json();
  },

  toggleAttendance: async (userId: string, activityId: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/registrations/attendance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, activityId }),
    });
    return response.json();
  },

  toggleRegistrationStatus: async (userId: string, activityId: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/registrations/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, activityId }),
    });
    return response.json();
  },

  addActivity: async (newEvent: Omit<Event, "id" | "availableSpots">): Promise<{ success: boolean; message: string; event?: Event }> => {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent),
    });
    return response.json();
  },

  editActivity: async (id: string, updatedData: Partial<Event>): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    });
    return response.json();
  },

  getUserById: async (id: string): Promise<{ nome: string; email: string; matricula: string }> => {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error('Usuário não encontrado');
    return response.json();
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await fetch('/api/categories');
    return response.json();
  },

  addCategory: async (category: Omit<Category, "id">): Promise<{ success: boolean; message: string; category?: Category }> => {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    return response.json();
  },

  deleteCategory: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    return response.json();
  }
};
