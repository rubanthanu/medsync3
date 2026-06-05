<?php
require_once __DIR__ . '/../repositories/CertificateRepository.php';
require_once __DIR__ . '/../repositories/PatientRepository.php';
require_once __DIR__ . '/../repositories/DoctorRepository.php';
require_once __DIR__ . '/../services/NotificationService.php';
require_once __DIR__ . '/../helpers/PDFHelper.php';
require_once __DIR__ . '/../helpers/UploadHelper.php';
require_once __DIR__ . '/../exceptions/NotFoundException.php';
require_once __DIR__ . '/../exceptions/PermissionException.php';

class CertificateService {
    private $conn;
    private $certificateRepo;
    private $patientRepo;
    private $doctorRepo;
    private $notificationService;

    public function __construct($conn) {
        $this->conn = $conn;
        $this->certificateRepo = new CertificateRepository($conn);
        $this->patientRepo = new PatientRepository($conn);
        $this->doctorRepo = new DoctorRepository($conn);
        $this->notificationService = new NotificationService($conn);
    }

    public function requestCertificate($userId, $startDate, $endDate, $reason, $file) {
        // Upload file
        $target_dir = __DIR__ . "/../uploads/medical_proofs/";
        $file_name = UploadHelper::uploadFile($file, $target_dir);

        if (!$file_name) {
            throw new \Exception("Failed to upload proof file.");
        }

        // Get patient id
        $patient = $this->patientRepo->findByUserId($userId);
        if (!$patient) {
            throw new NotFoundException("Patient record not found.");
        }

        // Insert request
        $this->certificateRepo->create($patient['patient_id'], $startDate, $endDate, $reason, $file_name);
    }

    public function reviewCertificate($userId, $certificateId, $status, $rejectionReason = null) {
        // Get Doctor ID
        $doctor = $this->doctorRepo->findByUserId($userId);

        // Fetch request details
        $cert = $this->certificateRepo->findById($certificateId);
        if (!$cert) {
            throw new NotFoundException("Certificate not found.");
        }

        if ($status == 'Rejected') {
            $this->certificateRepo->updateRejected($certificateId, $doctor['doctor_id'], $rejectionReason);

            // Notify
            $msg = "Your medical certificate request has been rejected. Reason: " . $rejectionReason;
            $this->notificationService->create($cert['patient_user_id'], $msg, 'Certificate');

            return "Request rejected.";
        } else if ($status == 'Approved') {
            // Get doctor signature details
            $doc_details = $this->doctorRepo->getDetailsWithSignature($doctor['doctor_id']);

            $sig_html = PDFHelper::getDoctorSignatureHtml(
                $doc_details['digital_signature'] ?? null,
                $doc_details['doctor_name'] ?? 'Doctor'
            );

            // Calculate Age
            $dob = new DateTime($cert['date_of_birth']);
            $now = new DateTime();
            $age = $now->diff($dob)->y;
            $gender = $cert['gender'] ?? 'N/A';
            $dob_str = $cert['date_of_birth'] ?? 'N/A';
            $issue_date = date('Y-m-d', strtotime($cert['reviewed_at'] ?? 'now'));

            // Generate PDF with the exact same HTML template
            $html = "
            <html>
            <head>
                <style>
                    @page { margin: 0; }
                    body { font-family: 'serif'; margin: 0; padding: 0; color: #333; }
                    .cert-wrapper { 
                        padding: 30px; 
                        background: #fff; 
                        border: 15px solid #002D62; 
                        height: 1045px;
                        box-sizing: border-box;
                    }
                    .inner-border { 
                        border: 2px solid #008080; 
                        padding: 40px; 
                        height: 100%; 
                        position: relative;
                        box-sizing: border-box;
                    }
                    .header { text-align: center; margin-bottom: 20px; position: relative; }
                    .clinic-name { color: #002D62; font-size: 36px; font-weight: bold; margin: 0; font-family: sans-serif; }
                    .clinic-sub { color: #555; font-size: 18px; margin: 5px 0; font-family: sans-serif; }
                    .motto { color: #008080; font-size: 11px; letter-spacing: 4px; font-weight: bold; margin-top: 10px; font-family: sans-serif; }
                    
                    .contacts { 
                        position: absolute; top: 10px; right: 10px; 
                        text-align: left; font-size: 11px; color: #444; line-height: 1.4; font-family: sans-serif;
                    }
                    
                    .cert-title-box { text-align: center; margin: 40px 0 20px 0; }
                    .cert-title { 
                        color: #1a4d80; font-size: 48px; font-weight: bold; 
                        text-transform: uppercase; letter-spacing: 2px;
                        border-bottom: 1px solid #ccc; padding-bottom: 15px; display: inline-block;
                    }
                    
                    .certify-intro { color: #008080; text-align: center; font-size: 18px; font-weight: bold; margin: 30px 0; text-transform: uppercase; letter-spacing: 1px; }
                    
                    .field-row { margin-bottom: 25px; font-size: 18px; line-height: 1.5; }
                    .field-label { display: inline-block; }
                    .field-line { border-bottom: 1px solid #1a4d80; display: inline-block; padding: 0 10px; font-weight: bold; color: #000; font-style: italic; }
                    
                    .main-content { font-size: 18px; line-height: 2; margin-top: 10px; }
                    
                    .footer { position: absolute; bottom: 40px; left: 40px; right: 40px; width: 620px; }
                    .date-box { float: left; margin-top: 100px; font-size: 18px; }
                    .stamp-box { float: left; margin-left: 80px; text-align: center; margin-top: 50px; }
                    .signature-box { float: right; text-align: center; width: 280px; }
                    
                    .signature-line { border-top: 1px solid #333; margin-top: 5px; padding-top: 8px; }
                    .dr-name { font-weight: bold; font-size: 20px; color: #1a4d80; margin: 0; }
                    .dr-meta { font-size: 14px; color: #555; margin: 2px 0; }
                    
                    .stamp-circle {
                        border: 2px solid #008080; border-radius: 50%; 
                        width: 100px; height: 100px; 
                        margin: 0 auto; line-height: 1.2;
                        color: #008080; font-weight: bold; font-size: 10px;
                        transform: rotate(-15deg);
                        display: table;
                    }
                    .stamp-text { display: table-cell; vertical-align: middle; padding: 5px; }
                </style>
            </head>
            <body>
                <div class='cert-wrapper'>
                    <div class='inner-border'>
                        <div class='contacts'>
                            <strong>T:</strong> +94 11 222 3333<br>
                            <strong>E:</strong> info@uwumedsync.lk<br>
                            <strong>W:</strong> www.uwumedsync.lk<br>
                            <strong>A:</strong> 123, Wellness Street, Badulla
                        </div>
                        
                        <div class='header'>
                            <h1 class='clinic-name'>UWU-MedSync</h1>
                            <div class='clinic-sub'>Medical Center</div>
                            <div class='motto'>CARE &bull; COMPASSION &bull; EXCELLENCE</div>
                        </div>
                        
                        <div class='cert-title-box'>
                            <div class='cert-title'>Medical Certificate</div>
                        </div>
                        
                        <div class='certify-intro'>This is to certify that</div>
                        
                        <div class='field-row'>
                            Mr. / Ms. / Mrs. <div class='field-line' style='min-width: 480px;'>{$cert['patient_name']}</div>
                        </div>
                        
                        <div class='field-row'>
                            Age <div class='field-line' style='min-width: 80px;'>{$age} Years</div> 
                            &nbsp;&nbsp;|&nbsp;&nbsp; 
                            Gender <div class='field-line' style='min-width: 100px;'>{$gender}</div> 
                            &nbsp;&nbsp;|&nbsp;&nbsp; 
                            Date of Birth <div class='field-line' style='min-width: 130px;'>{$dob_str}</div>
                        </div>
                        
                        <div class='main-content'>
                            has been examined by me on <span class='field-line' style='min-width: 150px;'>{$issue_date}</span> and I certify that he / she is 
                            suffering from <span class='field-line' style='width: 100%; display: block; margin-top: 10px; min-height: 25px;'>{$cert['reason']}</span>
                            <br>
                            <div style='margin-top: 15px;'>
                                <strong>Advice / Remarks:</strong> 
                                <span class='field-line' style='width: 100%; display: block; margin-top: 10px; min-height: 25px;'>Advised complete rest from {$cert['start_date']} to {$cert['end_date']}.</span>
                            </div>
                            
                            <p style='font-size: 15px; margin-top: 40px; color: #555; text-align: center; border-top: 1px dotted #ccc; padding-top: 20px;'>
                                This certificate is issued on the request of the patient for university purposes and does not imply any invalidity.
                            </p>
                        </div>
                        
                        <div class='footer'>
                            <div class='date-box'>
                                <strong>Date:</strong> <span class='field-line' style='min-width: 150px;'>".date('Y-m-d')."</span>
                            </div>
                            
                            <div class='stamp-box'>
                                <div class='stamp-circle'>
                                    <div class='stamp-text'>UWU-MEDSYNC<br>MEDICAL CENTER<br>BADULLA</div>
                                </div>
                            </div>
                            
                            <div class='signature-box'>
                                {$sig_html}
                                <div class='signature-line'>
                                    <p class='dr-name'>Dr. " . ($doc_details['doctor_name'] ?? 'Doctor') . "</p>
                                    <p class='dr-meta'>MBBS, MD (" . ($doc_details['specialization'] ?? 'Specialist') . ")</p>
                                    <p class='dr-meta'>Reg. No: PMC-".rand(1000, 9999)."</p>
                                    <p style='color: #008080; font-weight: bold; font-size: 15px; margin-top: 5px; font-family: sans-serif;'>Consultant Physician</p>
                                </div>
                            </div>
                            <div style='clear: both;'></div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            ";

            $target_dir = __DIR__ . "/../uploads/generated_pdfs/";
            $file_name = "cert_" . uniqid() . ".pdf";
            PDFHelper::generatePDF($html, $file_name, $target_dir);

            // Update DB
            $this->certificateRepo->updateApproved($certificateId, $doctor['doctor_id'], $file_name);

            // Notify
            $msg = "Your medical certificate request has been approved and is ready to download.";
            $this->notificationService->create($cert['patient_user_id'], $msg, 'Certificate');

            return "Request approved and PDF generated.";
        }
    }

    public function getRequests() {
        return $this->certificateRepo->getAll();
    }

    public function getPatientCertificates($userId) {
        return $this->certificateRepo->getByPatientUserId($userId);
    }
}
?>
