import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Generates a unique farmer ID based on:
 * - LGA code (first 3 letters abbreviated)
 * - Ward code (first 3 letters abbreviated)
 * - Agent serial number
 * - Auto-incrementing farmer counter
 * 
 * Example: DTS/YLW/7/001
 * DTS = Dutse (LGA)
 * YLW = Yalwawa (Ward)
 * 7 = Agent serial number
 * 001 = Farmer sequence number
 */

interface FarmerIDComponents {
  lga: string;
  ward: string;
  agentSerialNumber: number;
}

// Jigawa LGA and Ward data
export const lgaWardData: Record<string, string[]> = {
  Auyo: ["Auyo", "Auyakayi", "Gamafoi", "Gatafa", "Kafur", "Kera", "Tsidir", "Unik", "Ayama", "Gamsarka"],
  Babura: ["Babura", "Batali", "Dorawa", "Garki", "Garu", "Insharuwa", "Jigawa", "Kanya", "Kyambo", "Takwasa"],
  Birnin_Kudu: ["Birnin Kudu", "Kangare", "Kantoga", "Kiyawa", "Kwangwara", "Lafiya", "Sundimina", "Unguwar Malam", "Yalawan Damai"],
  Birniwa: ["Birniwa", "Diginsa", "Fagi", "Kanya", "Karnaya", "Kazura", "Maikintari", "Maiyama", "Nguwa", "Yalo"],
  Buji: ["Ahoto", "Baturiya", "Buji", "Falageri", "Guyu", "Kukuma", "Maje", "Mosari", "Talata Mafara"],
  Dutse: ["Chamo", "Dundubus", "Fagolo", "Kachi", "Karnaya", "Limawa", "Madobi", "Sabon Gari", "Sakwaya", "Takur", "Yalwa"],
  Gagarawa: ["Gagarawa", "Dabi", "Fagam", "Maikulki", "Miga", "Kadira", "Ringim", "Yandutse", "Zakirai"],
  Garki: ["Garki", "Buduru", "Jigawa", "Kanya", "Mekiya", "Rafin Sanyi", "Siyori", "Zareku"],
  Gumel: ["Gumel", "Bardo", "Danama", "Fagoji", "Galagamma", "Garin Alhaji", "Garun Gabas", "Hammado", "Zango"],
  Guri: ["Guri", "Adiyani", "Dawa", "Gadama", "Guna", "Jeke", "Lafiya", "Margadu", "Matara"],
  Gwaram: ["Gwaram", "Basirka", "Dingaya", "Fagam", "Farin Dutse", "Jigawa", "Kauyen Tsamiya", "Kwanda", "Nasarawa", "Shafe"],
  Gwiwa: ["Gwiwa", "Dangwanki", "Dunari", "Fandum", "Ganuwa", "Gayin", "Marke"],
  Hadejia: ["Hadejia A", "Hadejia B", "Kasuwar Kofa", "Majema", "Matsaro", "Rumfa", "Sabon Gari", "Yankoli"],
  Jahun: ["Jahun", "Aujara", "Gunka", "Harbo", "Idanduna", "Kale", "Kiyako", "Miga", "Ruba"],
  Kafin_Hausa: ["Kafin Hausa", "Balangu", "Dumadumin Toka", "Gafaya", "Jabo", "Majia", "Mezan", "Rumfa", "Sarawa", "Yaryasa"],
  Kaugama: ["Kaugama", "Arbus", "Dakaiyawa", "Doleri", "Hadin", "Jigawa", "Marma", "Sabontiti", "Tsurma", "Turawa"],
  Kazaure: ["Kazaure", "Daba", "Daneji", "Gada", "Karofin Yashi", "Koko", "Kwasallo", "Sabaru", "Unguwar Jama", "Yanduna"],
  Kiri_Kasamma: ["Kiri Kasamma", "Batu", "Doko", "Iliya", "Kakumi", "Madachi", "Sara", "Shuwarin", "Yalawa"],
  Kiyawa: ["Kiyawa", "Andaza", "Fagi", "Garko", "Katanga", "Kwanda", "Shuwaki"],
  Maigatari: ["Maigatari", "Balarabe", "Bulabulin", "Dankumbo", "Galadi", "Matoya", "Sabaru", "Taura", "Zango"],
  Malam_Madori: ["Malam Madori", "Biyaiyel", "Dagwarga", "Dangyatin", "Jigawa", "Kafin Madaki", "Kukayasku", "Shaidantu"],
  Miga: ["Miga", "Dangyatun Miko", "Garko", "Haram", "Miga Gabas", "Sansani", "Takatsaba", "Yandamo"],
  Ringim: ["Ringim", "Chai Chai", "Dabi", "Karshi", "Kyarama", "Sankara", "Tofa", "Yandutse"],
  Roni: ["Roni", "Amaryawa", "Danladi", "Faru", "Gora", "Yanzaki"],
  Sule_Tankarkar: ["Sule Tankarkar", "Albasu", "Fatan Take", "Giwa", "Kore", "Marke", "Yalo"],
  Taura: ["Taura", "Abalago", "Achilafiya", "Ajaura", "Gujungu", "Kiri", "Makaranta", "Maje", "Majiya"],
  Yankwashi: ["Yankwashi", "Belas", "Danzomo", "Fagoji", "Karkarna", "Komawa", "Madaka", "Riruwai"],
};

export const getLGAs = (): string[] => {
  return Object.keys(lgaWardData).sort();
};

export const getWards = (lga: string): string[] => {
  return lgaWardData[lga] || [];
};

/**
 * Abbreviates LGA name to 3-letter code
 */
function abbreviateLGA(lga: string): string {
  return lga.substring(0, 3).toUpperCase();
}

/**
 * Abbreviates Ward name to 3-letter code
 */
function abbreviateWard(ward: string): string {
  return ward.substring(0, 3).toUpperCase();
}

/**
 * Gets the storage key for farmer ID counter specific to an agent
 */
function getCounterKey(agentId: string, lga: string, ward: string): string {
  const lgaCode = abbreviateLGA(lga);
  const wardCode = abbreviateWard(ward);
  return `farmer_id_counter_${agentId}_${lgaCode}_${wardCode}`;
}

/**
 * Gets the next farmer counter for the agent
 */
export async function getNextFarmerCounter(
  agentId: string,
  lga: string,
  ward: string
): Promise<number> {
  try {
    const key = getCounterKey(agentId, lga, ward);
    const current = await AsyncStorage.getItem(key);
    const nextCounter = (current ? parseInt(current) : 0) + 1;
    await AsyncStorage.setItem(key, nextCounter.toString());
    return nextCounter;
  } catch (error) {
    console.error('Error getting farmer counter:', error);
    return 1;
  }
}

/**
 * Generates a unique farmer ID
 * Format: LGA_CODE/WARD_CODE/AGENT_SERIAL/FARMER_NUMBER
 * Example: DTS/YLW/7/001
 */
export async function generateFarmerId(components: FarmerIDComponents): Promise<string> {
  try {
    const lgaCode = abbreviateLGA(components.lga);
    const wardCode = abbreviateWard(components.ward);
    const agentSerial = String(components.agentSerialNumber).padStart(2, '0');
    
    // Get next farmer counter for this agent+lga+ward combination
    const counter = await getNextFarmerCounter(
      `agent_${components.agentSerialNumber}`,
      components.lga,
      components.ward
    );
    const farmerNumber = String(counter).padStart(3, '0');
    
    return `${lgaCode}/${wardCode}/${agentSerial}/${farmerNumber}`;
  } catch (error) {
    console.error('Error generating farmer ID:', error);
    throw new Error('Failed to generate farmer ID');
  }
}

/**
 * Resets the farmer counter for an agent (useful for testing or resetting)
 */
export async function resetFarmerCounter(
  agentId: string,
  lga: string,
  ward: string
): Promise<void> {
  try {
    const key = getCounterKey(agentId, lga, ward);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error resetting farmer counter:', error);
  }
}

/**
 * Gets the current farmer counter without incrementing
 */
export async function getCurrentFarmerCounter(
  agentId: string,
  lga: string,
  ward: string
): Promise<number> {
  try {
    const key = getCounterKey(agentId, lga, ward);
    const current = await AsyncStorage.getItem(key);
    return current ? parseInt(current) : 0;
  } catch (error) {
    console.error('Error getting current farmer counter:', error);
    return 0;
  }
}

/**
 * Parses a farmer ID and extracts components
 */
export function parseFarmerId(farmerId: string): {
  lga: string;
  ward: string;
  agentSerial: string;
  farmerNumber: string;
} | null {
  try {
    const parts = farmerId.split('/');
    if (parts.length !== 4) return null;
    
    return {
      lga: parts[0],
      ward: parts[1],
      agentSerial: parts[2],
      farmerNumber: parts[3],
    };
  } catch {
    return null;
  }
}

/**
 * Validates farmer ID format
 */
export function isValidFarmerId(farmerId: string): boolean {
  const parsed = parseFarmerId(farmerId);
  return parsed !== null;
}
