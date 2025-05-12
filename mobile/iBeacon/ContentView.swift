//
//  ContentView.swift
//  iBeacon
//
//  Created by MikePawel
//

import SwiftUI
import CoreLocation
import CoreBluetooth
import UserNotifications
import Foundation
import Security

// Add KeychainManager class
class KeychainManager {
    static let shared = KeychainManager()
    private let service = "com.mikepawel.ibeacon"
    private let account = "userToken"
    
    private init() {}
    
    func saveToken(_ token: String) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: token.data(using: .utf8)!
        ]
        
        // First try to delete any existing token
        SecItemDelete(query as CFDictionary)
        
        // Add the new token
        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }
    
    func getToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            return nil
        }
        
        return token
    }
    
    func deleteToken() -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess
    }
}

struct ContentView: View {
    @StateObject private var beaconDetector = BeaconDetector()
    @Environment(\.colorScheme) var colorScheme
    @State private var showCopiedMessage = false
    @State private var showEditDeviceIDSheet = false
    @State private var customDeviceID = ""
    @State private var email = ""
    @State private var password = ""
    @State private var loginResponse: String? = nil
    @State private var isLoggedIn = false
    @State private var showTransactionConfirmation = false
    @State private var showSuccessAnimation = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 25) {
                    // Status card
                    VStack(spacing: 15) {

                        
                        HStack {
                            
                            Image(systemName: beaconDetector.isBeaconDetected ? "location.fill" : "location.slash")
                                .font(.system(size: 36))
                                .foregroundColor(beaconDetector.isBeaconDetected ? .blue : .gray)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(beaconDetector.isBeaconDetected ? "Beacon Detected" : "No Beacon Detected")
                                    .font(.headline)
                                    .foregroundColor(beaconDetector.isBeaconDetected ? .primary : .secondary)
                                
                                Text(beaconDetector.isBeaconDetected 
                                    ? "Distance: \(beaconDetector.proximityString)"
                                    : "No beacon in range")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                            
                            Circle()
                                .fill(beaconDetector.isBeaconDetected ? Color.green : Color.gray.opacity(0.3))
                                .frame(width: 12, height: 12)
                        }
                        .padding()
                        
                        if beaconDetector.isBeaconDetected {
                            // Proximity indicator
                            VStack(spacing: 8) {
                                Text("Signal Strength")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                
                                HStack(spacing: 2) {
                                    ForEach(0..<5) { i in
                                        RoundedRectangle(cornerRadius: 2)
                                            .fill(getBarColor(for: i, proximity: beaconDetector.proximityString))
                                            .frame(width: 8, height: 15 + CGFloat(i * 5))
                                    }
                                }
                                .padding(.horizontal)
                            }
                            .padding(.bottom, 10)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color(.systemBackground))
                            .shadow(color: Color(.systemGray4).opacity(0.2), radius: 10, x: 0, y: 2)
                    )
                    .padding(.horizontal)

                     // Login Form
                    if !isLoggedIn {
                        VStack(alignment: .leading, spacing: 15) {
                            Text("Link Device")
                                .font(.headline)
                                .padding(.top, 5)
                            
                            Divider()
                            
                            TextField("Email", text: $email)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .autocapitalization(.none)
                                .keyboardType(.emailAddress)
                            
                            SecureField("Password", text: $password)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                            
                            Button(action: {
                                login()
                            }) {
                                Text("Link Device")
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.blue)
                                    .cornerRadius(8)
                            }
                            
                            if let loginResponse = loginResponse {
                                Text(loginResponse)
                                    .foregroundColor(.secondary)
                                    .font(.caption)
                            }
                        }
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(
                            RoundedRectangle(cornerRadius: 16)
                                .fill(Color(.systemBackground))
                                .shadow(color: Color(.systemGray4).opacity(0.2), radius: 10, x: 0, y: 2)
                        )
                        .padding(.horizontal)
                    }
                    
                    // Enhanced Transaction Status Card
                    VStack(alignment: .leading, spacing: 15) {
                        HStack {
                            Image(systemName: "creditcard.circle.fill")
                                .font(.system(size: 24))
                                .foregroundColor(.blue)
                            
                            Text("Transaction Status")
                                .font(.headline)
                                .padding(.top, 5)
                            
                            Spacer()
                            
                            if beaconDetector.processingTransaction {
                                // Processing indicator
                                HStack(spacing: 5) {
                                    Circle()
                                        .fill(Color.green)
                                        .frame(width: 8, height: 8)
                                        .opacity(0.6)
                                    Circle()
                                        .fill(Color.green)
                                        .frame(width: 8, height: 8)
                                        .opacity(0.8)
                                    Circle()
                                        .fill(Color.green)
                                        .frame(width: 8, height: 8)
                                        .opacity(1.0)
                                }
                                .padding(.horizontal, 5)
                                .padding(.vertical, 3)
                                .background(Color.green.opacity(0.1))
                                .cornerRadius(10)
                            } else if beaconDetector.pendingTransaction {
                                // Pulsing notification indicator
                                Circle()
                                    .fill(Color.orange)
                                    .frame(width: 12, height: 12)
                                    .overlay(
                                        Circle()
                                            .stroke(Color.orange.opacity(0.5), lineWidth: 4)
                                            .scaleEffect(1.3)
                                    )
                            }
                        }
                        
                        Divider()
                        
                        if beaconDetector.pendingTransaction {
                            // Pending transaction card
                            VStack(alignment: .leading, spacing: 12) {
                                HStack(spacing: 15) {
                                    Image(systemName: "bell.badge.fill")
                                        .font(.system(size: 28))
                                        .foregroundColor(.orange)
                                    
                                    VStack(alignment: .leading, spacing: 5) {
                                        Text("Transaction Waiting")
                                            .font(.headline)
                                            .foregroundColor(.primary)
                                        
                                        Text("Beacon detected nearby")
                                            .font(.subheadline)
                                            .foregroundColor(.secondary)
                                    }
                                    
                                    Spacer()
                                }
                                
                                // Timeline component
                                if let transactionStatus = beaconDetector.transactionStatus {
                                    VStack(spacing: 0) {
                                        ForEach(0..<transactionStatus.count, id: \.self) { index in
                                            HStack(alignment: .top, spacing: 15) {
                                                // Timeline node
                                                VStack(spacing: 0) {
                                                    Circle()
                                                        .fill(getStatusColor(for: transactionStatus[index]))
                                                        .frame(width: 12, height: 12)
                                                    
                                                    if index < transactionStatus.count - 1 {
                                                        Rectangle()
                                                            .fill(Color.gray.opacity(0.3))
                                                            .frame(width: 2)
                                                            .frame(height: 30)
                                                    }
                                                }
                                                
                                                VStack(alignment: .leading, spacing: 4) {
                                                    Text(transactionStatus[index])
                                                        .font(.subheadline)
                                                        .foregroundColor(.primary)
                                                    
                                                    if index == 0 {
                                                        Text("Beacon in \(beaconDetector.proximityString) range")
                                                            .font(.caption)
                                                            .foregroundColor(.secondary)
                                                    }
                                                }
                                                
                                                Spacer()
                                            }
                                        }
                                    }
                                    .padding(.leading, 4)
                                    .padding(.top, 5)
                                }
                            }
                            .padding()
                            .background(Color(.systemGray6).opacity(0.5))
                            .cornerRadius(12)
                            .onAppear {
                                showTransactionConfirmation = true
                            }
                        } else if beaconDetector.transactionStatus != nil && !beaconDetector.transactionStatus!.isEmpty {
                            // Transaction history - processed transactions
                            VStack(alignment: .leading, spacing: 5) {
                                Text("Recent Activity")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                    .padding(.bottom, 5)
                                
                                // Timeline component
                                VStack(spacing: 0) {
                                    ForEach(0..<min(beaconDetector.transactionStatus!.count, 5), id: \.self) { index in
                                        HStack(alignment: .top, spacing: 15) {
                                            // Timeline node
                                            VStack(spacing: 0) {
                                                Circle()
                                                    .fill(getStatusColor(for: beaconDetector.transactionStatus![index]))
                                                    .frame(width: 10, height: 10)
                                                
                                                if index < min(beaconDetector.transactionStatus!.count, 5) - 1 {
                                                    Rectangle()
                                                        .fill(Color.gray.opacity(0.2))
                                                        .frame(width: 2)
                                                        .frame(height: 25)
                                                }
                                            }
                                            
                                            VStack(alignment: .leading, spacing: 4) {
                                                Text(beaconDetector.transactionStatus![index])
                                                    .font(.subheadline)
                                                    .foregroundColor(.primary)
                                                
                                                if index == beaconDetector.transactionStatus!.count - 1 && 
                                                   (beaconDetector.transactionStatus![index].contains("Complete") || 
                                                    beaconDetector.transactionStatus![index].contains("Failed") ||
                                                    beaconDetector.transactionStatus![index].contains("Cancelled")) {
                                                    Text(beaconDetector.lastPaymentResponse ?? "")
                                                        .font(.caption)
                                                        .foregroundColor(.secondary)
                                                        .lineLimit(2)
                                                }
                                            }
                                            
                                            Spacer()
                                            
                                            // Show an icon for the final status
                                            if index == beaconDetector.transactionStatus!.count - 1 {
                                                Image(systemName: getStatusFinalIcon(for: beaconDetector.transactionStatus![index]))
                                                    .foregroundColor(getStatusColor(for: beaconDetector.transactionStatus![index]))
                                            }
                                        }
                                        .padding(.vertical, 5)
                                    }
                                }
                                .padding(.leading, 4)
                            }
                            .padding()
                            .background(Color(.systemGray6).opacity(0.5))
                            .cornerRadius(12)
                        } else {
                            // No transaction state
                            HStack {
                                Spacer()
                                
                                VStack(spacing: 10) {
                                    Image(systemName: "creditcard.viewfinder")
                                        .font(.system(size: 40))
                                        .foregroundColor(.gray.opacity(0.7))
                                    
                                    Text("No Recent Transactions")
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                    
                                    Text("Transactions will appear here when a beacon is detected")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                        .multilineTextAlignment(.center)
                                }
                                .padding(.vertical, 25)
                                
                                Spacer()
                            }
                        }
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color(.systemBackground))
                            .shadow(color: Color(.systemGray4).opacity(0.2), radius: 10, x: 0, y: 2)
                    )
                    .padding(.horizontal)
                

                   
                    
                    // Auth warning if needed
                    if beaconDetector.authorizationStatus != "Authorized Always" {
                        VStack(spacing: 10) {
                            HStack {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .foregroundColor(.orange)
                                Text("Location Authorization Required")
                                    .font(.headline)
                                    .foregroundColor(.primary)
                            }
                            
                            Text("Please enable 'Always' location access in Settings to monitor beacons in background")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                            
                            Button(action: {
                                if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
                                    UIApplication.shared.open(settingsUrl)
                                }
                            }) {
                                Text("Open Settings")
                                    .font(.subheadline)
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 20)
                                    .padding(.vertical, 8)
                                    .background(Color.blue)
                                    .cornerRadius(8)
                            }
                            .padding(.top, 5)
                        }
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(
                            RoundedRectangle(cornerRadius: 16)
                                .fill(Color(.systemGray6))
                        )
                        .padding(.horizontal)
                    }
                    
                    Spacer(minLength: 20)
                }
                .padding(.top)
            }
            .navigationTitle("iBeacon Monitor")
            .preferredColorScheme(.light) // Force light mode
            .sheet(isPresented: $showEditDeviceIDSheet) {
                VStack(spacing: 20) {
                    Text("Custom Device Identifier")
                        .font(.headline)
                    
                    Text("Edit only if instructed by deployment team")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    TextField("Device ID", text: $customDeviceID)
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                        .padding(.horizontal)
                    
                    HStack {
                        Button("Cancel") {
                            showEditDeviceIDSheet = false
                        }
                        .padding()
                        
                        Spacer()
                        
                        Button("Reset to Default") {
                            beaconDetector.resetToDefaultIdentifier()
                            showEditDeviceIDSheet = false
                        }
                        .padding()
                        .foregroundColor(.red)
                        
                        Spacer()
                        
                        Button("Save") {
                            if !customDeviceID.isEmpty {
                                beaconDetector.updateDeviceIdentifier(customDeviceID)
                            }
                            showEditDeviceIDSheet = false
                        }
                        .padding()
                        .foregroundColor(.white)
                        .background(Color.blue)
                        .cornerRadius(8)
                    }
                }
                .padding()
            }
            .sheet(isPresented: $showTransactionConfirmation) {
                TransactionConfirmationView(
                    isPresented: $showTransactionConfirmation,
                    beaconDetector: beaconDetector
                )
            }
        }
        .onAppear {
            // Check if user is already logged in
            isLoggedIn = KeychainManager.shared.getToken() != nil
            
            // Set up notification observer for transaction completion
            NotificationCenter.default.addObserver(
                forName: NSNotification.Name("TransactionCompleted"),
                object: nil,
                queue: .main
            ) { notification in
                if let userInfo = notification.userInfo,
                   let success = userInfo["success"] as? Bool,
                   success {
                    withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) {
                        self.showSuccessAnimation = true
                    }
                }
            }
        }
        .onDisappear {
            // Remove notification observer
            NotificationCenter.default.removeObserver(self)
        }
        .overlay(
            Group {
                if showSuccessAnimation {
                    ZStack {
                        Color.black.opacity(0.4)
                            .edgesIgnoringSafeArea(.all)
                            .onTapGesture {
                                withAnimation {
                                    showSuccessAnimation = false
                                }
                            }
                        
                        VStack(spacing: 20) {
                            Circle()
                                .fill(Color.green)
                                .frame(width: 80, height: 80)
                                .overlay(
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 40, weight: .bold))
                                        .foregroundColor(.white)
                                )
                                .scaleEffect(showSuccessAnimation ? 1.0 : 0.1)
                                .opacity(showSuccessAnimation ? 1.0 : 0.0)
                            
                            Text("Transaction Complete")
                                .font(.title3)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .padding(.top, 10)
                                .opacity(showSuccessAnimation ? 1.0 : 0.0)
                                .scaleEffect(showSuccessAnimation ? 1.0 : 0.7)
                            
                            Text(beaconDetector.lastPaymentResponse ?? "Payment processed successfully")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.9))
                                .multilineTextAlignment(.center)
                                .padding(.horizontal)
                                .opacity(showSuccessAnimation ? 1.0 : 0.0)
                                .offset(y: showSuccessAnimation ? 0 : 20)
                            
                            Button(action: {
                                withAnimation {
                                    showSuccessAnimation = false
                                }
                            }) {
                                Text("Dismiss")
                                    .fontWeight(.medium)
                                    .padding(.horizontal, 30)
                                    .padding(.vertical, 12)
                                    .background(Color.white)
                                    .foregroundColor(.green)
                                    .cornerRadius(30)
                            }
                            .padding(.top, 20)
                            .opacity(showSuccessAnimation ? 1.0 : 0.0)
                            .offset(y: showSuccessAnimation ? 0 : 50)
                        }
                        .padding(40)
                        .background(
                            RoundedRectangle(cornerRadius: 25)
                                .fill(Color.green.opacity(0.2))
                                .background(
                                    VisualEffectView(effect: UIBlurEffect(style: .systemUltraThinMaterialDark))
                                        .cornerRadius(25)
                                )
                        )
                        .scaleEffect(showSuccessAnimation ? 1.0 : 0.7)
                    }
                    .transition(.opacity)
                }
            }
        )
    }
    
    private func getBarColor(for index: Int, proximity: String) -> Color {
        let isActive: Bool
        
        switch proximity {
        case "Immediate":
            isActive = true
        case "Near":
            isActive = index < 3
        case "Far":
            isActive = index < 1
        default:
            isActive = false
        }
        
        return isActive ? .blue : Color(.systemGray5)
    }
    
    private func getStatusIcon(for status: String) -> String {
        if status.contains("Detected") {
            return "sensor.tag.radiowaves.forward.fill"
        } else if status.contains("Sending") {
            return "arrow.up.circle"
        } else if status.contains("Complete") {
            return "checkmark.circle.fill"
        } else if status.contains("Failed") {
            return "xmark.circle.fill"
        } else {
            return "circle"
        }
    }
    
    private func getStatusColor(for status: String) -> Color {
        if status.contains("Detected") {
            return .blue
        } else if status.contains("Sending") {
            return .orange
        } else if status.contains("Complete") {
            return .green
        } else if status.contains("Failed") {
            return .red
        } else {
            return .gray
        }
    }
    
    private func login() {
        guard let url = URL(string: "https://master-api.mikepawel.com/users/login") else {
            loginResponse = "Invalid URL"
            return
        }
        
        let loginData = ["email": email, "password": password]
        
        guard let jsonData = try? JSONSerialization.data(withJSONObject: loginData) else {
            loginResponse = "Failed to create request data"
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "accept")
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = jsonData
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    self.loginResponse = "Error: \(error.localizedDescription)"
                    return
                }
                
                guard let data = data else {
                    self.loginResponse = "No data received"
                    return
                }
                
                do {
                    if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let token = json["token"] as? String {
                        // Save token to Keychain
                        if KeychainManager.shared.saveToken(token) {
                            self.loginResponse = "Token saved successfully"
                            self.isLoggedIn = true
                            // Clear sensitive data
                            self.email = ""
                            self.password = ""
                        } else {
                            self.loginResponse = "Failed to save token"
                        }
                    } else {
                        self.loginResponse = "No token found in response"
                    }
                } catch {
                    self.loginResponse = "Failed to parse response: \(error.localizedDescription)"
                }
            }
        }.resume()
    }
    
    private func logout() {
        if KeychainManager.shared.deleteToken() {
            isLoggedIn = false
            loginResponse = "Logged out successfully"
        } else {
            loginResponse = "Failed to logout"
        }
    }
    
    private func getStatusFinalIcon(for status: String) -> String {
        if status.contains("Complete") {
            return "checkmark.seal.fill"
        } else if status.contains("Failed") {
            return "exclamationmark.triangle.fill"
        } else if status.contains("Cancelled") {
            return "xmark.circle.fill"
        } else {
            return "circle"
        }
    }
    
    // Add observer for transaction completion
    private func observeTransactionCompletion() {
        // Trigger success animation when transaction is completed successfully
        if beaconDetector.transactionStatus?.last?.contains("Complete") == true {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) {
                    showSuccessAnimation = true
                }
            }
        }
    }
}

struct InfoRow: View {
    var label: String
    var value: String
    
    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .frame(width: 70, alignment: .leading)
            
            Text(value)
                .font(.subheadline)
                .foregroundColor(.primary)
            
            Spacer()
        }
        .padding(.vertical, 2)
    }
}

class BeaconDetector: NSObject, ObservableObject, CLLocationManagerDelegate {
    @Published var isBeaconDetected = false
    @Published var proximityString = "Unknown"
    @Published var authorizationStatus = "Unknown"
    @Published var deviceIdentifier = "Unknown"
    @Published var lastPaymentResponse: String? = nil
    @Published var transactionStatus: [String]? = nil
    @Published var pendingTransaction = false
    @Published var processingTransaction = false
    
    // Internal payment service
    private var paymentService: InternalPaymentService?
    
    private let locationManager = CLLocationManager()
    let beaconRegion: CLBeaconRegion // Changed to public for debugging
    private var lastSentProximity: CLProximity?
    private var beaconLostTime: Date? = nil // Track when the beacon was lost
    private let requiredLostTimeForNotification: TimeInterval = 10.0 // 10 seconds
    
    // Improved reliability variables
    private var lastNotificationTime: Date? = nil
    private var minTimeBetweenNotifications: TimeInterval = 5.0 // 5 seconds between notifications
    private var isProcessingDetection = false // Flag to prevent concurrent processing
    private var detectionQueue = DispatchQueue(label: "com.beacon.detectionQueue")
    private let userDefaultsQueue = DispatchQueue(label: "com.beacon.userDefaultsQueue", qos: .background)
    
    // Monitoring state
    private var isMonitoring = false
    
    override init() {
        let uuid = UUID(uuidString: "FA4F992B-0F59-4E61-B0FB-457308078CAB")!
        beaconRegion = CLBeaconRegion(uuid: uuid, major: 1, minor: 1, identifier: "MyBeacon")
        
        super.init()
        
        // Initialize internal payment service
        self.paymentService = InternalPaymentService()
        
        // Configure beacon region for background monitoring
        beaconRegion.notifyOnEntry = true
        beaconRegion.notifyOnExit = true
        beaconRegion.notifyEntryStateOnDisplay = true
        
        // Always do setup operations asynchronously to avoid blocking main thread
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }
            self.setupLocationManager()
            self.setupNotifications()
            self.getDeviceIdentifier() 
        }
        
        print("BeaconDetector initialized")
    }
    
    private func setupLocationManager() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
        locationManager.showsBackgroundLocationIndicator = true
        locationManager.requestAlwaysAuthorization()
        
        print("Location manager setup complete")
        
        // Start monitoring after a slight delay to ensure setup is complete
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            self?.startScanning()
        }
    }
    
    private func setupNotifications() {
        // Request all necessary notification permissions
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge, .provisional, .criticalAlert]) { granted, error in
            if granted {
                print("Notification permission granted")
                // Register for remote notifications
                DispatchQueue.main.async {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            } else if let error = error {
                print("Notification permission error: \(error)")
            }
        }
        
        // Configure notification center delegate
        UNUserNotificationCenter.current().delegate = self
    }
    
    private func getDeviceIdentifier() {
        // Try to get saved ID first (done on background thread)
        userDefaultsQueue.async { [weak self] in
            if let savedID = UserDefaults.standard.string(forKey: "device_identifier") {
                DispatchQueue.main.async {
                    self?.deviceIdentifier = savedID
                }
                return
            }
            
            // If no saved ID, get from device and save
            if let identifierForVendor = UIDevice.current.identifierForVendor {
                let id = identifierForVendor.uuidString
                DispatchQueue.main.async {
                    self?.deviceIdentifier = id
                    }
                
                // Save for future use
                UserDefaults.standard.set(id, forKey: "device_identifier")
            } else {
                DispatchQueue.main.async {
                    self?.deviceIdentifier = "Unavailable"
                }
            }
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        DispatchQueue.main.async {
            switch status {
            case .authorizedAlways:
                self.authorizationStatus = "Authorized Always"
                self.startScanning()
            case .authorizedWhenInUse:
                self.authorizationStatus = "Authorized When In Use"
                // Don't show notification for authorization status
            case .denied:
                self.authorizationStatus = "Denied"
                // Don't show notification for authorization status
            case .restricted:
                self.authorizationStatus = "Restricted"
            case .notDetermined:
                self.authorizationStatus = "Not Determined"
            @unknown default:
                self.authorizationStatus = "Unknown"
            }
        }
    }
    
    func startScanning() {
        if isMonitoring {
            return // Already monitoring
        }
        
        if locationManager.authorizationStatus == .authorizedAlways {
            print("Starting to scan for beacons...")
            
            // Stop any existing monitoring first (to reset)
            locationManager.stopMonitoring(for: beaconRegion)
            locationManager.stopRangingBeacons(satisfying: beaconRegion.beaconIdentityConstraint)
            
            // Start fresh
            locationManager.startMonitoring(for: beaconRegion)
            locationManager.startRangingBeacons(satisfying: beaconRegion.beaconIdentityConstraint)
            
            // Request initial state
            locationManager.requestState(for: beaconRegion)
            
            isMonitoring = true
            
            print("Scanning started for UUID: \(beaconRegion.uuid.uuidString)")
            print("Major: \(String(describing: beaconRegion.major)), Minor: \(String(describing: beaconRegion.minor))")
        } else {
            print("Location authorization not granted - need 'Always' authorization")
        }
    }
    
    func restartScanning() {
        isMonitoring = false
        startScanning()
    }
    
    func locationManager(_ manager: CLLocationManager, didRange beacons: [CLBeacon], satisfying beaconConstraint: CLBeaconIdentityConstraint) {
        print("Ranging beacons: Found \(beacons.count) beacons")
        
        // Process beacon data on detection queue to avoid main thread I/O
        detectionQueue.async { [weak self] in
            guard let self = self else { return }
            
            if self.isProcessingDetection {
                print("Already processing detection - skipping")
                return
            }
            
            self.isProcessingDetection = true
            
            let nearestBeacon = beacons.first
            
            // Main thread UI updates
            DispatchQueue.main.async {
                if let nearestBeacon = nearestBeacon {
                    print("Nearest beacon: UUID: \(nearestBeacon.uuid.uuidString)")
                    print("Major: \(nearestBeacon.major), Minor: \(nearestBeacon.minor)")
                    
                    // Notify on conditions:
                    // 1. Beacon was just detected (not previously detected)
                    // 2. Beacon was lost for sufficient time (10s) and reappeared
                    // 3. Enough time has passed since last notification (5s)
                    let now = Date()
                    let shouldNotifyNewDetection = !self.isBeaconDetected
                    let shouldNotifyReappearance = self.beaconLostTime != nil && 
                                                 now.timeIntervalSince(self.beaconLostTime!) >= self.requiredLostTimeForNotification
                    let enoughTimeSinceLastNotification = self.lastNotificationTime == nil || 
                                                        now.timeIntervalSince(self.lastNotificationTime!) >= self.minTimeBetweenNotifications
                    
                    // Determine if we should show a notification
                    let shouldNotify = (shouldNotifyNewDetection || shouldNotifyReappearance) && enoughTimeSinceLastNotification
                    
                    if shouldNotify {
                        print("Sending notification - condition: new=\(shouldNotifyNewDetection), reappear=\(shouldNotifyReappearance), timeout=\(enoughTimeSinceLastNotification)")
                        self.callPaymentAPIAndNotify()
                        self.lastNotificationTime = now
                    }
                    
                    // Reset beacon lost time since we're detecting it now
                    self.beaconLostTime = nil
                    self.isBeaconDetected = true
                    
                    // Check if proximity changed 
                    if self.lastSentProximity != nearestBeacon.proximity {
                        self.lastSentProximity = nearestBeacon.proximity
                        
                        switch nearestBeacon.proximity {
                        case .immediate:
                            self.proximityString = "Immediate"
                        case .near:
                            self.proximityString = "Near"
                        case .far:
                            self.proximityString = "Far"
                        default:
                            self.proximityString = "Unknown"
                        }
                    }
                } else {
                    if self.isBeaconDetected {
                        // Beacon was just lost - record the time
                        print("Beacon lost - no beacons in range")
                        self.beaconLostTime = Date()
                    }
                    self.isBeaconDetected = false
                    self.proximityString = "Unknown"
                    self.lastSentProximity = nil
                }
                
                self.isProcessingDetection = false
            }
        }
    }
    
    // Update the region monitoring callbacks
    func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
        print("Entered region: \(region.identifier)")
        // We don't show notification here - we wait for ranging to confirm
        
        // Request beacon ranging immediately
        if let beaconRegion = region as? CLBeaconRegion {
            locationManager.startRangingBeacons(satisfying: beaconRegion.beaconIdentityConstraint)
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didExitRegion region: CLRegion) {
        print("Exited region: \(region.identifier)")
        DispatchQueue.main.async {
            if self.isBeaconDetected {
                // Record the time when the beacon was lost
                self.beaconLostTime = Date()
            }
            self.isBeaconDetected = false
            self.proximityString = "Unknown"
            self.lastSentProximity = nil
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didDetermineState state: CLRegionState, for region: CLRegion) {
        if let beaconRegion = region as? CLBeaconRegion {
            switch state {
            case .inside:
                print("Inside beacon region")
                locationManager.startRangingBeacons(satisfying: beaconRegion.beaconIdentityConstraint)
                // Don't show notification here - wait for ranging to confirm
            case .outside:
                print("Outside beacon region")
                locationManager.stopRangingBeacons(satisfying: beaconRegion.beaconIdentityConstraint)
                // Reset notification status when outside region
                if self.isBeaconDetected {
                    self.beaconLostTime = Date()
                }
                self.isBeaconDetected = false
            case .unknown:
                print("Unknown beacon region state")
                // Restart monitoring if in unknown state
                self.restartScanning()
            }
        }
    }
    
    // Handle any ranging/monitoring errors
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location manager failed with error: \(error.localizedDescription)")
        
        // Restart monitoring after a delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
            self?.restartScanning()
        }
    }
    
    func locationManager(_ manager: CLLocationManager, monitoringDidFailFor region: CLRegion?, withError error: Error) {
        print("Monitoring failed for region \(region?.identifier ?? "unknown"): \(error.localizedDescription)")
        
        // Restart monitoring after a delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
            self?.restartScanning()
        }
    }
    
    private func callPaymentAPIAndNotify() {
        // Instead of making the payment directly, set a pending transaction state
        // and notify the user that action is required
        pendingTransaction = true
        
        // Update UI transaction status
        DispatchQueue.main.async {
            self.transactionStatus = ["Beacon Detected", "Waiting for confirmation..."]
        }
        
        // Show notification that requires user action
        showNotification(
            title: "Beacon Detected Nearby", 
            message: "Open app to review and confirm transaction."
        )
    }
    
    // Modified method to handle user confirmation of transaction
    func confirmAndProcessTransaction() {
        // Set processing state to true to show visual indicator
        DispatchQueue.main.async {
            self.processingTransaction = true
        }
        
        // Update UI transaction status
        DispatchQueue.main.async {
            if var currentStatus = self.transactionStatus {
                // Replace "Waiting for confirmation" with "Processing transaction"
                if currentStatus.count > 1 {
                    currentStatus[1] = "Processing transaction..."
                } else {
                    currentStatus.append("Processing transaction...")
                }
                self.transactionStatus = currentStatus
            }
        }
        
        // Add a slight delay to show the processing animation
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            // Use the internal payment service
            self.paymentService?.requestPayment { result in
                // Process payment result on a background queue
                DispatchQueue.global(qos: .userInitiated).async {
                    let statusUpdate: String
                    let responseMessage: String
                    
                    switch result {
                    case .success(let response):
                        if response.status == "error" || response.error != nil {
                            responseMessage = "Error: \(response.error ?? response.message ?? "Unknown error")"
                            statusUpdate = "Transaction Failed"
                        } else {
                            responseMessage = response.message ?? "Payment request successful"
                            statusUpdate = "Transaction Complete"
                        }
                        
                    case .failure(let error):
                        responseMessage = "Error: \(error.localizedDescription)"
                        statusUpdate = "Transaction Failed"
                    }
                    
                    // Update UI on main thread
                    DispatchQueue.main.async {
                        self.lastPaymentResponse = responseMessage
                        self.pendingTransaction = false
                        self.processingTransaction = false
                        
                        // Update transaction status list
                        if var currentStatus = self.transactionStatus {
                            // Add the new status instead of replacing
                            currentStatus.append(statusUpdate)
                            self.transactionStatus = currentStatus
                            
                            // Notify ContentView to show success animation if transaction was successful
                            NotificationCenter.default.post(
                                name: NSNotification.Name("TransactionCompleted"),
                                object: nil,
                                userInfo: ["success": statusUpdate.contains("Complete")]
                            )
                        }
                    }
                    
                    // Show notification with result
                    self.showNotification(
                        title: statusUpdate,
                        message: responseMessage
                    )
                }
            }
        }
    }
    
    // New method to handle user cancellation of transaction
    func cancelTransaction() {
        pendingTransaction = false
        
        // Update UI transaction status
        DispatchQueue.main.async {
            if var currentStatus = self.transactionStatus {
                currentStatus.append("Transaction Cancelled")
                self.transactionStatus = currentStatus
            }
        }
        
        // Show cancellation notification
        showNotification(
            title: "Transaction Cancelled",
            message: "You've cancelled the payment transaction."
        )
    }
    
    private func showNotification(title: String, message: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = message
        content.sound = .default
        
        // Make the notification more noticeable
        content.interruptionLevel = .timeSensitive
        
        // Add unique identifier based on timestamp to prevent notification collapsing
        let identifier = "\(title)-\(Date().timeIntervalSince1970)"
        
        let request = UNNotificationRequest(
            identifier: identifier,
            content: content,
            trigger: nil
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Error showing notification: \(error)")
            } else {
                print("Successfully displayed notification: \(title)")
            }
        }
    }
    
    // Clean up when the detector is deallocated
    deinit {
        // No more webhook or background tasks to clean up
    }
    
    func updateDeviceIdentifier(_ newDeviceID: String) {
        self.deviceIdentifier = newDeviceID
        userDefaultsQueue.async {
            UserDefaults.standard.set(newDeviceID, forKey: "device_identifier")
        }
    }
    
    func resetToDefaultIdentifier() {
        // Remove saved ID
        userDefaultsQueue.async {
            UserDefaults.standard.removeObject(forKey: "device_identifier")
        }
        
        // Get fresh device identifier
        if let identifierForVendor = UIDevice.current.identifierForVendor {
            self.deviceIdentifier = identifierForVendor.uuidString
        } else {
            self.deviceIdentifier = "Unavailable"
        }
    }
}

// Internal payment service to avoid import issues
fileprivate class InternalPaymentService {
    struct Response: Codable {
        var status: String?
        var message: String?
        var error: String?
    }
    
    func requestPayment(completion: @escaping (Result<Response, Error>) -> Void) {
        let urlString = "https://master-api.mikepawel.com/payment"
        
        guard let url = URL(string: urlString) else {
            completion(.failure(NSError(domain: "PaymentService", code: 400, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
            return
        }
        
        // Get the stored JWT token
        guard let token = KeychainManager.shared.getToken() else {
            completion(.failure(NSError(domain: "PaymentService", code: 401, userInfo: [NSLocalizedDescriptionKey: "No authentication token found"])))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.addValue("application/json", forHTTPHeaderField: "accept")
        request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            // Check for HTTP status code
            if let httpResponse = response as? HTTPURLResponse {
                if httpResponse.statusCode == 401 {
                    completion(.failure(NSError(domain: "PaymentService", code: 401, userInfo: [NSLocalizedDescriptionKey: "Authentication failed - token may be invalid or expired"])))
                    return
                }
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
                    let mockResponse = Response(status: "error", message: "Failed to decode response", error: rawResponse)
                    completion(.success(mockResponse))
                } else {
                    completion(.failure(error))
                }
            }
        }
        
        task.resume()
    }
}

// New transaction confirmation view with improved visuals
struct TransactionConfirmationView: View {
    @Binding var isPresented: Bool
    var beaconDetector: BeaconDetector
    @State private var isAnimating = false
    
    var body: some View {
        VStack(spacing: 30) {
            // Handle on top for sheet
            RoundedRectangle(cornerRadius: 3)
                .fill(Color(.systemGray4))
                .frame(width: 40, height: 5)
                .padding(.top, 8)
            
            // Header
            VStack(spacing: 15) {
                // Pulsing beacon icon
                ZStack {
                    Circle()
                        .fill(Color.blue.opacity(0.2))
                        .frame(width: 100, height: 100)
                        .scaleEffect(isAnimating ? 1.1 : 1.0)
                    
                    Circle()
                        .fill(Color.blue.opacity(0.3))
                        .frame(width: 80, height: 80)
                        .scaleEffect(isAnimating ? 1.15 : 1.0)
                    
                    Circle()
                        .fill(Color.blue)
                        .frame(width: 60, height: 60)
                    
                    Image(systemName: "location.fill")
                        .font(.system(size: 28))
                        .foregroundColor(.white)
                }
                .onAppear {
                    withAnimation(Animation.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                        isAnimating = true
                    }
                }
                
                Text("Transaction Request")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("A beacon has been detected nearby")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.vertical)
            
            // Transaction details
            VStack(alignment: .leading, spacing: 15) {
                Text("Transaction Details")
                    .font(.headline)
                    .padding(.bottom, 5)

                    HStack {
                    Text("Product")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("1 Ticket")
                        .fontWeight(.medium)
                }
                .padding(.vertical, 8)
                .padding(.horizontal)
                .background(Color(.systemGray6))
                .cornerRadius(8)
                
                HStack {
                    Text("Payment Amount")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("0.1 SOL")
                        .fontWeight(.medium)
                }
                .padding(.vertical, 8)
                .padding(.horizontal)
                .background(Color(.systemGray6))
                .cornerRadius(8)
                
                HStack {
                    Text("Discount")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("20% off")
                        .fontWeight(.medium)
                }
                .padding(.vertical, 8)
                .padding(.horizontal)
                .background(Color(.systemGray6))
                .cornerRadius(8)
                
                
            }
            .padding(.horizontal)
            
            // Action buttons
            VStack(spacing: 15) {
                Button(action: {
                    // Hide the sheet first
                    isPresented = false
                    // Wait a bit then process the transaction
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                        beaconDetector.confirmAndProcessTransaction()
                    }
                }) {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                        Text("Confirm Transaction")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(15)
                    .shadow(color: Color.blue.opacity(0.3), radius: 5, x: 0, y: 3)
                }
                
                Button(action: {
                    // Hide the sheet first
                    isPresented = false
                    // Wait a bit then cancel the transaction
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                        beaconDetector.cancelTransaction()
                    }
                }) {
                    HStack {
                        Image(systemName: "xmark.circle.fill")
                        Text("Decline")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(.systemGray6))
                    .foregroundColor(.primary)
                    .cornerRadius(15)
                }
            }
            .padding(.horizontal)
            
            Spacer()
        }
        .padding()
    }
}

// Helper blur effect view for improved visual appearance
struct VisualEffectView: UIViewRepresentable {
    var effect: UIVisualEffect?
    
    func makeUIView(context: UIViewRepresentableContext<Self>) -> UIVisualEffectView {
        UIVisualEffectView()
    }
    
    func updateUIView(_ uiView: UIVisualEffectView, context: UIViewRepresentableContext<Self>) {
        uiView.effect = effect
    }
}

// Add UNUserNotificationCenterDelegate conformance
extension BeaconDetector: UNUserNotificationCenterDelegate {
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        // Show notification even when app is in foreground
        completionHandler([.banner, .sound, .badge])
    }
    
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        // Handle notification tap
        completionHandler()
    }
}

#Preview {
    ContentView()
}
