
import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(
      process.env.MONGODB_URI,
      {
        serverSelectionTimeoutMS: 10000,
        family: 4,
      }
    )

    console.log(
      `MongoDB connected: ${connection.connection.host}`
    )
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    console.error('Error name:', error.name)

    if (error.reason?.servers) {
      for (const [address, server] of error.reason.servers) {
        console.error(`Server: ${address}`)
        console.error(`Server type: ${server.type}`)
        console.error(
          `Server error: ${server.error?.message || 'No specific error'}`
        )
      }
    }

    process.exit(1)
  }
}

export default connectDB
