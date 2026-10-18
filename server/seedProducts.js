
import 'dotenv/config'
import mongoose from 'mongoose'
import Product from './models/Product.js'

const categories = [
  {
    category: 'Dairy',
    unit: 'piece',
    products: [
      ['Milk 1 Liter', 290], ['Milk 500ml', 155],
      ['Chocolate Milk 250ml', 100], ['Butter 200g', 390],
      ['Cheddar Cheese 200g', 450], ['Yogurt 500g', 180],
      ['Cream 200ml', 220], ['Margarine 250g', 240],
      ['Flavored Yogurt', 120], ['Milk Powder 400g', 850],
    ],
  },
  {
    category: 'Beverages',
    unit: 'piece',
    products: [
      ['Cola Drink 1.5 Liter', 220], ['Orange Drink 1 Liter', 180],
      ['Lemon Soda 500ml', 100], ['Mineral Water 1.5 Liter', 100],
      ['Mineral Water 500ml', 50], ['Mango Juice 1 Liter', 250],
      ['Apple Juice 1 Liter', 240], ['Energy Drink 250ml', 180],
      ['Iced Tea 500ml', 160], ['Syrup 800ml', 350],
    ],
  },
  {
    category: 'Snacks',
    unit: 'pack',
    products: [
      ['Salted Chips Small', 50], ['Salted Chips Large', 150],
      ['Cheese Puffs', 80], ['Potato Sticks', 70],
      ['Salted Peanuts 100g', 120], ['Roasted Chickpeas 200g', 100],
      ['Popcorn Pack', 90], ['Crackers 200g', 130],
      ['Nachos 150g', 180], ['Mixed Nuts 100g', 280],
    ],
  },
  {
    category: 'Biscuits & Sweets',
    unit: 'pack',
    products: [
      ['Chocolate Biscuits', 100], ['Cream Biscuits', 80],
      ['Plain Biscuits', 60], ['Butter Cookies', 180],
      ['Wafer Chocolate', 50], ['Chocolate Bar', 120],
      ['Milk Chocolate 100g', 250], ['Toffees Pack', 100],
      ['Jelly Candies', 90], ['Lollipop Pack', 80],
    ],
  },
  {
    category: 'Fruits',
    unit: 'kg',
    products: [
      ['Apples', 300], ['Bananas', 180], ['Oranges', 220],
      ['Mangoes', 250], ['Grapes', 400], ['Guavas', 180],
      ['Pomegranates', 350], ['Pears', 320], ['Watermelon', 100],
      ['Lemons', 200],
    ],
  },
  {
    category: 'Vegetables',
    unit: 'kg',
    products: [
      ['Potatoes', 100], ['Onions', 120], ['Tomatoes', 150],
      ['Carrots', 130], ['Cucumbers', 100], ['Cabbage', 100],
      ['Cauliflower', 120], ['Spinach', 100], ['Green Chilies', 180],
      ['Bell Peppers', 250],
    ],
  },
  {
    category: 'Rice & Grains',
    unit: 'kg',
    products: [
      ['Basmati Rice', 350], ['White Rice', 250],
      ['Brown Rice', 320], ['Broken Rice', 180],
      ['Wheat Flour', 160], ['Maida Flour', 150],
      ['Chickpeas', 260], ['Red Lentils', 280],
      ['Black Lentils', 300], ['White Beans', 320],
    ],
  },
  {
    category: 'Spices & Cooking',
    unit: 'pack',
    products: [
      ['Red Chili Powder 100g', 120], ['Turmeric Powder 100g', 100],
      ['Cumin Seeds 100g', 180], ['Coriander Powder 100g', 100],
      ['Black Pepper 50g', 180], ['Garam Masala 50g', 150],
      ['Salt 800g', 80], ['Sugar 1kg', 180],
      ['Cooking Oil 1 Liter', 550], ['Vinegar 500ml', 150],
    ],
  },
  {
    category: 'Bakery',
    unit: 'piece',
    products: [
      ['White Bread', 150], ['Brown Bread', 180],
      ['Burger Buns Pack', 120], ['Rusk Pack', 180],
      ['Plain Cake', 250], ['Cupcakes Pack', 220],
      ['Croissant', 120], ['Donuts Pack', 250],
      ['Pita Bread Pack', 150], ['Pizza Base Pack', 200],
    ],
  },
  {
    category: 'Household',
    unit: 'piece',
    products: [
      ['Dishwashing Liquid 500ml', 250], ['Laundry Detergent 1kg', 450],
      ['Laundry Soap Bar', 100], ['Toilet Cleaner 500ml', 280],
      ['Floor Cleaner 1 Liter', 350], ['Tissue Box', 180],
      ['Kitchen Roll', 220], ['Garbage Bags Pack', 200],
      ['Sponge Pack', 100], ['Hand Wash 250ml', 220],
    ],
  },
]

async function seedProducts() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        'MONGODB_URI is missing. Check the server/.env file.'
      )
    }

    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB.')

    const seedProductsList = categories.flatMap((group) =>
      group.products.map(([name, price], index) => {
        const sequence = categories
          .slice(0, categories.indexOf(group))
          .reduce((total, item) => total + item.products.length, 0) +
          index + 1

        const costPrice = Number((price * 0.8).toFixed(2))

        return {
          name,
          barcode: `FMSEED${String(sequence).padStart(6, '0')}`,
          category: group.category,
          price,
          costPrice,
          stock: 10 + ((sequence * 7) % 91),
          unit: group.unit,
          lowStockThreshold: 10,
        }
      })
    )

    // Do not insert seed products whose barcode or name already exists.
    const names = seedProductsList.map((product) => product.name)
    const barcodes = seedProductsList.map((product) => product.barcode)

    const existingProducts = await Product.find({
      $or: [
        { name: { $in: names } },
        { barcode: { $in: barcodes } },
      ],
    })
      .select('name barcode')
      .lean()

    const existingNames = new Set(
      existingProducts.map((product) => product.name.toLowerCase())
    )
    const existingBarcodes = new Set(
      existingProducts.map((product) => product.barcode).filter(Boolean)
    )

    const newProducts = seedProductsList.filter(
      (product) =>
        !existingNames.has(product.name.toLowerCase()) &&
        !existingBarcodes.has(product.barcode)
    )

    if (newProducts.length === 0) {
      console.log('All seed products already exist. Nothing to add.')
      return
    }

    const inserted = await Product.insertMany(newProducts, {
      ordered: true,
    })

    console.log(`Successfully added ${inserted.length} products.`)
    console.log(`Skipped ${seedProductsList.length - newProducts.length} existing products.`)
    console.log('Open FreshMart and visit the Products page to check them.')
  } catch (error) {
    console.error('Product seeding failed:', error.message)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

seedProducts()
