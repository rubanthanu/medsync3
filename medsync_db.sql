-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 28, 2026 at 09:20 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `medsync_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `active_windows`
--

CREATE TABLE `active_windows` (
  `active_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `window_id` int(11) NOT NULL,
  `appointment_date` date NOT NULL,
  `status` enum('Ongoing','Finished') DEFAULT 'Ongoing',
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ended_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_profiles`
--

CREATE TABLE `admin_profiles` (
  `admin_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin_profiles`
--

INSERT INTO `admin_profiles` (`admin_id`, `user_id`, `created_at`) VALUES
(1, 3, '2026-05-26 11:17:34');

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `appointment_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `window_id` int(11) NOT NULL,
  `appointment_date` date NOT NULL,
  `queue_number` int(11) NOT NULL,
  `appointment_status` enum('Booked','Walk-In','Current','Completed','Absent','Cancelled') DEFAULT 'Booked',
  `estimated_time` time DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`appointment_id`, `patient_id`, `doctor_id`, `window_id`, `appointment_date`, `queue_number`, `appointment_status`, `estimated_time`, `created_by`, `created_at`) VALUES
(20, 2, 1, 3, '2026-05-27', 1, 'Completed', '12:54:00', 8, '2026-05-27 18:48:32'),
(21, 1, 1, 1, '2026-05-27', 1, 'Walk-In', '07:54:00', 5, '2026-05-27 19:39:03'),
(24, 2, 1, 4, '2026-05-28', 1, 'Booked', '14:54:00', 8, '2026-05-28 06:57:30');

--
-- Triggers `appointments`
--
DELIMITER $$
CREATE TRIGGER `auto_estimated_time` BEFORE INSERT ON `appointments` FOR EACH ROW BEGIN
    DECLARE startTime TIME;
    DECLARE endTime TIME;
    DECLARE maxAllowed INT;
    DECLARE totalMinutes INT;
    DECLARE timePerPatient DECIMAL(10,2);
    DECLARE bufferMinutes DECIMAL(10,2);

    SELECT start_time, end_time, max_slots
    INTO startTime, endTime, maxAllowed
    FROM appointment_windows
    WHERE window_id = NEW.window_id;

    SET totalMinutes = TIMESTAMPDIFF(MINUTE, startTime, endTime);

    SET timePerPatient = totalMinutes / maxAllowed;

    SET bufferMinutes = timePerPatient / 2;

    SET NEW.estimated_time = TIMESTAMPADD(
        MINUTE,
        ROUND(((NEW.queue_number - 1) * timePerPatient) - bufferMinutes),
        CONCAT(NEW.appointment_date, ' ', startTime)
    );
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `auto_queue_number` BEFORE INSERT ON `appointments` FOR EACH ROW BEGIN
    DECLARE next_queue INT;
    DECLARE max_allowed INT;

    SELECT max_slots
    INTO max_allowed
    FROM appointment_windows
    WHERE window_id = NEW.window_id;

    SELECT COUNT(*) + 1
    INTO next_queue
    FROM appointments
    WHERE appointment_date = NEW.appointment_date
      AND window_id = NEW.window_id
      AND appointment_status IN ('Booked','Walk-In','Current');

    IF next_queue > max_allowed THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'This appointment window is full for selected date';
    ELSE
        SET NEW.queue_number = next_queue;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `appointment_windows`
--

CREATE TABLE `appointment_windows` (
  `window_id` int(11) NOT NULL,
  `window_name` varchar(50) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `max_slots` int(11) DEFAULT 10,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointment_windows`
--

INSERT INTO `appointment_windows` (`window_id`, `window_name`, `start_time`, `end_time`, `max_slots`, `is_active`) VALUES
(1, 'Window 1', '08:00:00', '10:00:00', 10, 1),
(2, 'Window 2', '10:00:00', '12:00:00', 10, 1),
(3, 'Window 3', '13:00:00', '15:00:00', 10, 1),
(4, 'Window 4', '15:00:00', '17:00:00', 10, 1);

-- --------------------------------------------------------

--
-- Table structure for table `checkup_history`
--

CREATE TABLE `checkup_history` (
  `history_id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `diagnosis` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `checkup_history`
--

INSERT INTO `checkup_history` (`history_id`, `appointment_id`, `patient_id`, `doctor_id`, `diagnosis`, `notes`, `created_at`) VALUES
(4, 20, 2, 1, 'fytfyu', 'hhjgj', '2026-05-27 19:52:59');

-- --------------------------------------------------------

--
-- Table structure for table `doctors`
--

CREATE TABLE `doctors` (
  `doctor_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `digital_signature` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctors`
--

INSERT INTO `doctors` (`doctor_id`, `user_id`, `specialization`, `digital_signature`, `created_at`) VALUES
(1, 4, 'General Physician', 'uploads/signatures/sig_4_1779868340.png', '2026-05-26 11:17:34');

-- --------------------------------------------------------

--
-- Table structure for table `doctor_leaves`
--

CREATE TABLE `doctor_leaves` (
  `leave_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `leave_date` date NOT NULL,
  `reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `email_logs`
--

CREATE TABLE `email_logs` (
  `email_log_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `recipient_email` varchar(100) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `email_status` enum('Sent','Failed','Pending') DEFAULT 'Pending',
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE `feedback` (
  `feedback_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `feedback_text` text NOT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `health_posts`
--

CREATE TABLE `health_posts` (
  `post_id` int(11) NOT NULL,
  `uploaded_by` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `category` varchar(50) NOT NULL DEFAULT 'Wellness',
  `image_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `health_posts`
--

INSERT INTO `health_posts` (`post_id`, `uploaded_by`, `title`, `content`, `created_at`, `category`, `image_url`) VALUES
(2, 3, 'Drink Water', 'Drink 5L per Day', '2026-05-27 19:20:14', 'Wellness', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `medical_certificates`
--

CREATE TABLE `medical_certificates` (
  `certificate_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `doctor_id` int(11) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `reason` text DEFAULT NULL,
  `proof_pdf` varchar(255) NOT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `certificate_pdf` varchar(255) DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `notification_type` varchar(50) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `user_id`, `message`, `notification_type`, `is_read`, `created_at`) VALUES
(30, 9, 'Your medical certificate request has been approved and is ready to download.', 'Certificate', 0, '2026-05-27 20:03:56'),
(31, 9, 'Your medical certificate request has been approved and is ready to download.', 'Certificate', 0, '2026-05-27 20:14:00'),
(32, 9, 'Your medical certificate request has been approved and is ready to download.', 'Certificate', 0, '2026-05-27 20:24:37'),
(33, 9, 'Your medical certificate request has been approved and is ready to download.', 'Certificate', 0, '2026-05-27 20:29:03'),
(34, 8, 'Your medical certificate request has been approved and is ready to download.', 'Certificate', 0, '2026-05-28 05:49:20'),
(35, 8, 'Your medical certificate request has been approved and is ready to download.', 'Certificate', 0, '2026-05-28 06:10:08'),
(36, 8, 'Your appointment is booked for 2026-05-28. Queue number: 1. Estimated time: 07:54 AM', 'Appointment', 0, '2026-05-28 06:23:17'),
(37, 8, 'A new prescription has been generated for you.', 'Prescription', 0, '2026-05-28 06:25:31'),
(38, 9, 'Your medical certificate request has been approved and is ready to download.', 'Certificate', 0, '2026-05-28 06:36:12'),
(39, 8, 'Your appointment is booked for 2026-05-28. Queue number: 1. Estimated time: 12:54 PM', 'Appointment', 0, '2026-05-28 06:56:53'),
(40, 8, 'Your appointment is booked for 2026-05-28. Queue number: 1. Estimated time: 02:54 PM', 'Appointment', 0, '2026-05-28 06:57:30');

-- --------------------------------------------------------

--
-- Table structure for table `otp_verifications`
--

CREATE TABLE `otp_verifications` (
  `otp_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `otp_code` varchar(10) NOT NULL,
  `otp_type` enum('Registration','Forgot Password') NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `otp_verifications`
--

INSERT INTO `otp_verifications` (`otp_id`, `user_id`, `otp_code`, `otp_type`, `expires_at`, `is_used`, `created_at`) VALUES
(4, 8, '239716', 'Registration', '2026-05-27 14:49:11', 1, '2026-05-27 09:04:11'),
(5, 9, '083421', 'Registration', '2026-05-27 19:00:16', 1, '2026-05-27 13:15:16'),
(6, 8, '877666', 'Forgot Password', '2026-05-27 20:13:46', 1, '2026-05-27 14:28:46');

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `patient_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `university_id` varchar(50) DEFAULT NULL,
  `blood_group` varchar(10) DEFAULT NULL,
  `allergies` text DEFAULT NULL,
  `medical_conditions` text DEFAULT NULL,
  `emergency_contact_name` varchar(100) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`patient_id`, `user_id`, `university_id`, `blood_group`, `allergies`, `medical_conditions`, `emergency_contact_name`, `emergency_contact_phone`, `created_at`) VALUES
(1, 6, 'cst23085', 'A+', '', '', 'naruto uzumaki', '0779866456', '2026-05-26 11:17:34'),
(2, 8, 'cst23086', 'B-', '', '', 'Father', '0779866444', '2026-05-27 09:04:39'),
(3, 9, 'cst23091', 'B+', '', '', 'Thanu', '0703107202', '2026-05-27 13:16:05');

-- --------------------------------------------------------

--
-- Table structure for table `pdf_documents`
--

CREATE TABLE `pdf_documents` (
  `document_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `document_type` enum('Prescription','Medical Certificate') NOT NULL,
  `related_id` int(11) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `generated_by` int(11) DEFAULT NULL,
  `generated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pdf_documents`
--

INSERT INTO `pdf_documents` (`document_id`, `patient_id`, `document_type`, `related_id`, `file_path`, `generated_by`, `generated_at`) VALUES
(1, 2, 'Medical Certificate', 2, 'cert_6a16c40a76565.pdf', 4, '2026-05-27 10:14:34'),
(2, 1, 'Medical Certificate', 1, 'cert_6a16c5a267e86.pdf', 4, '2026-05-27 10:21:22'),
(3, 1, 'Prescription', 1, 'presc_6a16c8a5dc70f.pdf', 4, '2026-05-27 10:34:13'),
(4, 2, 'Medical Certificate', 3, 'cert_6a16e88c47109.pdf', 4, '2026-05-27 12:50:20'),
(5, 2, 'Prescription', 2, 'presc_6a16e92c99864.pdf', 4, '2026-05-27 12:53:00'),
(6, 2, 'Prescription', 3, 'presc_6a17300a11042.pdf', 4, '2026-05-27 17:55:22'),
(7, 2, 'Prescription', 4, 'presc_6a174b9b7bed1.pdf', 4, '2026-05-27 19:52:59'),
(8, 3, 'Medical Certificate', 4, 'cert_6a174e2c8a338.pdf', 4, '2026-05-27 20:03:56'),
(9, 3, 'Medical Certificate', 5, 'cert_6a1750881126e.pdf', 4, '2026-05-27 20:14:00'),
(10, 3, 'Medical Certificate', 6, 'cert_6a1753051a0d4.pdf', 4, '2026-05-27 20:24:37'),
(11, 3, 'Medical Certificate', 7, 'cert_6a17540f06026.pdf', 4, '2026-05-27 20:29:03'),
(12, 2, 'Medical Certificate', 8, 'cert_6a17d7604e86b.pdf', 4, '2026-05-28 05:49:20'),
(13, 2, 'Medical Certificate', 9, 'cert_6a17dc40b1e53.pdf', 4, '2026-05-28 06:10:08'),
(14, 2, 'Prescription', 5, 'presc_6a17dfdbd5cb3.pdf', 4, '2026-05-28 06:25:31'),
(15, 3, 'Medical Certificate', 10, 'cert_6a17e25c976d6.pdf', 4, '2026-05-28 06:36:12');

-- --------------------------------------------------------

--
-- Table structure for table `prescriptions`
--

CREATE TABLE `prescriptions` (
  `prescription_id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `medicines` text NOT NULL,
  `dosage` text DEFAULT NULL,
  `instructions` text DEFAULT NULL,
  `prescription_pdf` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `prescriptions`
--

INSERT INTO `prescriptions` (`prescription_id`, `appointment_id`, `patient_id`, `doctor_id`, `medicines`, `dosage`, `instructions`, `prescription_pdf`, `created_at`) VALUES
(4, 20, 2, 1, 'jbkjbjk', 'nknk', 'hbjbj', 'presc_6a174b9b7bed1.pdf', '2026-05-27 19:52:59');

-- --------------------------------------------------------

--
-- Table structure for table `profile_logs`
--

CREATE TABLE `profile_logs` (
  `log_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(100) DEFAULT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `log_time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `profile_logs`
--

INSERT INTO `profile_logs` (`log_id`, `user_id`, `action`, `old_value`, `new_value`, `log_time`) VALUES
(2, 6, 'Profile Completed', NULL, NULL, '2026-05-27 07:14:05'),
(7, 4, 'Profile Updated', NULL, NULL, '2026-05-27 07:51:28'),
(8, 4, 'Profile Updated', NULL, NULL, '2026-05-27 07:52:18'),
(9, 4, 'Profile Updated', NULL, NULL, '2026-05-27 07:52:20'),
(10, 8, 'Profile Completed', NULL, NULL, '2026-05-27 09:06:15'),
(11, 9, 'Profile Completed', NULL, NULL, '2026-05-27 13:17:42'),
(12, 8, 'Profile Updated', NULL, NULL, '2026-05-27 18:59:40');

-- --------------------------------------------------------

--
-- Table structure for table `receptionists`
--

CREATE TABLE `receptionists` (
  `receptionist_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `receptionists`
--

INSERT INTO `receptionists` (`receptionist_id`, `user_id`, `created_at`) VALUES
(1, 5, '2026-05-26 11:17:34');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_name`) VALUES
(1, 'Admin'),
(2, 'Doctor'),
(4, 'Patient'),
(3, 'Receptionist');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `address` text DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `account_status` enum('Active','Blocked','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `role_id`, `email`, `password`, `full_name`, `phone`, `gender`, `date_of_birth`, `address`, `profile_image`, `is_verified`, `account_status`, `created_at`, `updated_at`) VALUES
(3, 1, 'admin@std.uwu.ac.lk', '$2y$10$ENwxpwtGuTw/ffyKKtd0FeujaIzvGFA0TCLkg3eJSSayy2AFEN28a', 'System Admin', NULL, NULL, NULL, NULL, NULL, 1, 'Active', '2026-05-26 11:17:34', '2026-05-26 11:17:34'),
(4, 2, 'doctor@std.uwu.ac.lk', '$2y$10$ENwxpwtGuTw/ffyKKtd0FeujaIzvGFA0TCLkg3eJSSayy2AFEN28a', 'Dr. John Doe', '096965885', 'Male', '2026-05-28', 'jaffna', NULL, 1, 'Active', '2026-05-26 11:17:34', '2026-05-27 07:52:18'),
(5, 3, 'receptionist@std.uwu.ac.lk', '$2y$10$ENwxpwtGuTw/ffyKKtd0FeujaIzvGFA0TCLkg3eJSSayy2AFEN28a', 'Jane Smith', NULL, NULL, NULL, NULL, NULL, 1, 'Active', '2026-05-26 11:17:34', '2026-05-26 11:17:34'),
(6, 4, 'patient@std.uwu.ac.lk', '$2y$10$ENwxpwtGuTw/ffyKKtd0FeujaIzvGFA0TCLkg3eJSSayy2AFEN28a', 'Test Patient', '0779866444', 'Male', '2026-05-14', 'jaffna', NULL, 1, 'Active', '2026-05-26 11:17:34', '2026-05-27 07:14:05'),
(8, 4, 'cst23086@std.uwu.ac.lk', '$2y$10$YCntD/IhFasCJBFgkNQvJugUBQ2tKGMxtKsVDFH5eyu.YEqk/gPeS', 'Thanu', '0779866444', 'Male', '2003-05-24', 'Jaffna', 'uploads/profiles/profile_8_1779908380.jpg', 1, 'Active', '2026-05-27 09:04:11', '2026-05-27 18:59:40'),
(9, 4, 'cst23091@std.uwu.ac.lk', '$2y$10$C2GlmXmG2DHvuc6xVtXP1Ob9To6M4h3.cdHOi9uu7hPvmtY0k6Pwm', 'Lukirtha', '0703107202', 'Male', '2003-05-01', 'Jaffna', NULL, 1, 'Active', '2026-05-27 13:15:16', '2026-05-27 13:17:42');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `active_windows`
--
ALTER TABLE `active_windows`
  ADD PRIMARY KEY (`active_id`),
  ADD UNIQUE KEY `doctor_id` (`doctor_id`,`window_id`,`appointment_date`),
  ADD KEY `window_id` (`window_id`);

--
-- Indexes for table `admin_profiles`
--
ALTER TABLE `admin_profiles`
  ADD PRIMARY KEY (`admin_id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`appointment_id`),
  ADD UNIQUE KEY `appointment_date` (`appointment_date`,`window_id`,`queue_number`),
  ADD UNIQUE KEY `patient_id` (`patient_id`,`appointment_date`),
  ADD KEY `doctor_id` (`doctor_id`),
  ADD KEY `window_id` (`window_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `appointment_windows`
--
ALTER TABLE `appointment_windows`
  ADD PRIMARY KEY (`window_id`);

--
-- Indexes for table `checkup_history`
--
ALTER TABLE `checkup_history`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `appointment_id` (`appointment_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indexes for table `doctors`
--
ALTER TABLE `doctors`
  ADD PRIMARY KEY (`doctor_id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `doctor_leaves`
--
ALTER TABLE `doctor_leaves`
  ADD PRIMARY KEY (`leave_id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indexes for table `email_logs`
--
ALTER TABLE `email_logs`
  ADD PRIMARY KEY (`email_log_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `feedback`
--
ALTER TABLE `feedback`
  ADD PRIMARY KEY (`feedback_id`),
  ADD KEY `patient_id` (`patient_id`);

--
-- Indexes for table `health_posts`
--
ALTER TABLE `health_posts`
  ADD PRIMARY KEY (`post_id`),
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indexes for table `medical_certificates`
--
ALTER TABLE `medical_certificates`
  ADD PRIMARY KEY (`certificate_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `otp_verifications`
--
ALTER TABLE `otp_verifications`
  ADD PRIMARY KEY (`otp_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`patient_id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `pdf_documents`
--
ALTER TABLE `pdf_documents`
  ADD PRIMARY KEY (`document_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `generated_by` (`generated_by`);

--
-- Indexes for table `prescriptions`
--
ALTER TABLE `prescriptions`
  ADD PRIMARY KEY (`prescription_id`),
  ADD KEY `appointment_id` (`appointment_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indexes for table `profile_logs`
--
ALTER TABLE `profile_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `receptionists`
--
ALTER TABLE `receptionists`
  ADD PRIMARY KEY (`receptionist_id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `role_id` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `active_windows`
--
ALTER TABLE `active_windows`
  MODIFY `active_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=211;

--
-- AUTO_INCREMENT for table `admin_profiles`
--
ALTER TABLE `admin_profiles`
  MODIFY `admin_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `appointment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `appointment_windows`
--
ALTER TABLE `appointment_windows`
  MODIFY `window_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `checkup_history`
--
ALTER TABLE `checkup_history`
  MODIFY `history_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `doctors`
--
ALTER TABLE `doctors`
  MODIFY `doctor_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `doctor_leaves`
--
ALTER TABLE `doctor_leaves`
  MODIFY `leave_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `email_logs`
--
ALTER TABLE `email_logs`
  MODIFY `email_log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `feedback`
--
ALTER TABLE `feedback`
  MODIFY `feedback_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `health_posts`
--
ALTER TABLE `health_posts`
  MODIFY `post_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `medical_certificates`
--
ALTER TABLE `medical_certificates`
  MODIFY `certificate_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `otp_verifications`
--
ALTER TABLE `otp_verifications`
  MODIFY `otp_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `patient_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `pdf_documents`
--
ALTER TABLE `pdf_documents`
  MODIFY `document_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `prescriptions`
--
ALTER TABLE `prescriptions`
  MODIFY `prescription_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `profile_logs`
--
ALTER TABLE `profile_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `receptionists`
--
ALTER TABLE `receptionists`
  MODIFY `receptionist_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `active_windows`
--
ALTER TABLE `active_windows`
  ADD CONSTRAINT `active_windows_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`),
  ADD CONSTRAINT `active_windows_ibfk_2` FOREIGN KEY (`window_id`) REFERENCES `appointment_windows` (`window_id`);

--
-- Constraints for table `admin_profiles`
--
ALTER TABLE `admin_profiles`
  ADD CONSTRAINT `admin_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`),
  ADD CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`window_id`) REFERENCES `appointment_windows` (`window_id`),
  ADD CONSTRAINT `appointments_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `checkup_history`
--
ALTER TABLE `checkup_history`
  ADD CONSTRAINT `checkup_history_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`),
  ADD CONSTRAINT `checkup_history_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `checkup_history_ibfk_3` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`);

--
-- Constraints for table `doctors`
--
ALTER TABLE `doctors`
  ADD CONSTRAINT `doctors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `doctor_leaves`
--
ALTER TABLE `doctor_leaves`
  ADD CONSTRAINT `doctor_leaves_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`);

--
-- Constraints for table `email_logs`
--
ALTER TABLE `email_logs`
  ADD CONSTRAINT `email_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `feedback`
--
ALTER TABLE `feedback`
  ADD CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`);

--
-- Constraints for table `health_posts`
--
ALTER TABLE `health_posts`
  ADD CONSTRAINT `health_posts_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `medical_certificates`
--
ALTER TABLE `medical_certificates`
  ADD CONSTRAINT `medical_certificates_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `medical_certificates_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `otp_verifications`
--
ALTER TABLE `otp_verifications`
  ADD CONSTRAINT `otp_verifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `patients`
--
ALTER TABLE `patients`
  ADD CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `pdf_documents`
--
ALTER TABLE `pdf_documents`
  ADD CONSTRAINT `pdf_documents_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `pdf_documents_ibfk_2` FOREIGN KEY (`generated_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `prescriptions`
--
ALTER TABLE `prescriptions`
  ADD CONSTRAINT `prescriptions_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`),
  ADD CONSTRAINT `prescriptions_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `prescriptions_ibfk_3` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`doctor_id`);

--
-- Constraints for table `profile_logs`
--
ALTER TABLE `profile_logs`
  ADD CONSTRAINT `profile_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `receptionists`
--
ALTER TABLE `receptionists`
  ADD CONSTRAINT `receptionists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
