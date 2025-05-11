import Foundation

class PaymentService {
    struct Response: Codable {
        var status: String?
        var message: String?
    }
    
    func requestPayment(completion: @escaping (Result<Response, Error>) -> Void) {
        let urlString = "https://master-api.mikepawel.com/payment"
        
        guard let url = URL(string: urlString) else {
            completion(.failure(NSError(domain: "PaymentService", code: 400, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.addValue("application/json", forHTTPHeaderField: "accept")
        
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "PaymentService", code: 500, userInfo: [NSLocalizedDescriptionKey: "No data received"])))
                return
            }
            
            do {
                let decoder = JSONDecoder()
                let paymentResponse = try decoder.decode(Response.self, from: data)
                completion(.success(paymentResponse))
            } catch {
                // If we can't decode to our struct, return the raw data as string
                if let rawResponse = String(data: data, encoding: .utf8) {
                    let mockResponse = Response(status: "success", message: rawResponse)
                    completion(.success(mockResponse))
                } else {
                    completion(.failure(error))
                }
            }
        }
        
        task.resume()
    }
} 