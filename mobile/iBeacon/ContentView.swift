//
//  ContentView.swift
//  iBeacon
//
//  Created by dimitrov on 22.01.25.
//

import SwiftUI
import CoreLocation
import CoreBluetooth
import UserNotifications
import BackgroundTasks

struct ContentView: View {
    @StateObject private var beaconDetector = BeaconDetector()
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        NavigationView {
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
                
                Spacer()
            }
            .padding(.top)
            .navigationTitle("iBeacon Monitor")
            .preferredColorScheme(.light) // Force light mode
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
    
    private let locationManager = CLLocationManager()
    let beaconRegion: CLBeaconRegion // Changed to public for debugging
    private var lastSentProximity: CLProximity?
    private var lastWebhookSentTime: Date? = nil
    private let minimumWebhookInterval: TimeInterval = 60 // Minimum seconds between webhook calls
    
    // Add webhook configuration
    private let webhookURL = "https://nodered.yanacocha.fit.fraunhofer.de/beacon?name=RWTH&presence=on"
    private let username = "prinz"
    private let password = "prinz"
    
    private var backgroundTask: UIBackgroundTaskIdentifier = .invalid
    
    override init() {
        let uuid = UUID(uuidString: "F0018B9B-7509-4C31-A905-1A27D39C003C")!
        beaconRegion = CLBeaconRegion(uuid: uuid, major: 12, minor: 5, identifier: "MyBeacon")
        
        super.init()
        
        // Configure beacon region for background monitoring
        beaconRegion.notifyOnEntry = true
        beaconRegion.notifyOnExit = true
        beaconRegion.notifyEntryStateOnDisplay = true
        
        setupLocationManager()
        setupNotifications() // Make sure notifications are set up
    }
    
    private func setupLocationManager() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
        locationManager.showsBackgroundLocationIndicator = true
        locationManager.requestAlwaysAuthorization()
        startScanning()
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
    
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        DispatchQueue.main.async {
            switch status {
            case .authorizedAlways:
                self.authorizationStatus = "Authorized Always"
                self.startScanning()
            case .authorizedWhenInUse:
                self.authorizationStatus = "Authorized When In Use"
                // Show alert or message to user that Always authorization is needed
                self.showNotification(title: "", message: "Please enable 'Always' location access for background monitoring")
            case .denied:
                self.authorizationStatus = "Denied"
                self.showNotification(title: "", message: "Location access denied - beacon monitoring won't work")
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
        if locationManager.authorizationStatus == .authorizedAlways {
            print("Starting to scan for beacons...")
            locationManager.startMonitoring(for: beaconRegion)
            locationManager.startRangingBeacons(satisfying: beaconRegion.beaconIdentityConstraint)
            
            // Request initial state
            locationManager.requestState(for: beaconRegion)
            
            // Start ranging immediately
            locationManager.startRangingBeacons(satisfying: beaconRegion.beaconIdentityConstraint)
            
            print("Scanning started for UUID: \(beaconRegion.uuid.uuidString)")
            print("Major: \(String(describing: beaconRegion.major)), Minor: \(String(describing: beaconRegion.minor))")
        } else {
            print("Location authorization not granted - need 'Always' authorization")
        }
    }
    
    private func shouldSendWebhook() -> Bool {
        // If we've never sent a webhook or the minimum interval has passed
        if lastWebhookSentTime == nil || 
           Date().timeIntervalSince(lastWebhookSentTime!) >= minimumWebhookInterval {
            return true
        }
        return false
    }
    
    private func sendWebhookRequest() {
        // Only send if we should according to our throttling logic
        guard shouldSendWebhook() else {
            print("Skipping webhook - too soon since last send")
            return
        }
        
        // Update last sent time
        lastWebhookSentTime = Date()
        
        // Start background task
        backgroundTask = UIApplication.shared.beginBackgroundTask { [weak self] in
            self?.endBackgroundTask()
        }
        
        guard let url = URL(string: webhookURL) else {
            endBackgroundTask()
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        
        let loginString = "\(username):\(password)"
        guard let loginData = loginString.data(using: .utf8) else {
            endBackgroundTask()
            return
        }
        let base64LoginString = loginData.base64EncodedString()
        request.setValue("Basic \(base64LoginString)", forHTTPHeaderField: "Authorization")
        
        print("Sending webhook request at \(Date())")
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            if let error = error {
                print("Webhook error: \(error.localizedDescription)")
            }
            
            if let httpResponse = response as? HTTPURLResponse {
                print("Webhook response status: \(httpResponse.statusCode)")
            }
            
            self?.endBackgroundTask()
        }.resume()
    }
    
    private func endBackgroundTask() {
        if backgroundTask != .invalid {
            UIApplication.shared.endBackgroundTask(backgroundTask)
            backgroundTask = .invalid
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didRange beacons: [CLBeacon], satisfying beaconConstraint: CLBeaconIdentityConstraint) {
        print("Ranging beacons: Found \(beacons.count) beacons")
        
        DispatchQueue.main.async {
            if let nearestBeacon = beacons.first {
                print("Nearest beacon: UUID: \(nearestBeacon.uuid.uuidString)")
                print("Major: \(nearestBeacon.major), Minor: \(nearestBeacon.minor)")
                
                if !self.isBeaconDetected {
                    // Beacon was just detected - this is a good time to send a webhook
                    self.showNotification(title: "Beacon Detected", message: "Beacon is now in range")
                    self.sendWebhookRequest()
                }
                
                self.isBeaconDetected = true
                
                // Check if proximity changed 
                if self.lastSentProximity != nearestBeacon.proximity {
                    self.lastSentProximity = nearestBeacon.proximity
                    
                    switch nearestBeacon.proximity {
                    case .immediate:
                        self.proximityString = "Immediate"
                        // Only send webhook at immediate proximity if enough time has passed
                        self.sendWebhookRequest()
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
                    // Beacon was just lost
                    print("Beacon lost - no beacons in range")
                    self.showNotification(title: "Beacon Lost", message: "Beacon is no longer in range")
                }
                self.isBeaconDetected = false
                self.proximityString = "Unknown"
                self.lastSentProximity = nil
            }
        }
    }
    
    // Update the region monitoring callbacks
    func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
        print("Entered region: \(region.identifier)")
        // Don't automatically send a webhook here - wait for ranging to confirm
        showNotification(title: "Beacon Detected", message: "You have entered the beacon region")
    }
    
    func locationManager(_ manager: CLLocationManager, didExitRegion region: CLRegion) {
        print("Exited region: \(region.identifier)")
        DispatchQueue.main.async {
            self.isBeaconDetected = false
            self.proximityString = "Unknown"
            self.lastSentProximity = nil
            self.showNotification(title: "Beacon Lost", message: "You have left the beacon region")
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didDetermineState state: CLRegionState, for region: CLRegion) {
        if let beaconRegion = region as? CLBeaconRegion {
            switch state {
            case .inside:
                print("Inside beacon region")
                locationManager.startRangingBeacons(satisfying: beaconRegion.beaconIdentityConstraint)
                // Don't send webhook here - wait for actual ranging to confirm
                showNotification(title: "Beacon Detected", message: "You are in the beacon region")
            case .outside:
                print("Outside beacon region")
                locationManager.stopRangingBeacons(satisfying: beaconRegion.beaconIdentityConstraint)
                showNotification(title: "Beacon Lost", message: "You are outside the beacon region")
            case .unknown:
                print("Unknown beacon region state")
            }
        }
    }
    
    // Remove the periodic monitoring functionality as it's sending too many messages
    private var monitoringTimer: Timer?
    
    private func startPeriodicMonitoring() {
        // We're removing the automatic periodic webhook sending
        // and only sending when beacons are actually detected
    }
    
    private func stopPeriodicMonitoring() {
        monitoringTimer?.invalidate()
        monitoringTimer = nil
    }
    
    private func showNotification(title: String, message: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = message
        content.sound = .default
        
        // Make the notification more noticeable
        content.interruptionLevel = .timeSensitive
        
        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: nil
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Error showing notification: \(error)")
            }
        }
    }
    
    // Clean up when the detector is deallocated
    deinit {
        stopPeriodicMonitoring()
        endBackgroundTask()
    }
    
    func registerBackgroundTask() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.IvanDosev.iBeacon1.beacon.monitoring", using: nil) { task in
            self.handleAppRefresh(task: task as! BGAppRefreshTask)
        }
    }
    
    private func handleAppRefresh(task: BGAppRefreshTask) {
        // Schedule the next background task
        scheduleBackgroundTask()
        
        // Perform the beacon monitoring
        task.expirationHandler = {
            // Handle task expiration
            self.stopPeriodicMonitoring()
        }
        
        // Instead of starting periodic monitoring that sends webhooks on a timer,
        // just make sure we're monitoring for beacons
        startScanning()
        
        // Mark the task complete when done
        task.setTaskCompleted(success: true)
    }
    
    private func scheduleBackgroundTask() {
        let request = BGAppRefreshTaskRequest(identifier: "com.IvanDosev.iBeacon1.beacon.monitoring")
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes
        
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Could not schedule app refresh: \(error)")
        }
    }
}

#Preview {
    ContentView()
}
