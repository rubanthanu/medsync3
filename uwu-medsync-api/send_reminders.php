<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/EmailHelper.php';

/**
 * This script should be run via a Cron Job every hour (e.g., at the start of every hour).
 * It notifies patients 1 hour before their appointment window starts.
 */

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Query to find appointments for windows starting in 1 hour
    $query = "SELECT a.appointment_id, p.user_id, w.window_name, w.start_time, u.full_name, u.email
              FROM appointments a
              JOIN appointment_windows w ON a.window_id = w.window_id
              JOIN patients p ON a.patient_id = p.patient_id
              JOIN users u ON p.user_id = u.user_id
              WHERE a.appointment_date = CURDATE()
                AND a.appointment_status IN ('Booked', 'Walk-In')
                AND HOUR(w.start_time) = HOUR(DATE_ADD(NOW(), INTERVAL 1 HOUR))
                AND NOT EXISTS (
                    SELECT 1 FROM notifications n 
                    WHERE n.user_id = p.user_id 
                    AND n.message LIKE 'You have appointment%' 
                    AND DATE(n.created_at) = CURDATE()
                )";

    $stmt = $conn->prepare($query);
    $stmt->execute();
    $reminders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $count = 0;
    foreach ($reminders as $row) {
        $user_id = $row['user_id'];
        $email = $row['email'];
        $window_name = $row['window_name'];
        $start_time = date('h:i A', strtotime($row['start_time']));
        
        $message = "You have appointment in {$window_name} ({$start_time})";
        
        // 1. App Notification
        $notif_query = "INSERT INTO notifications (user_id, message, notification_type) 
                        VALUES (:uid, :msg, 'Reminder')";
        $notif_stmt = $conn->prepare($notif_query);
        $notif_stmt->bindParam(":uid", $user_id);
        $notif_stmt->bindParam(":msg", $message);
        $notif_stmt->execute();

        // 2. Email Notification
        $email_body = "<h3>Appointment Reminder</h3>
                       <p>Hello {$row['full_name']},</p>
                       <p>This is a reminder that you have an appointment scheduled for today:</p>
                       <ul>
                           <li><strong>Window:</strong> {$window_name}</li>
                           <li><strong>Starts at:</strong> {$start_time}</li>
                       </ul>
                       <p>Please arrive on time. Thank you!</p>";
        
        EmailHelper::sendEmail($email, "Appointment Reminder - UWU MedSync", $email_body);
        
        $count++;
        echo "Sent reminder to: {$email}\n";
    }

    echo "Total reminders sent: {$count}\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>