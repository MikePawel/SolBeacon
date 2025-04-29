import axios from "axios";

// Use the Vite proxy path instead of the direct URL
const API_URL = "/api";

/**
 * API service for making HTTP requests to the backend
 */
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
}

export default new ApiService();
