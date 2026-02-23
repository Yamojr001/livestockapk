export const lgaWardData: Record<string, string[]> = {
  Auyo: ["Auyo", "Auyakayi","Ayama", "Gamafoi", "Gatafa", "Kafur", "Tsidir", "Unik"],
  Babura: ["Babura", "Batali", "Dorawa", "Garu", "Gaskoli", "Insharuwa", "Jigawa", "Kanya", "Kyambo", "Takwasa"],
  Birnin_Kudu: ["Birnin Kudu", "Kangare", "Kantoga", "Kiyako", "Kwangwara", "Lafiya", "Sundimina", "Unguwar-Ya", "Wurno", "Yalawan Damai"],
  Birniwa: ["Bato", "Birniwa", "Dangwaleri", "Diginsa", "Fagi", "Kachallari", "Karanga", "Kazura", "Machinamri", "Matama", "Nguwa"],
  Buji: ["Ahoto", "Buji", "Chirbin", "Falgari", "Gantsa", "Kawaya", "Kukuma", "Lelen Kudu", "Madabe", "Yayarin Tukur"],
  Dutse: ["Abaya", "Chamo", "Dundubus", "Duru", "Jigawar Tsada", "kachi", "Karnaya", "Kudai", "Limawa","Sakwaya"],
  Gagarawa: ["Gagarawa Tasha", "Gagarawa Gari", "Garin chiroma", "Kore Balatu", "Madaka", "Mai Aduwa", "Maikilili", "Medu", "Yelwa", "Zarada"],
  Garki: ["Buduru","Doko", "Garki", "Gwarzo", "Jirima", "Kargo", "Kore", "Muku", "Rafin Marke", "Siyori"],
  Gumel: ["Baikarya", "Dan'ama", "Dantanoma", "Galagamma", "Garin Gambo", "Garin Barka", "Gusau", "Hammado", "Kofar Arewa", "Kafar Yamma", "Zango"],
  Guri: ["Abunabo", "Adiyani", "Dawa", "Garbagal", "Guri", "Kadira", "Margadu", "Matara Babba", "Musari"],
  Gwaram: ["Basirka", "Dingaya", "Fagam", "Farin Dutse", "Gwaram", "Kila", "Kwondiko", "Maruta", "Sara", "Tsangarwa", "Zandam Nagogo"],
  Gwiwa: ["Dabi", "Darina", "Firjin Yamma", "Guntai", "Gwiwa", "Korayal", "Rorau", "Shafe", "Yola", "Zauma"],
  Hadejia: ["Atafi", "Dubantu", "Gagilmari", "Kasuwar Kofa", "Kasuwar Kuda", "Kasuwar Kudu", "Majema", "Mastaro", "Rumfa", "Sabon Gari", "Yankoli", "Yayari"],
  Jahun: ["Aujara", "Gangawa", "Gauza", "Gunka", "Harbo Sabuwa", "Harbo Tsohuwa", "Idanduna", "Jabarna", "Jahun", "Kale", "Kanwa"],
  Kafin_Hausa: ["Balangu", "Duma Dumi", "Gafaya", "Jabo", "Kafin Hausa", "Kwazalewa", "Majawa", "Mezan", "Ruba", "Sarawa", "Zago"],
  Kaugama: ["Arbus", "Askandu", "Dabuwaran", "Dakaiyawa", "Doleri", "Hadin", "Ja'e", "Jarkasa", "Kaugama", "Marke", "Unguwar Jibrin", "Yalo"],
  Kazaure: ["Ba'auzini","Daba", "Dabaza", "Dandi", "Gada", "Kanti", "Maradawa", "Sabaru", "Unguwar arewa", "Unguwar Gabas", "Unguwar Yamma"],
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
