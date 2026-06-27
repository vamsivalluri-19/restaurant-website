const mongoose = require('mongoose');

async function checkFoods() {
  try {
    await mongoose.connect('mongodb://localhost:27017/pakka-military-hotel');
    console.log('Connected to MongoDB');
    
    // Define schema inline
    const foodSchema = new mongoose.Schema({
      name: String,
      category: String,
      price: Number,
      image: String
    }, { collection: 'foods' });
    
    const Food = mongoose.model('Food', foodSchema);
    const foods = await Food.find({});
    
    console.log('--- FOOD ITEMS IN DB ---');
    foods.forEach(f => {
      console.log(`- ${f.name} (${f.category}): ${f.image}`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkFoods();
