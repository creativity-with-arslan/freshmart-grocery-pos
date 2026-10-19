
import mongoose from 'mongoose'

let connectionPromise

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        family: 4,
      })
      .then((connection) => {
        console.log(
          `MongoDB connected: ${connection.connection.host}`
        )
        return connection
      })
      .catch((error) => {
        connectionPromise = null
        console.error('MongoDB connection failed:', error.message)
        throw error
      })
  }

  return connectionPromise
}

export default connectDB
