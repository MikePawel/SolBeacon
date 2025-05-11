import Foundation
import CoreLocation
import UserNotifications

class BeaconDetector: NSObject, ObservableObject, CLLocationManagerDelegate {
    @Published var isBeaconDetected = false
    @Published var proximityString = "Unknown"
    @Published var authorizationStatus = "Unknown"
    @Published var deviceIdentifier = "Unknown"
    @Published var lastPaymentResponse: String? = nil
    @Published var transactionStatus: [String]? = nil
    
    private var paymentService: PaymentService?
    private let locationManager = CLLocationManager()
    let beaconRegion: CLBeaconRegion
    private var lastSentProximity: CLProximity?
    private var beaconLostTime: Date? = nil
    private let requiredLostTimeForNotification: TimeInterval = 10.0
    
    private var lastNotificationTime: Date? = nil
    private var minTimeBetweenNotifications: TimeInterval = 5.0
    private var isProcessingDetection = false
    private var detectionQueue = DispatchQueue(label: "com.beacon.detectionQueue")
    private let userDefaultsQueue = DispatchQueue(label: "com.beacon.userDefaultsQueue", qos: .background)
    private var isMonitoring = false
    
    override init() {
        let uuid = UUID(uuidString: "FA4F992B-0F59-4E61-B0FB-457308078CAB")!
        beaconRegion = CLBeaconRegion(uuid: uuid, major: 1, minor: 1, identifier: "MyBeacon")
        
        super.init()
        
        self.paymentService = PaymentService()
        
        beaconRegion.notifyOnEntry = true
        beaconRegion.notifyOnExit = true
        beaconRegion.notifyEntryStateOnDisplay = true
        
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
        userDefaultsQueue.async { [weak self] in
            if let savedID = UserDefaults.standard.string(forKey: "device_identifier") {
                DispatchQueue.main.async {
                    self?.deviceIdentifier = savedID
                }
                return
            }
            
            if let identifierForVendor = UIDevice.current.identifierForVendor {
                let id = identifierForVendor.uuidString
                DispatchQueue.main.async {
                    self?.deviceIdentifier = id
                }
                
                UserDefaults.standard.set(id, forKey: "device_identifier")
            } else {
                DispatchQueue.main.async {
                    self?.deviceIdentifier = "Unavailable"
                }
            }
        }
    }
    
    // MARK: - Location Manager Delegate Methods
    
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        DispatchQueue.main.async {
            switch status {
            case .authorizedAlways:
                self.authorizationStatus = "Authorized Always"
                self.startScanning()
            case .authorizedWhenInUse:
                self.authorizationStatus = "Authorized When In Use"
            case .denied:
                self.authorizationStatus = "Denied"
            case .restricted:
                self.authorizationStatus = "Restricted"
            case .notDetermined:
                self.authorizationStatus = "Not Determined"
            @unknown default:
                self.authorizationStatus = "Unknown"
            }
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didRange beacons: [CLBeacon], satisfying beaconConstraint: CLBeaconIdentityConstraint) {
        print("Ranging beacons: Found \(beacons.count) beacons")
        
        detectionQueue.async { [weak self] in
            guard let self = self else { return }
            
            if self.isProcessingDetection {
                print("Already processing detection - skipping")
                return
            }
            
            self.isProcessingDetection = true
            
            let nearestBeacon = beacons.first
            
            DispatchQueue.main.async {
                if let nearestBeacon = nearestBeacon {
                    print("Nearest beacon: UUID: \(nearestBeacon.uuid.uuidString)")
                    print("Major: \(nearestBeacon.major), Minor: \(nearestBeacon.minor)")
                    
                    let now = Date()
                    let shouldNotifyNewDetection = !self.isBeaconDetected
                    let shouldNotifyReappearance = self.beaconLostTime != nil && 
                                                 now.timeIntervalSince(self.beaconLostTime!) >= self.requiredLostTimeForNotification
                    let enoughTimeSinceLastNotification = self.lastNotificationTime == nil || 
                                                        now.timeIntervalSince(self.lastNotificationTime!) >= self.minTimeBetweenNotifications
                    
                    let shouldNotify = (shouldNotifyNewDetection || shouldNotifyReappearance) && enoughTimeSinceLastNotification
                    
                    if shouldNotify {
                        print("Sending notification - condition: new=\(shouldNotifyNewDetection), reappear=\(shouldNotifyReappearance), timeout=\(enoughTimeSinceLastNotification)")
                        self.callPaymentAPIAndNotify()
                        self.lastNotificationTime = now
                    }
                    
                    self.beaconLostTime = nil
                    self.isBeaconDetected = true
                    
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
    
    func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
        print("Entered region: \(region.identifier)")
        
        if let beaconRegion = region as? CLBeaconRegion {
            locationManager.startRangingBeacons(satisfying: beaconRegion.beaconIdentityConstraint)
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didExitRegion region: CLRegion) {
        print("Exited region: \(region.identifier)")
        DispatchQueue.main.async {
            if self.isBeaconDetected {
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
            case .outside:
                print("Outside beacon region")
                locationManager.stopRangingBeacons(satisfying: beaconRegion.beaconIdentityConstraint)
                if self.isBeaconDetected {
                    self.beaconLostTime = Date()
                }
                self.isBeaconDetected = false
            case .unknown:
                print("Unknown beacon region state")
                self.restartScanning()
            }
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location manager failed with error: \(error.localizedDescription)")
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
            self?.restartScanning()
        }
    }
    
    func locationManager(_ manager: CLLocationManager, monitoringDidFailFor region: CLRegion?, withError error: Error) {
        print("Monitoring failed for region \(region?.identifier ?? "unknown"): \(error.localizedDescription)")
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
            self?.restartScanning()
        }
    }
    
    // MARK: - Public Methods
    
    func startScanning() {
        if isMonitoring {
            return
        }
        
        if locationManager.authorizationStatus == .authorizedAlways {
            print("Starting to scan for beacons...")
            
            locationManager.stopMonitoring(for: beaconRegion)
            locationManager.stopRangingBeacons(satisfying: beaconRegion.beaconIdentityConstraint)
            
            locationManager.startMonitoring(for: beaconRegion)
            locationManager.startRangingBeacons(satisfying: beaconRegion.beaconIdentityConstraint)
            
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
    
    func updateDeviceIdentifier(_ newDeviceID: String) {
        self.deviceIdentifier = newDeviceID
        userDefaultsQueue.async {
            UserDefaults.standard.set(newDeviceID, forKey: "device_identifier")
        }
    }
    
    func resetToDefaultIdentifier() {
        userDefaultsQueue.async {
            UserDefaults.standard.removeObject(forKey: "device_identifier")
        }
        
        if let identifierForVendor = UIDevice.current.identifierForVendor {
            self.deviceIdentifier = identifierForVendor.uuidString
        } else {
            self.deviceIdentifier = "Unavailable"
        }
    }
    
    // MARK: - Private Methods
    
    private func callPaymentAPIAndNotify() {
        showNotification(title: "Beacon Detected", message: "Sending transaction now...")
        
        DispatchQueue.main.async {
            self.transactionStatus = ["Beacon Detected", "Sending transaction..."]
        }
        
        paymentService?.requestPayment { result in
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
                
                DispatchQueue.main.async {
                    self.lastPaymentResponse = responseMessage
                    
                    if var currentStatus = self.transactionStatus {
                        currentStatus.append(statusUpdate)
                        self.transactionStatus = currentStatus
                    }
                }
                
                self.showNotification(title: notificationTitle, message: notificationMessage)
            }
        }
    }
    
    private func showNotification(title: String, message: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = message
        content.sound = .default
        content.interruptionLevel = .timeSensitive
        
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
} 