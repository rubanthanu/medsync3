<?php
class AppointmentRepository {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    public function getWindows($date) {
        $query = "SELECT aw.*, 
                  (SELECT COUNT(*) FROM appointments a WHERE a.window_id = aw.window_id AND a.appointment_date = :date AND a.appointment_status IN ('Booked', 'Walk-In', 'Current')) as booked_count,
                  (SELECT COUNT(*) FROM active_windows act WHERE act.window_id = aw.window_id AND act.appointment_date = :date AND act.status = 'Ongoing') as is_active 
                  FROM appointment_windows aw";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":date", $date);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getWindowById($windowId) {
        $query = "SELECT start_time, end_time, max_slots FROM appointment_windows WHERE window_id = :window_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":window_id", $windowId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getBookedCount($windowId, $date) {
        $query = "SELECT COUNT(*) as current_count FROM appointments 
                  WHERE window_id = :window_id AND appointment_date = :date 
                  AND appointment_status IN ('Booked', 'Walk-In', 'Current')";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":window_id", $windowId);
        $stmt->bindParam(":date", $date);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC)['current_count'];
    }

    public function hasExistingAppointment($patientId, $date) {
        $query = "SELECT appointment_id FROM appointments WHERE patient_id = :patient_id AND appointment_date = :date AND appointment_status IN ('Booked', 'Walk-In', 'Current')";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":patient_id", $patientId);
        $stmt->bindParam(":date", $date);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function create($patientId, $doctorId, $windowId, $date, $status, $createdBy, $queueNumber, $estimatedTime) {
        $query = "INSERT INTO appointments (patient_id, doctor_id, window_id, appointment_date, appointment_status, created_by, queue_number, estimated_time) 
                  VALUES (:patient_id, :doctor_id, :window_id, :date, :status, :created_by, :queue, :est)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":patient_id", $patientId);
        $stmt->bindParam(":doctor_id", $doctorId);
        $stmt->bindParam(":window_id", $windowId);
        $stmt->bindParam(":date", $date);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":created_by", $createdBy);
        $stmt->bindParam(":queue", $queueNumber);
        $stmt->bindParam(":est", $estimatedTime);
        $stmt->execute();
        return $this->conn->lastInsertId();
    }

    public function updateStatus($appointmentId, $status) {
        $query = "UPDATE appointments SET appointment_status = :status WHERE appointment_id = :appointment_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":appointment_id", $appointmentId);
        $stmt->execute();
    }

    public function findByIdAndUser($appointmentId, $userId) {
        $query = "SELECT p.patient_id, a.appointment_status, a.appointment_date, a.queue_number
                  FROM appointments a
                  JOIN patients p ON a.patient_id = p.patient_id
                  WHERE a.appointment_id = :appointment_id AND p.user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":appointment_id", $appointmentId);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getPatientAppointments($userId) {
        $query = "SELECT a.appointment_id, a.appointment_date, a.queue_number, a.appointment_status, a.estimated_time, a.created_at,
                         aw.window_name, aw.start_time, aw.end_time, u.full_name as doctor_name
                  FROM appointments a
                  JOIN patients p ON a.patient_id = p.patient_id
                  JOIN appointment_windows aw ON a.window_id = aw.window_id
                  LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
                  LEFT JOIN users u ON d.user_id = u.user_id
                  WHERE p.user_id = :user_id
                  ORDER BY a.appointment_date DESC, a.estimated_time DESC, a.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getQueueForWindow($windowId, $date) {
        $query = "SELECT a.appointment_id, a.patient_id, a.queue_number, a.appointment_status, u.full_name as patient_name, u.profile_image, p.user_id as patient_user_id 
                  FROM appointments a 
                  JOIN patients p ON a.patient_id = p.patient_id 
                  JOIN users u ON p.user_id = u.user_id 
                  WHERE a.window_id = :window_id AND a.appointment_date = :date 
                  ORDER BY a.queue_number ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":window_id", $windowId);
        $stmt->bindParam(":date", $date);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findCurrentInWindow($windowId, $date) {
        $query = "SELECT appointment_id FROM appointments WHERE window_id = :window_id AND appointment_date = :date AND appointment_status = 'Current'";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":window_id", $windowId);
        $stmt->bindParam(":date", $date);
        $stmt->execute();
        if ($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        return false;
    }

    public function findNextWalkIn($windowId, $date) {
        $query = "SELECT appointment_id, queue_number FROM appointments WHERE window_id = :window_id AND appointment_date = :date AND appointment_status = 'Walk-In' ORDER BY queue_number ASC LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":window_id", $windowId);
        $stmt->bindParam(":date", $date);
        $stmt->execute();
        if ($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        return false;
    }

    public function getAppointmentsForDoctorOnDate($doctorId, $date) {
        $query = "SELECT a.appointment_id, u.email, u.full_name 
                  FROM appointments a 
                  JOIN patients p ON a.patient_id = p.patient_id 
                  JOIN users u ON p.user_id = u.user_id 
                  WHERE a.doctor_id = :doctor_id AND a.appointment_date = :date 
                  AND a.appointment_status NOT IN ('Cancelled', 'Completed')";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":doctor_id", $doctorId);
        $stmt->bindParam(":date", $date);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAllWindows() {
        $query = "SELECT * FROM appointment_windows";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function updateWindowSlots($windowId, $maxSlots) {
        $query = "UPDATE appointment_windows SET max_slots = :max_slots WHERE window_id = :window_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":max_slots", $maxSlots);
        $stmt->bindParam(":window_id", $windowId);
        $stmt->execute();
    }

    public function isWindowActive($windowId, $date) {
        $query = "SELECT active_id FROM active_windows WHERE window_id = :window_id AND appointment_date = :date AND status = 'Ongoing'";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":window_id", $windowId);
        $stmt->bindParam(":date", $date);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function startWindow($doctorId, $windowId, $date) {
        $query = "INSERT INTO active_windows (doctor_id, window_id, appointment_date, status) VALUES (:doctor_id, :window_id, :date, 'Ongoing')";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":doctor_id", $doctorId);
        $stmt->bindParam(":window_id", $windowId);
        $stmt->bindParam(":date", $date);
        $stmt->execute();
    }

    public function stopWindow($windowId, $date) {
        $query = "UPDATE active_windows SET status = 'Finished', ended_at = NOW() 
                  WHERE window_id = :window_id AND appointment_date = :date AND status = 'Ongoing'";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":window_id", $windowId);
        $stmt->bindParam(":date", $date);
        $stmt->execute();
    }

    public function getTotalCount() {
        $stmt = $this->conn->query("SELECT COUNT(*) as count FROM appointments");
        return $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    }
}
?>
