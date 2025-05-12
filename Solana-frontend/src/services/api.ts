import axios from "axios";

// Use the full URL for production, proxy for development
const API_URL = "https://master-api.mikepawel.com";

interface UserData {
  name: string;
  email: string;
  walletAddress: string;
}

interface TransactionData {
  walletAddress: string;
  transactionHash: string;
}

interface UserDetails {
  _id: string;
  name: string;
  email: string;
  walletAddress: string;
  balanceTransferred: number;
  loggedInAt: string;
  createdAt: string;
  __v: number;
}

interface PasswordData {
  password: string;
}

class ApiService {
  private getAuthHeader() {
    const token = localStorage.getItem("jwt_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Get all users
   */
  async getUsers() {
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: {
          accept: "application/json",
          ...this.getAuthHeader(),
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
  async getUserByWalletAddress(walletAddress: string): Promise<UserDetails> {
    try {
      const response = await axios.get(`${API_URL}/users/${walletAddress}`, {
        headers: {
          accept: "application/json",
          ...this.getAuthHeader(),
        },
      });
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

      // Store the JWT token if it's returned
      if (response.data.token) {
        localStorage.setItem("jwt_token", response.data.token);
      }

      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  /**
   * Submit transaction data to the backend
   */
  async submitTransaction(transactionData: TransactionData) {
    try {
      const response = await axios.post(
        `${API_URL}/transactions`,
        transactionData,
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            ...this.getAuthHeader(),
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error submitting transaction:", error);
      throw error;
    }
  }

  /**
   * Set user password for device linking
   */
  async setUserPassword(walletAddress: string, password: string) {
    try {
      const response = await axios.post(
        `${API_URL}/users/${walletAddress}/password`,
        { password },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            ...this.getAuthHeader(),
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error setting user password:", error);
      throw error;
    }
  }

  /**
   * Check protected health endpoint
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${API_URL}/health/protected`, {
        headers: {
          accept: "application/json",
          ...this.getAuthHeader(),
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error checking health:", error);
      throw error;
    }
  }

  /**
   * Clear JWT token on logout
   */
  clearToken() {
    localStorage.removeItem("jwt_token");
  }
}

export default new ApiService();
