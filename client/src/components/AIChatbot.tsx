import React, { useState } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
}

export const AIChatbot: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: 'Namaste! Welcome to Andhra Style Pakka Military Hotel. I am your AI assistant. How can I help you today? You can ask about our menu recommendations, check table availability, or track your orders!' }
  ]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    const userText = input;
    setInput('');
    setIsTyping(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      
      const role = user?.role || 'customer';
      let roleInstructions = '';
      if (role === 'admin') {
        roleInstructions = `You are assisting the Admin (Raju Garu) in the Admin Portal.
Helpful tips for Admin:
- Menu Manager: Admin can add new foods, set prices, and configure discounts.
- Table Layout: Admin can select any of the 100 tables and change status (Available, Occupied, Reserved, Cleaning).
- User Registry: Admin can view registered customers, emails, roles, and loyalty points.
- Invoices: Admin can click "Print Invoice" next to any order.
- GPS Map Modal: Admin can click "Track Live GPS Map" to view rider tracks on Leaflet Map.`;
      } else if (role === 'manager') {
        roleInstructions = `You are assisting the Manager (Srinivas) in the Manager Portal.
Helpful tips for Manager:
- AI Forecasting: Check Peak Hour slot predictions, demand trends, and revenue forecasts.
- Reviews Moderation: Manager can approve customer reviews to go live on the landing page testimonials.
- Timing guidelines: Manager can configure kitchen prep buffer guides (defaults to 20 mins).
- Inventory Alerts: Alert when Guntur Red Chilli Powder is low (<12kg).`;
      } else if (role === 'kitchen') {
        roleInstructions = `You are assisting the Chef (Somaraju or Koteswara Rao) in the Kitchen Display System (KDS).
Helpful tips for Kitchen Staff:
- Active cooking: View Preparing tickets. When done cooking, click "Ready for Dispatch".
- Live orders sync immediately via socket.
- Inventory tracker: Monitor ingredient levels (Basmati Rice, Samba Rice, sunflower oil).`;
      } else if (role === 'delivery') {
        roleInstructions = `You are assisting the Delivery Rider (Ramu or Subrahmanyam) in the Delivery Portal.
Helpful tips for Riders:
- Active orders: View Received, Preparing, or Ready home delivery orders.
- Claiming: Riders can click "Accept Order" at any cooking stage.
- Transit: Once the order status is "Served" (Out for Delivery), GPS tracking simulates coordinates to the client address.
- Client info: Customer name, phone, type (Home/Office), and company blockers are visible.`;
      } else {
        roleInstructions = `You are assisting a Customer (or Guest) on the public homepage.
Helpful tips for Customer:
- Menu: Special Chicken/Mutton Biryanis, Uma Chicken Nalla Vepudu, Apollo Fish Fry.
- Table Bookings: Scanned QR sessions or manual reservations for 100 tables.
- Payments: Accepts UPI, PhonePe, Cards, COD.
- Order Tracker: Displays active progress and live Leaflet coordinate routes.`;
      }

      const systemPrompt = `You are the friendly, helpful AI Assistant for "Andhra Style Pakka Military Hotel" (Andhra's largest military dining arena).
Your goals:
1. Provide accurate menu details, recommendation & pricing:
   - Biryanis: Chicken Dum Biryani (₹349), Chicken Fry Piece Biryani (₹369), Special Mutton Biryani (₹469), Gongura Chicken Biryani (₹399), Seeraga Samba Mutton Biryani (₹449).
   - Mutton: Mutton Biryani (₹449), Mutton Fry (₹399), Mutton Curry (₹419), Mutton Keema (₹419), Mutton Roast (₹429), Mutton Soup (₹179).
   - Chicken: Specialty "Uma Chicken Nalla Vepudu" (₹329), Chicken Roast (₹289), Chicken 65 (₹259), Pepper Chicken (₹269).
   - Fish & Veg: Apollo Fish Fry (₹349), Nellore Chepala Pulusu (tangy spicy mango fish curry) (₹389), Gutti Vankaya Curry (stuffed eggplant) (₹249), Tomato Cashew Curry (₹269), Guddu Pulusu (egg) (₹199).
   - Desserts & Drinks: Double Ka Meetha (₹120), Gulab Jamun (₹80), Apricot Delight (₹160), Fresh Lime Soda (₹60), Soft Drinks (₹40), Water Bottle (₹20).
2. Answer Table booking questions: We have 100 tables. Guests can book via the website's booking panel.
3. Help with Payments: We accept QR code scans (UPI, PhonePe, GPay), Cards, Net Banking, and Cash on Delivery (COD).
4. Explain delivery tracking: Home deliveries are simulated via live Leaflet OpenStreetMap. Once the rider (Ramu: +91 9876543210 or Subrahmanyam: +91 8765432109) starts, coordinates update in real-time.
5. Explain Loyalty points: Registered users earn 1 loyalty point per ₹10 spent.

ROLE-SPECIFIC INSTRUCTIONS:
${roleInstructions}

Keep answers concise, warm, and highly informative.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `System context: ${systemPrompt}\n\nUser Question: ${userText}` }
                ]
              }
            ]
          }),
        }
      );

      if (!response.ok) {
        throw new Error('API Key call failed');
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (text) {
        setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'bot', text }]);
      } else {
        throw new Error('Empty response');
      }
    } catch (err) {
      // Fallback keyword mock responses
      let botResponse = "I'm sorry, I didn't quite catch that. You can ask about our special Biryanis, Mutton Roast, or ask me to book a table for you!";
      const query = userText.toLowerCase();

      if (query.includes('biryani') || query.includes('biriyani')) {
        botResponse = 'Our best sellers are Chicken Dum Biryani (₹349) and Military Samba Mutton Biryani (₹449). We also have Gongura Chicken Biryani (₹399) if you like it tangy and spicy!';
      } else if (query.includes('mutton') || query.includes('mamsam')) {
        botResponse = 'For mutton lovers, we highly recommend our Mutton Soup starter (₹179) followed by Mutton Keema (₹419) or juicy Mutton Fry (₹399).';
      } else if (query.includes('chicken') || query.includes('kodi')) {
        botResponse = 'You must try our specialty: Uma Chicken Nalla Vepudu! We also have Chicken Roast (₹289), Chicken 65 (₹259), and Pepper Chicken (₹269).';
      } else if (query.includes('book') || query.includes('table') || query.includes('reserve')) {
        botResponse = 'Certainly! Click the "Book Table" button in the Hero section or navigate to the booking layout to reserve any of our 100 tables.';
      } else if (query.includes('payment') || query.includes('pay') || query.includes('card') || query.includes('upi') || query.includes('cod')) {
        botResponse = 'We support UPI payments (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Cash on Delivery (COD). Live status is tracked in your orders profile.';
      } else if (query.includes('track') || query.includes('delivery') || query.includes('rider') || query.includes('live')) {
        botResponse = 'Once dispatched, you can view the live GPS movement of your delivery rider (Ramu or Subrahmanyam) on our interactive Leaflet OSM map!';
      } else if (query.includes('hi') || query.includes('hello') || query.includes('hey')) {
        botResponse = 'Hello! Hope you are hungry. What Andhra delicacy are we ordering today?';
      }

      setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'bot', text: botResponse }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="w-80 md:w-96 h-[450px] bg-cream-light dark:bg-brown border border-gold/30 rounded-2xl shadow-glass-gold flex flex-col overflow-hidden mb-4 z-50 backdrop-blur-md"
          >
            {/* Header */}
            <div className="bg-brown dark:bg-brown-dark text-gold p-4 flex justify-between items-center border-b border-gold/25">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gold/10 rounded-full border border-gold/30">
                  <Bot size={18} className="text-gold" />
                </div>
                <div>
                  <h4 className="font-serif text-sm font-bold tracking-wide">Military AI Bot</h4>
                  <span className="text-[9px] text-green-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                    Online
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gold-light/20 rounded-full text-cream/70 hover:text-cream"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-3">
              {messages.map((msg) => {
                const isBot = msg.sender === 'bot';
                return (
                  <div 
                    key={msg.id}
                    className={`flex gap-2 max-w-[80%] ${isBot ? 'self-start' : 'self-end flex-row-reverse'}`}
                  >
                    <div className={`p-1.5 rounded-full h-8 w-8 flex items-center justify-center shrink-0 border ${
                      isBot ? 'bg-brown text-gold border-gold/20' : 'bg-gold text-brown border-gold-dark/20'
                    }`}>
                      {isBot ? <Bot size={14} /> : <User size={14} />}
                    </div>
                    <div className={`text-xs p-3 rounded-2xl leading-relaxed shadow-sm ${
                      isBot 
                      ? 'bg-cream/70 dark:bg-brown-dark/50 text-brown dark:text-cream rounded-tl-none border border-gold/10' 
                      : 'bg-gold/25 dark:bg-gold/10 text-brown dark:text-gold-light rounded-tr-none border border-gold/25'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              {isTyping && (
                <div className="flex gap-2 max-w-[80%] self-start animate-pulse">
                  <div className="p-1.5 rounded-full h-8 w-8 flex items-center justify-center shrink-0 border bg-brown text-gold border-gold/20">
                    <Bot size={14} />
                  </div>
                  <div className="text-xs p-3 rounded-2xl leading-relaxed shadow-sm bg-cream/70 dark:bg-brown-dark/50 text-brown dark:text-cream rounded-tl-none border border-gold/10">
                    Military AI Bot is typing... 💬
                  </div>
                </div>
              )}
            </div>

            {/* Input Panel */}
            <div className="p-3 bg-brown-dark/5 border-t border-gold/20 flex gap-2">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about Menu, Table Booking..."
                className="flex-grow text-xs px-3.5 py-2.5 bg-cream/50 dark:bg-brown border border-gold/25 rounded-full text-brown dark:text-cream-light focus:outline-none focus:border-gold"
              />
              <button 
                onClick={handleSend}
                className="p-2.5 bg-brown text-gold border border-gold rounded-full hover:bg-gold hover:text-brown transition-all shadow shrink-0"
              >
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 bg-brown text-gold hover:bg-brown-light border-2 border-gold rounded-full shadow-glass-gold pulse-gold-btn flex items-center justify-center relative"
      >
        <MessageSquare size={22} className="text-gold" />
      </motion.button>
    </div>
  );
};
