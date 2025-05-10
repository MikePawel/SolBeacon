//
//  ContentView.swift
//  iBeacon
//
//  Created by mike
//

import SwiftUI
import CoreLocation
import CoreBluetooth
import UserNotifications
import Foundation

struct ContentView: View {
    @StateObject private var beaconDetector = BeaconDetector()
    @Environment(\.colorScheme) var colorScheme
    @State private var showCopiedMessage = false
    @State private var showEditDeviceIDSheet = false
    @State private var customDeviceID = ""
    
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
                                Text(beaconDetector.isBeaconDetected ? "Beacon Detected" : "Searching...")
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
                    
                    // Transaction Status Card (new)
                    VStack(alignment: .leading, spacing: 15) {
                        HStack {
                            Image(systemName: "arrow.clockwise.circle.fill")
                                .font(.system(size: 22))
                                .foregroundColor(.blue)
                            
                            Text("Transaction Status")
                                .font(.headline)
                                .padding(.top, 5)
                            
                            Spacer()
                        }
                        
                        Divider()
                        
                        if beaconDetector.transactionStatus != nil {
                            ForEach(beaconDetector.transactionStatus ?? [], id: \.self) { status in
                                HStack(spacing: 12) {
                                    Image(systemName: getStatusIcon(for: status))
                                        .foregroundColor(getStatusColor(for: status))
                                    
                                    Text(status)
                                        .font(.subheadline)
                                        .foregroundColor(.primary)
                                    
                                    Spacer()
                                }
                                .padding(.vertical, 4)
                            }
                        } else {
                            Text("No transactions in progress")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .padding(.vertical, 5)
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
                    
                    // Payment API Response Card
                    if beaconDetector.lastPaymentResponse != nil {
                        VStack(alignment: .leading, spacing: 15) {
                            HStack {
                                Image(systemName: "creditcard.fill")
                                    .font(.system(size: 22))
                                    .foregroundColor(.blue)
                                
                                Text("Payment API Response")
                                    .font(.headline)
                                    .padding(.top, 5)
                                
                                Spacer()
                            }
                            
                            Divider()
                            
                            Text(beaconDetector.lastPaymentResponse ?? "")
                                .font(.subheadline)
                                .foregroundColor(.primary)
                                .padding(.vertical, 5)
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
                    
                    // Beacon info card
                    VStack(alignment: .leading, spacing: 15) {
                        Text("Beacon Information")
                            .font(.headline)
                            .padding(.top, 5)
                        
                        Divider()
                        
                        InfoRow(label: "UUID", value: beaconDetector.beaconRegion.uuid.uuidString)
                        InfoRow(label: "Major", value: "\(beaconDetector.beaconRegion.major?.intValue ?? 0)")
                        InfoRow(label: "Minor", value: "\(beaconDetector.beaconRegion.minor?.intValue ?? 0)")
                        InfoRow(label: "Location Auth", value: beaconDetector.authorizationStatus)
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color(.systemBackground))
                            .shadow(color: Color(.systemGray4).opacity(0.2), radius: 10, x: 0, y: 2)
                    )
                    .padding(.horizontal)
                    
                    // Device ID card
                    VStack(alignment: .leading, spacing: 15) {
                        Text("Device Information")
                            .font(.headline)
                            .padding(.top, 5)
                        
                        Divider()
                        
                        HStack {
                            Text("Device ID")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .frame(width: 70, alignment: .leading)
                            
                            Text(beaconDetector.deviceIdentifier)
                                .font(.subheadline)
                                .foregroundColor(.primary)
                            
                            Spacer()
                            
                            Button(action: {
                                UIPasteboard.general.string = beaconDetector.deviceIdentifier
                                withAnimation {
                                    showCopiedMessage = true
                                }
                                
                                // Hide the message after 2 seconds
                                DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                                    withAnimation {
                                        showCopiedMessage = false
                                    }
                                }
                            }) {
                                Image(systemName: "doc.on.doc")
                                    .foregroundColor(.blue)
                            }
                            
                            Button(action: {
                                customDeviceID = beaconDetector.deviceIdentifier
                                showEditDeviceIDSheet = true
                            }) {
                                Image(systemName: "pencil")
                                    .foregroundColor(.blue)
                                    .padding(.leading, 8)
                            }
                        }
                        .padding(.vertical, 2)
                        
                        if showCopiedMessage {
                            Text("Device ID copied to clipboard!")
                                .font(.caption)
                                .foregroundColor(.green)
                                .padding(.top, 2)
                                .transition(.opacity)
                        }
                        
                        Text("This ID will be used for future deployment")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .padding(.top, 2)
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
        }
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
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if granted {
                print("Notification permission granted")
            } else if let error = error {
                print("Notification permission error: \(error)")
            }
        }
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
        // Show initial detection notification
        showNotification(title: "Beacon Detected", message: "Sending transaction now...")
        
        // Update UI transaction status
        DispatchQueue.main.async {
            self.transactionStatus = ["Beacon Detected", "Sending transaction..."]
        }
        
        // Use the internal payment service instead
        paymentService?.requestPayment { result in
            // Process payment result on a background queue
            DispatchQueue.global(qos: .userInitiated).async {
                let statusUpdate: String
                let responseMessage: String
                let notificationTitle: String
                let notificationMessage: String
                
                switch result {
                case .success(let response):
                    responseMessage = response.message ?? "Payment request successful"
                    statusUpdate = "Transaction Complete"
                    notificationTitle = "Transaction Complete"
                    notificationMessage = "Payment API: \(responseMessage)"
                    
                case .failure(let error):
                    responseMessage = "Error: \(error.localizedDescription)"
                    statusUpdate = "Transaction Failed"
                    notificationTitle = "Transaction Failed"
                    notificationMessage = "Payment API Error: \(error.localizedDescription)"
                }
                
                // Update UI on main thread
                DispatchQueue.main.async {
                    self.lastPaymentResponse = responseMessage
                    
                    // Update transaction status list
                    if var currentStatus = self.transactionStatus {
                        currentStatus.append(statusUpdate)
                        self.transactionStatus = currentStatus
                    }
                }
                
                // Show notification
                self.showNotification(title: notificationTitle, message: notificationMessage)
            }
        }
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

#Preview {
    ContentView()
}
