import React, { createContext, useState, useContext, ReactNode } from 'react';

type Language = 'EN' | 'TE';

interface LanguageContextProps {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  EN: {
    // Navbar / Hero
    logoName: "Andhra Style Pakka Military Hotel",
    tagline: "Pakka Military, Pakka Fine Dine",
    heroHeading: "Authentic Andhra Military Flavours",
    heroSubheading: "Experience traditional Andhra cuisine prepared with premium ingredients and served with unmatched hospitality.",
    orderFood: "Order Food",
    bookTable: "Book Table",
    exploreMenu: "Explore Menu",
    categories: "Categories",
    popularFoods: "Popular Foods",
    bestBiryanis: "Best Selling Biryanis",
    todaysSpecial: "Today's Special",
    gallery: "Restaurant Gallery",
    reviews: "Customer Reviews",
    offers: "Offers & Coupons",
    aboutUs: "About Restaurant",
    contact: "Contact Section",
    
    // Buttons
    addToCart: "Add to Cart",
    buyNow: "Buy Now",
    wishlist: "Wishlist",
    added: "Added!",
    
    // Status
    dineIn: "Dine In",
    takeaway: "Takeaway",
    delivery: "Home Delivery",
    table: "Table",
    
    // Cart / Payment
    cart: "Cart System",
    subtotal: "Subtotal",
    gst: "GST (5%)",
    serviceCharge: "Service Charge (5%)",
    deliveryCharge: "Delivery Charges",
    discount: "Discount Coupon",
    grandTotal: "Grand Total",
    checkout: "Checkout",
    placeOrder: "Place Order",
    
    // Dashboards
    adminPortal: "Admin Dashboard",
    kitchenPortal: "Kitchen Dashboard",
    managerPortal: "Manager Dashboard",
    deliveryPortal: "Delivery Dashboard",
    customerPortal: "Customer Portal",
    logout: "Log Out"
  },
  TE: {
    // Navbar / Hero
    logoName: "రాయుడు గారి మిల్టరీ హోటల్",
    tagline: "పక్కా మిలిటరీ, పక్కా ఫైన్ డైన్",
    heroHeading: "అసలైన ఆంధ్రా మిలిటరీ రుచులు",
    heroSubheading: "ప్రీమియం పదార్థాలతో తయారు చేయబడిన మరియు అసమానమైన ఆతిథ్యంతో అందించబడే సాంప్రదాయ ఆంధ్ర వంటకాలను అనుభవించండి.",
    orderFood: "ఆహారాన్ని ఆర్డర్ చేయండి",
    bookTable: "టేబుల్ బుక్ చేయండి",
    exploreMenu: "మెనూ చూడండి",
    categories: "విభాగాలు",
    popularFoods: "జనాదరణ పొందిన వంటకాలు",
    bestBiryanis: "అత్యధికంగా అమ్ముడయ్యే బిర్యానీలు",
    todaysSpecial: "ఈరోజు స్పెషల్",
    gallery: "రెస్టారెంట్ గ్యాలరీ",
    reviews: "వినియోగదారుల సమీక్షలు",
    offers: "ఆఫర్లు & కూపన్లు",
    aboutUs: "రెస్టారెంట్ గురించి",
    contact: "సంప్రదించండి",
    
    // Buttons
    addToCart: "కార్ట్ లో చేర్చు",
    buyNow: "వెంటనే కొనండి",
    wishlist: "విష్‌లిస్ట్",
    added: "చేర్చబడింది!",
    
    // Status
    dineIn: "డైన్ ఇన్",
    takeaway: "టేక్ అవే",
    delivery: "హోమ్ డెలివరీ",
    table: "టేబుల్",
    
    // Cart / Payment
    cart: "కార్ట్ సిస్టమ్",
    subtotal: "ఉప మొత్తం",
    gst: "జీఎస్టీ (5%)",
    serviceCharge: "సర్వీస్ ఛార్జ్ (5%)",
    deliveryCharge: "డెలివరీ ఛార్జీలు",
    discount: "డిస్కౌంట్ కూపన్",
    grandTotal: "మొత్తం ధర",
    checkout: "చెక్అవుట్",
    placeOrder: "ఆర్డర్ ప్లేస్ చేయి",
    
    // Dashboards
    adminPortal: "అడ్మిన్ డాష్‌బోర్డ్",
    kitchenPortal: "కిచెన్ డాష్‌బోర్డ్",
    managerPortal: "మేనేజర్ డాష్‌బోర్డ్",
    deliveryPortal: "డెలివరీ డాష్‌బోర్డ్",
    customerPortal: "కస్టమర్ పోర్టల్",
    logout: "లాగ్ అవుట్"
  }
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('EN');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'EN' ? 'TE' : 'EN'));
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
