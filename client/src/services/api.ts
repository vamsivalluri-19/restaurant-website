const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

// AI Smart recommendation logic based on items in cart or user profile
export const getAIRecommendations = (cartItems: any[]) => {
  const categories = cartItems.map(item => item.category);
  const itemsInCart = cartItems.map(item => item.name);

  // Recommendations mapping
  if (itemsInCart.includes('Mutton Biryani') || itemsInCart.includes('Chicken Dum Biryani')) {
    return [
      { foodId: 'f14', name: 'Mutton Soup', price: 179, description: 'Bone-marrow extract soup, spiced with black pepper. Perfect starter!', category: 'Mutton', isVeg: false, image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80' },
      { foodId: 'f32', name: 'Apricot Delight', price: 160, description: 'Classic custard dessert served over sweet apricot compote.', category: 'Desserts', isVeg: true, image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80' }
    ];
  }

  if (categories.includes('Chicken') && !itemsInCart.includes('Coca Cola') && !itemsInCart.includes('Thums Up')) {
    return [
      { foodId: 'f22', name: 'Thums Up', price: 40, description: 'Strong, spicy Indian carbonated cola 250ml.', category: 'Cool Drinks', isVeg: true, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80' },
      { foodId: 'f30', name: 'Gulab Jamun', price: 80, description: 'Warm fried milk balls soaked in sweet cardamom sugar syrup.', category: 'Desserts', isVeg: true, image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80' }
    ];
  }

  // Default recommendations
  return [
    { foodId: 'f15', name: 'Special Chicken Biryani', price: 389, description: 'Flavourful rice topped with boneless cashew chicken fry.', category: 'Biryanis', isVeg: false, image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80' },
    { foodId: 'f29', name: 'Double Ka Meetha', price: 120, description: 'Traditional Hyderabadi bread pudding sweetened with saffron milk.', category: 'Desserts', isVeg: true, image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80' }
  ];
};
