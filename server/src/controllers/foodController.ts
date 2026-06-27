import { Request, Response } from 'express';
import { isMockDB, foodsList, FoodType, getFoodImage } from '../utils/mockDbStore';
import { Food } from '../models/Food';

export const getFoods = async (req: Request, res: Response) => {
  try {
    if (isMockDB) {
      const foodsWithImages = foodsList.map(food => {
        if (!food.image || food.image.startsWith('/assets/')) {
          return { ...food, image: getFoodImage(food.name) };
        }
        return food;
      });
      return res.json(foodsWithImages);
    } else {
      const foods = await Food.find();
      const foodsWithImages = foods.map(food => {
        const foodObj = food.toObject();
        if (!foodObj.image || foodObj.image.startsWith('/assets/')) {
          foodObj.image = getFoodImage(foodObj.name);
        }
        return foodObj;
      });
      return res.json(foodsWithImages);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const createFood = async (req: Request, res: Response) => {
  try {
    const { name, description, category, price, discount, preparationTime, isVeg, image } = req.body;

    const resolvedImage = image && !image.startsWith('/assets/') ? image : getFoodImage(name);

    if (isMockDB) {
      const newFood: FoodType = {
        _id: 'f' + (foodsList.length + 1),
        name,
        description,
        category,
        price: Number(price),
        discount: Number(discount || 0),
        preparationTime: Number(preparationTime),
        rating: 5.0,
        reviewsCount: 0,
        isVeg: !!isVeg,
        isAvailable: true,
        image: resolvedImage
      };
      foodsList.push(newFood);
      return res.status(201).json(newFood);
    } else {
      const newFood = new Food({
        name,
        description,
        category,
        price: Number(price),
        discount: Number(discount || 0),
        preparationTime: Number(preparationTime),
        isVeg: !!isVeg,
        image: resolvedImage
      });
      await newFood.save();
      return res.status(201).json(newFood);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateFood = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (isMockDB) {
      const index = foodsList.findIndex((f) => f._id === id);
      if (index === -1) {
        return res.status(404).json({ message: 'Food item not found' });
      }
      foodsList[index] = { ...foodsList[index], ...updateData };
      return res.json(foodsList[index]);
    } else {
      const updated = await Food.findByIdAndUpdate(id, updateData, { new: true });
      if (!updated) {
        return res.status(404).json({ message: 'Food item not found' });
      }
      return res.json(updated);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteFood = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isMockDB) {
      const index = foodsList.findIndex((f) => f._id === id);
      if (index === -1) {
        return res.status(404).json({ message: 'Food item not found' });
      }
      foodsList.splice(index, 1);
      return res.json({ message: 'Food item deleted successfully' });
    } else {
      const deleted = await Food.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Food item not found' });
      }
      return res.json({ message: 'Food item deleted successfully' });
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
