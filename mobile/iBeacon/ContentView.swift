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

struct ContentView: View {
    @StateObject private var beaconDetector = BeaconDetector()
    @Environment(\.colorScheme) var colorScheme
    @State private var showCopiedMessage = false
    @State private var showEditDeviceIDSheet = false
    @State private var customDeviceID = ""
    
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
                
                Spacer()
            }
            .padding(.top)
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
    
    private let locationManager = CLLocationManager()
    let beaconRegion: CLBeaconRegion // Changed to public for debugging
    private var lastSentProximity: CLProximity?
    private var beaconLostTime: Date? = nil // Track when the beacon was lost
    private let requiredLostTimeForNotification: TimeInterval = 10.0 // 10 seconds
    
    override init() {
        let uuid = UUID(uuidString: "FA4F992B-0F59-4E61-B0FB-457308078CAB")!
        beaconRegion = CLBeaconRegion(uuid: uuid, major: 1, minor: 1, identifier: "MyBeacon")
        
        super.init()
        
        // Configure beacon region for background monitoring
        beaconRegion.notifyOnEntry = true
        beaconRegion.notifyOnExit = true
        beaconRegion.notifyEntryStateOnDisplay = true
        
        setupLocationManager()
        setupNotifications() // Make sure notifications are set up
        getDeviceIdentifier()
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
    
    private func getDeviceIdentifier() {
        // Try to get saved ID first
        if let savedID = UserDefaults.standard.string(forKey: "device_identifier") {
            self.deviceIdentifier = savedID
            return
        }
        
        // If no saved ID, get from device and save
        if let identifierForVendor = UIDevice.current.identifierForVendor {
            let id = identifierForVendor.uuidString
            self.deviceIdentifier = id
            
            // Save for future use
            UserDefaults.standard.set(id, forKey: "device_identifier")
        } else {
            self.deviceIdentifier = "Unavailable"
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
    
    func locationManager(_ manager: CLLocationManager, didRange beacons: [CLBeacon], satisfying beaconConstraint: CLBeaconIdentityConstraint) {
        print("Ranging beacons: Found \(beacons.count) beacons")
        
        DispatchQueue.main.async {
            if let nearestBeacon = beacons.first {
                print("Nearest beacon: UUID: \(nearestBeacon.uuid.uuidString)")
                print("Major: \(nearestBeacon.major), Minor: \(nearestBeacon.minor)")
                
                // Check if this is a reappearance after being lost for sufficient time
                let shouldShowNotification = !self.isBeaconDetected && 
                                            self.beaconLostTime != nil &&
                                            Date().timeIntervalSince(self.beaconLostTime!) >= self.requiredLostTimeForNotification
                
                if !self.isBeaconDetected {
                    // Beacon was just detected
                    if shouldShowNotification {
                        self.showNotification(title: "Beacon Detected", message: "Beacon Detected")
                    } else if self.beaconLostTime == nil {
                        // First detection ever - show notification
                        self.showNotification(title: "Beacon Detected", message: "Beacon Detected")
                    }
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
        }
    }
    
    // Update the region monitoring callbacks
    func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
        print("Entered region: \(region.identifier)")
        // We don't show notification here - we wait for ranging to confirm
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
        // No more webhook or background tasks to clean up
    }
    
    func updateDeviceIdentifier(_ newDeviceID: String) {
        self.deviceIdentifier = newDeviceID
        UserDefaults.standard.set(newDeviceID, forKey: "device_identifier")
    }
    
    func resetToDefaultIdentifier() {
        // Remove saved ID
        UserDefaults.standard.removeObject(forKey: "device_identifier")
        
        // Get fresh device identifier
        if let identifierForVendor = UIDevice.current.identifierForVendor {
            self.deviceIdentifier = identifierForVendor.uuidString
        } else {
            self.deviceIdentifier = "Unavailable"
        }
    }
}

#Preview {
    ContentView()
}
