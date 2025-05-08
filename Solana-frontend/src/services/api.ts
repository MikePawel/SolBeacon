import axios from "axios";

// Use the full URL for production, proxy for development
const API_URL = "https://master-api.mikepawel.com";

interface UserData {
  name: string;
  email: string;
  walletAddress: string;
}

class ApiService {
  /**
   * Get all users
   */
  async getUsers() {
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: {
          accept: "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  /**
   * Get user by wallet address
   */
  async getUserByWalletAddress(walletAddress: string) {
    try {
      const response = await axios.get(
        `${API_URL}/users/wallet/${walletAddress}`,
        {
          headers: {
            accept: "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching user with wallet address ${walletAddress}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: UserData) {
    try {
      const response = await axios.post(`${API_URL}/users`, userData, {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
}

export default new ApiService();
