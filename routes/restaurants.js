const express = require('express');
const router = express.Router();

// Sample restaurant data - In a real app, this would come from a database
const sampleRestaurants = [
  {
    id: 1,
    name: "Bella Vista Italian",
    imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=200&fit=crop&auto=format&q=80",
    cuisineTypes: ["Italian", "Mediterranean", "Fine Dining"],
    rating: 4.7,
    cuisine: "Italian",
    priceRange: "$$",
    deliveryTime: 30,
    isOpen: true,
    menu: [
      {
        id: 1,
        name: "Margherita Pizza",
        description: "Classic pizza with fresh mozzarella, tomatoes, and basil",
        price: 16.99,
        category: "Pizza",
        image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=300&h=200&fit=crop&auto=format&q=80",
        vegetarian: true
      },
      {
        id: 2,
        name: "Pepperoni Pizza",
        description: "Traditional pizza with pepperoni and mozzarella cheese",
        price: 18.99,
        category: "Pizza",
        image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=300&h=200&fit=crop&auto=format&q=80",
        vegetarian: false
      },
      {
        id: 3,
        name: "Chicken Alfredo Pasta",
        description: "Creamy fettuccine pasta with grilled chicken and parmesan",
        price: 22.99,
        category: "Pasta",
        image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=300&h=200&fit=crop&auto=format&q=80",
        vegetarian: false
      }
    ]
  },
  {
    id: 2,
    name: "Sakura Sushi Bar",
    imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=200&fit=crop&auto=format&q=80",
    cuisineTypes: ["Japanese", "Sushi", "Asian"],
    rating: 4.5,
    cuisine: "Japanese",
    priceRange: "$$$",
    deliveryTime: 25,
    isOpen: true,
    menu: [
      {
        id: 4,
        name: "California Roll",
        description: "Crab, avocado, and cucumber rolled in sushi rice and nori",
        price: 12.99,
        category: "Sushi Rolls",
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=300&h=200&fit=crop&auto=format&q=80",
        vegetarian: false
      },
      {
        id: 5,
        name: "Salmon Nigiri",
        description: "Fresh salmon over seasoned sushi rice (2 pieces)",
        price: 8.99,
        category: "Nigiri",
        image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=300&h=200&fit=crop&auto=format&q=80",
        vegetarian: false
      },
      {
        id: 6,
        name: "Chicken Teriyaki Bowl",
        description: "Grilled chicken with teriyaki sauce over steamed rice",
        price: 15.99,
        category: "Bowls",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop&auto=format&q=80",
        vegetarian: false
      }
    ]
  },
  {
    id: 3,
    name: "The Rustic Grill",
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=200&fit=crop&auto=format&q=80",
    cuisineTypes: ["American", "BBQ", "Steakhouse"],
    rating: 4.3,
    cuisine: "American",
    priceRange: "$$$",
    deliveryTime: 35,
    isOpen: true,
    menu: [
      {
        id: 7,
        name: "BBQ Ribs",
        description: "Slow-cooked pork ribs with house BBQ sauce",
        price: 28.99,
        category: "BBQ",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=300&h=200&fit=crop&auto=format&q=80",
        vegetarian: false
      },
      {
        id: 8,
        name: "Grilled Burger",
        description: "Angus beef patty with lettuce, tomato, and cheese",
        price: 16.99,
        category: "Burgers",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop&auto=format&q=80",
        vegetarian: false
      }
    ]
  }
];

// GET /api/restaurants - Get all restaurants
router.get('/', (req, res) => {
  try {
    const { cuisine, search, sortBy = 'rating', order = 'desc' } = req.query;
    
    let filteredRestaurants = [...sampleRestaurants];
    
    // Filter by cuisine
    if (cuisine && cuisine !== 'all') {
      filteredRestaurants = filteredRestaurants.filter(restaurant => 
        restaurant.cuisine.toLowerCase() === cuisine.toLowerCase() ||
        restaurant.cuisineTypes.some(type => 
          type.toLowerCase().includes(cuisine.toLowerCase())
        )
      );
    }
    
    // Search by name or cuisine
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredRestaurants = filteredRestaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchTerm) ||
        restaurant.cuisine.toLowerCase().includes(searchTerm) ||
        restaurant.cuisineTypes.some(type => 
          type.toLowerCase().includes(searchTerm)
        )
      );
    }
    
    // Sort restaurants
    filteredRestaurants.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'name') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    res.json({
      success: true,
      restaurants: filteredRestaurants,
      count: filteredRestaurants.length,
      filters: {
        cuisine: cuisine || 'all',
        search: search || '',
        sortBy,
        order
      }
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/restaurants/:id - Get specific restaurant with menu
router.get('/:id', (req, res) => {
  try {
    const restaurantId = parseInt(req.params.id);
    const restaurant = sampleRestaurants.find(r => r.id === restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    res.json({
      success: true,
      restaurant: restaurant
    });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/restaurants/:id/menu - Get restaurant menu
router.get('/:id/menu', (req, res) => {
  try {
    const restaurantId = parseInt(req.params.id);
    const restaurant = sampleRestaurants.find(r => r.id === restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    const { category, vegetarian } = req.query;
    let menu = restaurant.menu || [];
    
    // Filter by category
    if (category) {
      menu = menu.filter(item => 
        item.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Filter by vegetarian
    if (vegetarian === 'true') {
      menu = menu.filter(item => item.vegetarian === true);
    }
    
    // Group menu items by category
    const categories = [...new Set(restaurant.menu.map(item => item.category))];
    const menuByCategory = categories.reduce((acc, category) => {
      acc[category] = restaurant.menu.filter(item => item.category === category);
      return acc;
    }, {});
    
    res.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        rating: restaurant.rating,
        deliveryTime: restaurant.deliveryTime,
        priceRange: restaurant.priceRange
      },
      menu: menu,
      menuByCategory: menuByCategory,
      categories: categories,
      totalItems: restaurant.menu.length
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/restaurants/cuisines - Get available cuisines
router.get('/meta/cuisines', (req, res) => {
  try {
    const cuisines = [...new Set(sampleRestaurants.map(r => r.cuisine))];
    const cuisineTypes = [...new Set(sampleRestaurants.flatMap(r => r.cuisineTypes))];
    
    res.json({
      success: true,
      cuisines: cuisines,
      cuisineTypes: cuisineTypes,
      count: cuisines.length
    });
  } catch (error) {
    console.error('Error fetching cuisines:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
