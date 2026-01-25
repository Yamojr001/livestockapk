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

export const ASSOCIATIONS = [
  "Cattle Breeders Association of Nigeria (CBAN)",
  "Miyetti Allah Cattle Breeders Association (MACBAN)",
  "Sheep and Goat Farmers Association",
  "Poultry Farmers Association of Nigeria (POFAN)",
  "Pig Farmers Association of Nigeria (PIGFAN)",
  "Fish Farmers Association",
  "Bee Keepers Association",
  "Rabbit Farmers Association",
  "Other",
];

export const LIVESTOCK_TYPES = [
  "Cattle",
  "Sheep",
  "Goats",
  "Poultry",
  "Pigs",
  "Fish",
  "Bees",
  "Rabbits",
  "Donkeys",
  "Camels",
  "Other",
];

export const BANKS = [
  "Access Bank",
  "Citibank",
  "Diamond Bank",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Guaranty Trust Bank (GTBank)",
  "Heritage Bank",
  "Keystone Bank",
  "Polaris Bank",
  "Providus Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "Suntrust Bank Nigeria",
  "Union Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank",
  "Jaiz Bank",
  "Kuda Bank",
  "OPay",
  "PalmPay",
  "Moniepoint",
];
