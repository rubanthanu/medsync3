<?php
use Dompdf\Dompdf;

class PDFHelper {
    /**
     * Generate a PDF from HTML and save it to a file.
     *
     * @param string $html The HTML content for the PDF
     * @param string $filename The output filename
     * @param string $targetDir Absolute path to the target directory
     * @return string The filename of the generated PDF
     */
    public static function generatePDF($html, $filename, $targetDir) {
        if (!file_exists($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        $dompdf = new Dompdf();
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();
        $pdf_content = $dompdf->output();

        file_put_contents($targetDir . $filename, $pdf_content);

        return $filename;
    }

    /**
     * Get the HTML for a doctor's digital signature, or a fallback electronic signature block.
     *
     * @param string|null $signaturePath Relative path to the signature image file
     * @param string $doctorName The doctor's full name
     * @param string $style Optional inline style for the image
     * @return string HTML string for the signature
     */
    public static function getDoctorSignatureHtml($signaturePath, $doctorName, $style = "max-height:80px; max-width:200px; display:block; margin: 10px auto;") {
        $sig_html = "";

        if (extension_loaded('gd') && !empty($signaturePath)) {
            $sig_path = __DIR__ . '/../' . $signaturePath;
            if (file_exists($sig_path)) {
                $sig_data = base64_encode(file_get_contents($sig_path));
                $sig_html = "<img src='data:image/png;base64,{$sig_data}' style='{$style}' />";
            }
        }

        if (empty($sig_html)) {
            $sig_html = "<div style='margin-bottom: 5px;'><div style='display:inline-block; padding: 5px 12px; border: 1px solid #1a4d80; border-radius: 4px; color: #1a4d80; font-weight: 700; font-size: 14px;'>Electronically Signed</div></div>";
        }

        return $sig_html;
    }
}
?>
