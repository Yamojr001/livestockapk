import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

export interface UserIDCardData {
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  assignedLga?: string;
  userId: string;
  agentCode?: string;
}

export interface FarmerIDCardData {
  farmerName: string;
  registrationId?: string;
  contactNumber?: string;
  lga: string;
  ward: string;
  association?: string;
  numberOfAnimals?: number;
  age?: string;
  gender?: string;
  agentName?: string;
  address?: string;
  farmSize?: number;
  livestockType?: string;
  registrationDate?: string;
  validUntil?: string;
  imageUrl?: string;
  village?: string;
}

/* ---------- existing HTML generators (unchanged) ---------- */

const generateUserIDCardHTML = (data: UserIDCardData): string => {
  const roleColor = data.role === "admin" ? "#7c3aed" : "#059669";
  const roleGradient = data.role === "admin" ? "#5b21b6" : "#047857";
  const roleLabel = data.role === "admin" ? "Administrator" : "Field Agent";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=400, height=250" />
      <style>
        html, body { width: 400px; height: 250px; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: 400px 250px; margin: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 0;
          background: transparent;
          display: block;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .card {
          width: 400px;
          height: 250px;
          /* gradient with solid fallback to ensure color in PDF */
          background: linear-gradient(135deg, ${roleColor} 0%, ${roleGradient} 100%);
          background-color: ${roleColor};
          border-radius: 16px;
          padding: 24px;
          color: white;
          position: relative;
          overflow: hidden;
        }
        .pattern1 {
          position: absolute;
          top: -40px;
          right: -40px;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
        }
        .pattern2 {
          position: absolute;
          bottom: -32px;
          left: -32px;
          width: 128px;
          height: 128px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
        }
        .header {
          border-bottom: 1px solid rgba(255,255,255,0.3);
          padding-bottom: 12px;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }
        .header-small { font-size: 10px; opacity: 0.9; }
        .header-main { font-size: 13px; font-weight: bold; margin-top: 2px; }
        .body {
          display: flex;
          gap: 16px;
          position: relative;
          z-index: 1;
        }
        .photo {
          width: 72px;
          height: 72px;
          background: rgba(255,255,255,0.2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
        }
        .details { flex: 1; }
        .detail-row { margin-bottom: 8px; display: flex; align-items: center; }
        .detail-label { font-size: 10px; opacity: 0.75; width: 30%; margin-right: 6px; }
        .detail-value { font-size: 12px; font-weight: 600; flex: 1; text-align: left; margin-left: 6px; }
        .footer {
          border-top: 1px solid rgba(255,255,255,0.3);
          padding-top: 12px;
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          position: relative;
          z-index: 1;
        }
        .role-badge {
          background: rgba(255,255,255,0.2);
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="card" role="document">
        <div class="pattern1"></div>
        <div class="pattern2"></div>
        <div class="header">
          <div class="header-small">Jigawa State</div>
          <div class="header-main">Ministry of Livestock Development</div>
        </div>
        <div class="body">
          <div class="photo">&#128100;</div>
          <div class="details">
            <div class="detail-row">
              <div class="detail-label">Name</div>
              <div class="detail-value">${data.fullName}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Email</div>
              <div class="detail-value">${data.email}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Phone</div>
              <div class="detail-value">${data.phone || "N/A"}</div>
            </div>
            ${data.agentCode ? `
            <div class="detail-row">
              <div class="detail-label">Agent ID</div>
              <div class="detail-value monospace">${data.agentCode}</div>
            </div>
            ` : ''}
          </div>
        </div>
          <div class="footer">
          <div class="role-badge">${roleLabel}</div>
          ${data.assignedLga ? `<div>LGA: ${data.assignedLga}</div>` : "<div>System Access</div>"}
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateFarmerIDCardHTML = (data: FarmerIDCardData): string => {
  const hasImage =
    data.imageUrl && (data.imageUrl.startsWith("http") || data.imageUrl.startsWith("data:image"));

  const imageHTML = hasImage
    ? `<img src="${data.imageUrl}" class="farmer-image" alt="Farmer Photo" />`
    : `<div class="image-placeholder">
         <div class="placeholder-icon">👨‍🌾</div>
         <div class="placeholder-text">Farmer Photo</div>
       </div>`;

  const address = data.village && data.lga ? `${data.village}, ${data.lga}` : data.village || data.lga || "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=400, height=260" />
      <style>
        html, body { width: 400px; height: 260px; }
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        @page { size: 400px 260px; margin: 0; }
        body { 
          margin: 0;
          padding: 0;
          display: block;
          background: transparent;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .card-container {
          width: 400px;
          height: 260px;
          background-color: #057856;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 3px 6px rgba(0,0,0,0.15);
          position: relative;
        }
        
        .quarter-circle {
          position: absolute;
          top: -60px;
          right: -60px;
          width: 120px;
          height: 120px;
          border-radius: 60px;
          background-color: #1e8767;
          opacity: 0.8;
        }
        
        .header {
          padding: 12px;
          text-align: center;
          border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        
        .header-main {
          font-size: 16px;
          font-weight: 700;
          text-align: center;
          color: #FFFFFF;
          margin: 0;
        }
        
        .header-sub {
          font-size: 12px;
          font-weight: 500;
          margin-top: 2px;
          text-align: center;
          color: #E8F5E9;
          margin: 0;
        }
        
        .body {
          display: flex;
          flex-direction: row;
          padding: 15px;
          height: 170px;
        }
        
        .image-section {
          width: 100px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
        }
        
        .farmer-image {
          width: 90px;
          height: 110px;
          border-radius: 4px;
          border: 2px solid #FFFFFF;
          object-fit: cover;
          background-color: #f5f5f5;
        }
        
        .image-placeholder {
          width: 90px;
          height: 110px;
          border-radius: 4px;
          border: 2px solid #FFFFFF;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: rgba(255,255,255,0.1);
        }
        
        .placeholder-icon {
          font-size: 30px;
          color: #FFFFFF;
        }
        
        .placeholder-text {
          font-size: 9px;
          color: #E8F5E9;
          margin-top: 6px;
          text-align: center;
        }
        
        .details-section {
          flex: 1;
          padding-top: 5px;
        }
        
        .field-row {
          margin-bottom: 8px;
          display: flex;
          align-items: center;
        }

        .field-label {
          font-size: 12px;
          font-weight: 600;
          color: #E8F5E9;
          width: 30%;
          display: inline-block;
          margin-right: 6px;
        }

        .field-value {
          font-size: 14px;
          font-weight: 500;
          color: #FFFFFF;
          flex: 1;
          text-align: left;
          margin-left: 6px;
        }
        
        .address-text {
          font-size: 12px;
          color: #E8F5E9;
          font-style: italic;
        }
        
        .monospace {
          font-family: 'Courier New', monospace;
          font-size: 13px;
        }
        
        .valid-row {
          margin-top: 5px;
        }
        
        .valid-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #4CAF50;
        }
        
        .check-icon {
          width: 14px;
          height: 14px;
        }
        
        .footer {
          padding: 8px;
          text-align: center;
          border-top: 1px solid rgba(255,255,255,0.2);
        }
        
        .footer-text {
          font-size: 10px;
          font-weight: 500;
          color: #E8F5E9;
          font-style: italic;
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="card-container" role="document">
        <div class="quarter-circle"></div>
        
        <div class="header">
          <p class="header-main">Jigawa State</p>
          <p class="header-sub">Ministry of Livestock Development</p>
        </div>
        
        <div class="body">
          <div class="image-section">
            ${imageHTML}
          </div>
          
          <div class="details-section">
            <div class="field-row">
              <span class="field-label">Name</span>
              <span class="field-value">${data.farmerName || "N/A"}</span>
            </div>
            
            <div class="field-row">
              <span class="field-label">Reg ID</span>
              <span class="field-value monospace">${data.registrationId || "N/A"}</span>
            </div>
            
            <div class="field-row">
              <span class="field-label">Phone</span>
              <span class="field-value">${data.contactNumber || "N/A"}</span>
            </div>

            <div class="field-row">
              <span class="field-label">LGA</span>
              <span class="field-value">${data.lga || "N/A"}</span>
            </div>
            
            ${address ? `
            <div class="field-row">
              <span class="field-label"></span>
              <span class="field-value address-text">${address}</span>
            </div>
            ` : ''}
            
            <!-- Valid indicator removed from details section; footer shows validity -->
          </div>
        </div>
        
        <div class="footer">
          <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
            <p class="footer-text" style="margin:0;text-align:left;">Official Livestock Farmer ID Card</p>
            <p class="footer-text" style="margin:0;text-align:right;color:#4CAF50;font-weight:600;">Valid</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/* ---------- helpers: print & PDF from captured image ---------- */

/**
 * Prints a captured image URI. The imageUri should be a file:// or data: URI
 * that points to the captured card image (captureRef result 'tmpfile' recommended).
 */
export const printCapturedIDCard = async (imageUri: string): Promise<boolean> => {
  try {
    const html = `
      <!doctype html>
      <html>
        <body style="margin:0;padding:0;display:flex;align-items:center;justify-content:center;">
          <img src="${imageUri}" style="width:400px;height:auto;" />
        </body>
      </html>
    `;
    await Print.printAsync({ html });
    return true;
  } catch (error) {
    console.error("Error printing captured ID card:", error);
    Alert.alert("Error", "Failed to print ID card. Please try again.");
    return false;
  }
};

/**
 * Generates a PDF from a captured image and returns the generated PDF URI
 * (use Print.printToFileAsync). The caller can then share or save the PDF.
 */
export const generatePDFFromImage = async (imageUri: string): Promise<string | null> => {
  try {
    const html = `
      <!doctype html>
      <html>
        <body style="margin:0;padding:0;display:flex;align-items:center;justify-content:center;">
          <img src="${imageUri}" style="width:400px;height:auto;" />
        </body>
      </html>
    `;
    const { uri } = await Print.printToFileAsync({
      html,
      width: 400,
      height: 260,
      base64: false,
    });
    return uri || null;
  } catch (error) {
    console.error("Error generating PDF from image:", error);
    Alert.alert("Error", "Failed to generate PDF. Please try again.");
    return null;
  }
};

/* ---------- existing exports you already had (kept intact) ---------- */

const sanitizeFileName = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").slice(0, 50);
};

export const generateAndShareUserIDCard = async (data: UserIDCardData): Promise<boolean> => {
  try {
    const html = generateUserIDCardHTML(data);

    const file = await Print.printToFileAsync({ html, width: 400, height: 250 });
    const uri = (file && (file as any).uri) || null;

    if (!uri) {
      console.error('No PDF URI returned from Print.printToFileAsync for user ID card');
      Alert.alert('Error', 'Failed to generate ID card PDF.');
      return false;
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `${data.fullName} ID Card`,
        UTI: 'com.adobe.pdf',
      });
      return true;
    } else {
      Alert.alert('Success', 'ID Card generated! Sharing is not available on this device.');
      return true;
    }
  } catch (error) {
    console.error("Error generating user ID card:", error);
    Alert.alert("Error", "Failed to generate ID card. Please try again.");
    return false;
  }
};

export const generateAndShareFarmerIDCard = async (data: FarmerIDCardData): Promise<boolean> => {
  try {
    const html = generateFarmerIDCardHTML(data);

    const file = await Print.printToFileAsync({ html, width: 400, height: 260, base64: false });
    const uri = (file && (file as any).uri) || null;

    if (!uri) {
      console.error('No PDF URI returned from Print.printToFileAsync for farmer ID card');
      Alert.alert('Error', 'Failed to generate Farmer ID card PDF.');
      return false;
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `${data.farmerName} - Farmer ID Card`,
        UTI: 'com.adobe.pdf',
      });
      return true;
    } else {
      Alert.alert('Success', 'Farmer ID Card generated! Sharing is not available on this device.');
      return true;
    }
  } catch (error) {
    console.error("Error generating farmer ID card:", error);
    Alert.alert("Error", "Failed to generate Farmer ID card. Please try again.");
    return false;
  }
};

export const printUserIDCard = async (data: UserIDCardData): Promise<boolean> => {
  try {
    const html = generateUserIDCardHTML(data);
    await Print.printAsync({ html });
    return true;
  } catch (error) {
    console.error("Error printing user ID card:", error);
    return false;
  }
};

export const printFarmerIDCard = async (data: FarmerIDCardData): Promise<boolean> => {
  try {
    const html = generateFarmerIDCardHTML(data);
    await Print.printAsync({ html });
    return true;
  } catch (error) {
    console.error("Error printing farmer ID card:", error);
    return false;
  }
};

/* Helper function to format date */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    return dateString;
  }
};

/* Helper function to format phone number */
export const formatPhoneNumber = (phone?: string): string => {
  if (!phone) return "N/A";
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }

  return phone;
};
