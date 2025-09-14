import logger from "@marketplace/logger"
import { FastifyReply, FastifyRequest } from "fastify"

export class ListingController {
  // Create vehicle listing
  createVehicle = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      return reply.code(201).send({
        success: true,
        data: { id: "placeholder", message: "Vehicle creation endpoint migrated to Fastify" },
        message: "Vehicle listing created successfully",
      })
    } catch (error) {
      logger.error("Create vehicle error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to create vehicle listing",
      })
    }
  }

  // Create product listing
  createProduct = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      return reply.code(201).send({
        success: true,
        data: { id: "placeholder", message: "Product creation endpoint migrated to Fastify" },
        message: "Product listing created successfully",
      })
    } catch (error) {
      logger.error("Create product error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to create product listing",
      })
    }
  }

  // Get all vehicles with filters
  getVehicles = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const mockVehicles = [
        {
          id: "v1",
          title: "Honda PCX 150 - Perfect for City Rides",
          description:
            "Well-maintained Honda PCX 150, perfect for navigating Bangkok traffic. Automatic transmission, fuel efficient.",
          vehicleType: "scooter",
          price: 800,
          currency: "THB",
          location: {
            province: "Bangkok",
            city: "Sukhumvit",
          },
          images: ["/api/placeholder-scooter.jpg"],
          status: "active",
          featured: true,
        },
        {
          id: "v2",
          title: "Toyota Camry - Comfortable Sedan",
          description: "Clean and reliable Toyota Camry for rent. Perfect for families or business trips.",
          vehicleType: "car",
          price: 1500,
          currency: "THB",
          location: {
            province: "Bangkok",
            city: "Silom",
          },
          images: ["/api/placeholder-car.jpg"],
          status: "active",
          featured: false,
        },
        {
          id: "v3",
          title: "Yamaha R15 - Sport Bike",
          description: "Yamaha R15 sport motorcycle for rent. Great for weekend trips.",
          vehicleType: "motorcycle",
          price: 1000,
          currency: "THB",
          location: {
            province: "Phuket",
            city: "Patong",
          },
          images: ["/api/placeholder-motorcycle.jpg"],
          status: "active",
          featured: false,
        },
      ]

      return reply.send({
        success: true,
        data: mockVehicles,
        message: "Vehicles retrieved successfully",
      })
    } catch (error) {
      logger.error("Get vehicles error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to retrieve vehicles",
      })
    }
  }

  // Get all products with filters
  getProducts = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const mockProducts = [
        {
          id: "p1",
          title: "iPhone 15 Pro - Like New",
          description: "iPhone 15 Pro in excellent condition. 256GB storage, all accessories included.",
          productType: "electronics",
          price: 1200,
          currency: "THB",
          location: {
            province: "Bangkok",
            city: "Thonglor",
          },
          images: ["/api/placeholder-phone.jpg"],
          status: "active",
          featured: false,
        },
        {
          id: "p2",
          title: "MacBook Pro M3 - For Digital Nomads",
          description: "Latest MacBook Pro with M3 chip. Perfect for remote work and content creation.",
          productType: "electronics",
          price: 2500,
          currency: "THB",
          location: {
            province: "Bangkok",
            city: "Asoke",
          },
          images: ["/api/placeholder-laptop.jpg"],
          status: "active",
          featured: true,
        },
        {
          id: "p3",
          title: "Canon EOS R5 - Professional Camera",
          description: "Professional camera for photography enthusiasts. Includes lenses and accessories.",
          productType: "electronics",
          price: 1800,
          currency: "THB",
          location: {
            province: "Chiang Mai",
            city: "Old City",
          },
          images: ["/api/placeholder-camera.jpg"],
          status: "active",
          featured: false,
        },
      ]

      return reply.send({
        success: true,
        data: mockProducts,
        message: "Products retrieved successfully",
      })
    } catch (error) {
      logger.error("Get products error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to retrieve products",
      })
    }
  }

  // Get vehicle by ID
  getVehicleById = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { id } = request.params as { id: string }

      return reply.send({
        success: true,
        data: { id, message: "Vehicle endpoint migrated to Fastify" },
        message: "Vehicle retrieved successfully (placeholder)",
      })
    } catch (error) {
      logger.error("Get vehicle by ID error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to retrieve vehicle",
      })
    }
  }

  // Get product by ID
  getProductById = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { id } = request.params as { id: string }

      return reply.send({
        success: true,
        data: { id, message: "Product endpoint migrated to Fastify" },
        message: "Product retrieved successfully (placeholder)",
      })
    } catch (error) {
      logger.error("Get product by ID error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to retrieve product",
      })
    }
  }

  // Update vehicle listing
  updateVehicle = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { id } = request.params as { id: string }

      return reply.send({
        success: true,
        data: { id, message: "Vehicle update endpoint migrated to Fastify" },
        message: "Vehicle listing updated successfully (placeholder)",
      })
    } catch (error) {
      logger.error("Update vehicle error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to update vehicle listing",
      })
    }
  }

  // Update product listing
  updateProduct = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { id } = request.params as { id: string }

      return reply.send({
        success: true,
        data: { id, message: "Product update endpoint migrated to Fastify" },
        message: "Product listing updated successfully (placeholder)",
      })
    } catch (error) {
      logger.error("Update product error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to update product listing",
      })
    }
  }

  // Delete vehicle listing
  deleteVehicle = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { id } = request.params as { id: string }

      return reply.send({
        success: true,
        message: "Vehicle listing deleted successfully (placeholder)",
      })
    } catch (error) {
      logger.error("Delete vehicle error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to delete vehicle listing",
      })
    }
  }

  // Delete product listing
  deleteProduct = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const { id } = request.params as { id: string }

      return reply.send({
        success: true,
        message: "Product listing deleted successfully (placeholder)",
      })
    } catch (error) {
      logger.error("Delete product error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to delete product listing",
      })
    }
  }

  // Search listings
  searchListings = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      return reply.send({
        success: true,
        data: [],
        message: "Search completed successfully (placeholder)",
      })
    } catch (error) {
      logger.error("Search listings error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to search listings",
      })
    }
  }

  // Get all listings (vehicles and products combined)
  getAllListings = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const query = request.query as { page?: string; limit?: string; category?: string }
      const page = Number.parseInt(query.page || "1", 10)
      const limit = Number.parseInt(query.limit || "12", 10)

      // Comprehensive test data for all categories
      const mockListings = [
        // TRANSPORTATION CATEGORY
        {
          id: "1",
          title: "Honda PCX 150 - Perfect for City Rides",
          description:
            "Well-maintained Honda PCX 150, perfect for navigating Bangkok traffic. Automatic transmission, fuel efficient.",
          category: "transportation",
          type: "rental",
          price: 800,
          currency: "THB",
          location: {
            province: "Bangkok",
            city: "Sukhumvit",
            address: "Sukhumvit Road, Bangkok",
          },
          images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"],
          status: "active",
          featured: true,
          rating: 4.8,
          reviewCount: 24,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Toyota Camry - Comfortable Sedan",
          description:
            "Clean and reliable Toyota Camry for rent. Perfect for families or business trips. Air conditioning, GPS included.",
          category: "transportation",
          type: "rental",
          price: 1500,
          currency: "THB",
          location: {
            province: "Bangkok",
            city: "Silom",
            address: "Silom Road, Bangkok",
          },
          images: ["https://images.unsplash.com/photo-1549924231-f129b911e442?w=400"],
          status: "active",
          featured: false,
          rating: 4.5,
          reviewCount: 18,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "7",
          title: "Yamaha R15 - Sport Bike",
          description: "Yamaha R15 sport motorcycle for rent. Great for weekend trips and exploring Thailand.",
          category: "transportation",
          type: "rental",
          price: 1000,
          currency: "THB",
          location: {
            province: "Phuket",
            city: "Patong",
            address: "Patong Beach, Phuket",
          },
          images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"],
          status: "active",
          featured: false,
          rating: 4.4,
          reviewCount: 15,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "8",
          title: "Mountain Bike - Trek Explorer",
          description: "High-quality Trek mountain bike perfect for exploring Chiang Mai's trails and city streets.",
          category: "transportation",
          type: "rental",
          price: 300,
          currency: "THB",
          location: {
            province: "Chiang Mai",
            city: "Old City",
            address: "Old City, Chiang Mai",
          },
          images: ["https://images.unsplash.com/photo-1544191696-15693072e0b5?w=400"],
          status: "active",
          featured: true,
          rating: 4.7,
          reviewCount: 32,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "3",
          title: "Visa Assistance Service",
          description:
            "Professional visa assistance for tourists and expats. We help with tourist visas, education visas, and work permits.",
          category: "services",
          type: "service",
          price: 2500,
          currency: "THB",
          location: {
            province: "Bangkok",
            city: "Asoke",
            address: "Asoke, Bangkok",
          },
          images: ["https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400"],
          status: "active",
          featured: true,
          rating: 4.9,
          reviewCount: 35,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "4",
          title: "iPhone 15 Pro - Like New",
          description:
            "iPhone 15 Pro in excellent condition. 256GB storage, all accessories included. Perfect for digital nomads.",
          category: "products",
          type: "rental",
          price: 1200,
          currency: "THB",
          location: {
            province: "Bangkok",
            city: "Thonglor",
            address: "Thonglor, Bangkok",
          },
          images: ["https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400"],
          status: "active",
          featured: false,
          rating: 4.7,
          reviewCount: 12,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "5",
          title: "Condo in Sukhumvit - Modern 1BR",
          description: "Modern 1-bedroom condo in prime Sukhumvit location. Fully furnished, pool, gym, BTS nearby.",
          category: "vehicles",
          type: "rental",
          price: 25000,
          currency: "THB",
          location: {
            province: "Bangkok",
            city: "Sukhumvit",
            address: "Sukhumvit 21, Bangkok",
          },
          images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400"],
          status: "active",
          featured: true,
          rating: 4.6,
          reviewCount: 28,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },

        // TOURS CATEGORY
        {
          id: "9",
          title: "Bangkok Temple Tour - Half Day",
          description:
            "Explore Bangkok's most famous temples including Wat Pho, Wat Arun, and Grand Palace with expert guide.",
          category: "tours",
          type: "service",
          price: 1800,
          currency: "THB",
          location: {
            province: "Bangkok",
            city: "Old City",
            address: "Grand Palace, Bangkok",
          },
          images: ["https://images.unsplash.com/photo-1563492065-1a83e8c6b8d8?w=400"],
          status: "active",
          featured: true,
          rating: 4.9,
          reviewCount: 156,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "10",
          title: "Elephant Sanctuary Experience",
          description:
            "Ethical elephant sanctuary visit in Chiang Mai. Feed, bathe, and learn about elephant conservation.",
          category: "tours",
          type: "service",
          price: 2500,
          currency: "THB",
          location: {
            province: "Chiang Mai",
            city: "Mae Taeng",
            address: "Mae Taeng District, Chiang Mai",
          },
          images: ["https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400"],
          status: "active",
          featured: true,
          rating: 4.8,
          reviewCount: 89,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "11",
          title: "Phi Phi Islands Day Trip",
          description:
            "Full day speedboat tour to Phi Phi Islands from Phuket. Snorkeling, lunch, and Maya Bay visit included.",
          category: "tours",
          type: "service",
          price: 3200,
          currency: "THB",
          location: {
            province: "Phuket",
            city: "Patong",
            address: "Patong Beach, Phuket",
          },
          images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"],
          status: "active",
          featured: false,
          rating: 4.6,
          reviewCount: 234,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },

        // SERVICES CATEGORY
        {
          id: "12",
          title: "Professional House Cleaning",
          description:
            "Deep cleaning service for apartments and houses. Experienced team, eco-friendly products, flexible scheduling.",
          category: "services",
          type: "service",
          price: 1500,
          currency: "THB",
          location: {
            province: "Bangkok",
            city: "Sukhumvit",
            address: "Sukhumvit Area, Bangkok",
          },
          images: ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400"],
          status: "active",
          featured: true,
          rating: 4.7,
          reviewCount: 67,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "13",
          title: "English Tutoring - Native Speaker",
          description:
            "Professional English tutoring by certified native speaker. Business English, conversation, exam prep available.",
          category: "services",
          type: "service",
          price: 800,
          currency: "THB",
          location: {
            province: "Bangkok",
            city: "Asoke",
            address: "Asoke, Bangkok",
          },
          images: ["https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400"],
          status: "active",
          featured: false,
          rating: 4.9,
          reviewCount: 45,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },

        // VEHICLES CATEGORY (Long-term rentals/properties)
        {
          id: "14",
          title: "Modern Condo - Sukhumvit 21",
          description:
            "Fully furnished 1-bedroom condo in prime Sukhumvit location. Pool, gym, BTS nearby. Monthly rental.",
          category: "vehicles",
          type: "rental",
          price: 25000,
          currency: "THB",
          location: {
            province: "Bangkok",
            city: "Sukhumvit",
            address: "Sukhumvit 21, Bangkok",
          },
          images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400"],
          status: "active",
          featured: true,
          rating: 4.6,
          reviewCount: 28,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "15",
          title: "Toyota Vios - Long Term Lease",
          description:
            "Toyota Vios for long-term lease (6+ months). Insurance, maintenance included. Perfect for expats.",
          category: "vehicles",
          type: "rental",
          price: 18000,
          currency: "THB",
          location: {
            province: "Bangkok",
            city: "Silom",
            address: "Silom, Bangkok",
          },
          images: ["https://images.unsplash.com/photo-1549924231-f129b911e442?w=400"],
          status: "active",
          featured: false,
          rating: 4.4,
          reviewCount: 12,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },

        // PRODUCTS CATEGORY
        {
          id: "16",
          title: "MacBook Pro M2 - Like New",
          description: "MacBook Pro M2 14-inch in excellent condition. Perfect for digital nomads and remote work.",
          category: "products",
          type: "rental",
          price: 2500,
          currency: "THB",
          location: {
            province: "Bangkok",
            city: "Thonglor",
            address: "Thonglor, Bangkok",
          },
          images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400"],
          status: "active",
          featured: true,
          rating: 4.8,
          reviewCount: 23,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "17",
          title: "Canon EOS R5 Camera Kit",
          description:
            "Professional camera kit with lenses for photography enthusiasts. Weekly and monthly rates available.",
          category: "products",
          type: "rental",
          price: 3500,
          currency: "THB",
          location: {
            province: "Bangkok",
            city: "Siam",
            address: "Siam, Bangkok",
          },
          images: ["https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400"],
          status: "active",
          featured: false,
          rating: 4.7,
          reviewCount: 18,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      // Filter by category if specified
      let filteredListings = mockListings
      if (query.category) {
        filteredListings = mockListings.filter((listing) => listing.category === query.category)
      }

      // Pagination
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedListings = filteredListings.slice(startIndex, endIndex)

      return reply.send({
        success: true,
        data: {
          listings: paginatedListings,
          pagination: {
            page,
            limit,
            total: filteredListings.length,
            totalPages: Math.ceil(filteredListings.length / limit),
          },
        },
        message: "All listings retrieved successfully",
      })
    } catch (error) {
      logger.error("Get all listings error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to retrieve listings",
      })
    }
  }

  // Get featured listings
  getFeaturedListings = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      return reply.send({
        success: true,
        data: [],
        message: "Featured listings retrieved successfully (placeholder)",
      })
    } catch (error) {
      logger.error("Get featured listings error:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to retrieve featured listings",
      })
    }
  }
}
