export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  lastVisit: string;
  address: string;
  notes: string;
  preferences: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  service: string;
  date: string;
  time: string;
  duration: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  phone: string;
  email: string;
  notes: string;
  orderNumber: string;
  fabricSelection: string;
  style: string;
  estimatedCost: number;
  reminderStatus: string;
  createdDate: string;
}

export interface Measurement {
  id: string;
  customerId: string;
  customerName: string;
  garmentTypes: string[];
  status: 'complete' | 'incomplete';
  lastUpdated: string;
  height: string;
  weight: string;
  bodyType: string;
  posture: string;
  suit: {
    chest: number; waist: number; shoulderWidth: number;
    sleeveLength: number; neck: number; bicep: number;
    wrist: number; armhole: number; frontLength: number;
    jacketLength: number; lapelWidth: number; buttonStyle: string;
    ventStyle: string; pocketStyle: string; overallFit: string;
  };
  shirt: {
    chest: number; waist: number; shoulderWidth: number;
    sleeveLength: number; neck: number; bicep: number;
    wrist: number; shirtLength: number; cuffStyle: string;
    collarStyle: string;
  };
  pants: {
    waist: number; hip: number; inseam: number;
    outseam: number; thigh: number; knee: number;
    legOpening: number; rise: number; fitType: string;
  };
  notes: string;
  history: { title: string; date: string; takenBy: string; description: string }[];
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  garmentType: string;
  fabric: string;
  deliveryDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'delivered';
  total: number;
  items: { description: string; quantity: number; price: number }[];
  notes: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  date: string;
  service: string;
  items: { description: string; quantity: number; price: number }[];
  paymentMethod: string;
  paymentDate: string;
}

export const customers: Customer[] = [
  { id: '1', name: 'John Smith', phone: '+1 234-567-8900', email: 'john.smith@email.com', totalOrders: 5, lastVisit: '2026-03-06', address: '123 Main St, New York, NY', notes: 'Prefers slim fit. Wedding event March 15th', preferences: 'Slim Fit, Navy/Charcoal colors' },
  { id: '2', name: 'Sarah Johnson', phone: '+1 234-567-8901', email: 'sarah.j@email.com', totalOrders: 3, lastVisit: '2026-03-06', address: '456 Oak Ave, Brooklyn, NY', notes: 'First time customer', preferences: 'Classic Fit' },
  { id: '3', name: 'Michael Chen', phone: '+1 234-567-8902', email: 'michael.c@email.com', totalOrders: 2, lastVisit: '2026-03-07', address: '789 Pine Rd, Manhattan, NY', notes: 'Hem only', preferences: 'Regular Fit' },
  { id: '4', name: 'Emily Davis', phone: '+1 234-567-8903', email: 'emily.d@email.com', totalOrders: 8, lastVisit: '2026-03-08', address: '321 Elm St, Queens, NY', notes: 'Bring fabric samples. Budget: $2000', preferences: 'Tailored Fit, Premium Fabrics' },
  { id: '5', name: 'Robert Wilson', phone: '+1 234-567-8904', email: 'robert.w@email.com', totalOrders: 1, lastVisit: '2026-03-06', address: '654 Cedar Ln, Bronx, NY', notes: 'Order #ORD-045 ready', preferences: 'Relaxed Fit' },
  { id: '6', name: 'Lisa Anderson', phone: '+1 234-567-8905', email: 'lisa.a@email.com', totalOrders: 4, lastVisit: '2026-03-05', address: '987 Birch Dr, Staten Island, NY', notes: 'VIP customer', preferences: 'Modern Fit, Light colors' },
];

export const appointments: Appointment[] = [
  { id: '1', customerId: '1', customerName: 'John Smith', service: 'Suit Fitting', date: '2026-03-06', time: '10:00 AM', duration: '45 min', priority: 'HIGH', status: 'confirmed', phone: '+1 234-567-8900', email: 'john.smith@email.com', notes: 'Customer prefers slim fit style. Mentioned wedding event on March 15th.', orderNumber: 'ORD-045', fabricSelection: 'Italian Wool - Navy Blue', style: '3-Piece Suit', estimatedCost: 850, reminderStatus: 'Sent', createdDate: '2026-02-28' },
  { id: '2', customerId: '2', customerName: 'Sarah Johnson', service: 'Shirt Measurement', date: '2026-03-06', time: '2:00 PM', duration: '30 min', priority: 'NORMAL', status: 'confirmed', phone: '+1 234-567-8901', email: 'sarah.j@email.com', notes: 'First time customer', orderNumber: 'ORD-046', fabricSelection: 'Egyptian Cotton - White', style: 'Dress Shirt', estimatedCost: 320, reminderStatus: 'Sent', createdDate: '2026-03-01' },
  { id: '3', customerId: '3', customerName: 'Michael Chen', service: 'Pants Alteration', date: '2026-03-07', time: '11:00 AM', duration: '20 min', priority: 'NORMAL', status: 'pending', phone: '+1 234-567-8902', email: 'michael.c@email.com', notes: 'Hem only', orderNumber: 'ORD-047', fabricSelection: 'Wool Blend - Gray', style: 'Dress Pants', estimatedCost: 180, reminderStatus: 'Pending', createdDate: '2026-03-02' },
  { id: '4', customerId: '4', customerName: 'Emily Davis', service: 'Wedding Suit Consultation', date: '2026-03-08', time: '3:00 PM', duration: '60 min', priority: 'HIGH', status: 'confirmed', phone: '+1 234-567-8903', email: 'emily.d@email.com', notes: 'Bring fabric samples. Budget: $2000', orderNumber: 'ORD-048', fabricSelection: 'Premium Cashmere - Black', style: 'Wedding Suit Package', estimatedCost: 1200, reminderStatus: 'Sent', createdDate: '2026-03-01' },
  { id: '5', customerId: '5', customerName: 'Robert Wilson', service: 'Suit Pickup', date: '2026-03-06', time: '4:30 PM', duration: '15 min', priority: 'NORMAL', status: 'confirmed', phone: '+1 234-567-8904', email: 'robert.w@email.com', notes: 'Order #ORD-045 ready', orderNumber: 'ORD-049', fabricSelection: 'Linen - Beige', style: '2-Piece Suit', estimatedCost: 650, reminderStatus: 'Sent', createdDate: '2026-02-25' },
];

export const measurements: Measurement[] = [
  {
    id: '1', customerId: '1', customerName: 'John Smith', garmentTypes: ['Suit', 'Shirt'], status: 'complete', lastUpdated: '2026-03-01',
    height: "5'11\"", weight: '175 lbs', bodyType: 'Athletic', posture: 'Normal',
    suit: { chest: 42, waist: 36, shoulderWidth: 18, sleeveLength: 34, neck: 15.5, bicep: 14, wrist: 7, armhole: 20, frontLength: 31, jacketLength: 31, lapelWidth: 3.5, buttonStyle: '2 Button', ventStyle: 'Center Vent', pocketStyle: 'Flap Pockets', overallFit: 'Slim Fit' },
    shirt: { chest: 42, waist: 36, shoulderWidth: 18, sleeveLength: 34, neck: 15.5, bicep: 14, wrist: 7, shirtLength: 30, cuffStyle: 'Barrel', collarStyle: 'Spread' },
    pants: { waist: 36, hip: 42, inseam: 32, outseam: 42, thigh: 24, knee: 16, legOpening: 15, rise: 10, fitType: 'Slim' },
    notes: 'Customer has slightly dropped right shoulder. Add 0.25 inch padding. Prefers slightly loose fit around chest for comfort.',
    history: [
      { title: 'Suit Measurements', date: '2026-03-01', takenBy: 'Michael T.', description: 'Wedding suit order' },
      { title: 'Shirt Measurements', date: '2026-01-15', takenBy: 'Sarah K.', description: 'Regular update' },
      { title: 'All Measurements', date: '2025-11-20', takenBy: 'Michael T.', description: 'Initial measurements' },
    ],
  },
  {
    id: '2', customerId: '2', customerName: 'Sarah Johnson', garmentTypes: ['Shirt'], status: 'complete', lastUpdated: '2026-03-03',
    height: "5'6\"", weight: '130 lbs', bodyType: 'Slim', posture: 'Normal',
    suit: { chest: 36, waist: 28, shoulderWidth: 15, sleeveLength: 30, neck: 14, bicep: 11, wrist: 6, armhole: 17, frontLength: 27, jacketLength: 27, lapelWidth: 3, buttonStyle: '2 Button', ventStyle: 'Center Vent', pocketStyle: 'Welt Pockets', overallFit: 'Slim Fit' },
    shirt: { chest: 36, waist: 28, shoulderWidth: 15, sleeveLength: 30, neck: 14, bicep: 11, wrist: 6, shirtLength: 27, cuffStyle: 'French', collarStyle: 'Point' },
    pants: { waist: 28, hip: 36, inseam: 30, outseam: 40, thigh: 21, knee: 14, legOpening: 13, rise: 9, fitType: 'Regular' },
    notes: '', history: [{ title: 'Shirt Measurements', date: '2026-03-03', takenBy: 'Sarah K.', description: 'New customer intake' }],
  },
  {
    id: '3', customerId: '3', customerName: 'Michael Chen', garmentTypes: ['Pants'], status: 'incomplete', lastUpdated: '2026-03-04',
    height: "5'9\"", weight: '165 lbs', bodyType: 'Average', posture: 'Normal',
    suit: { chest: 40, waist: 34, shoulderWidth: 17, sleeveLength: 33, neck: 15, bicep: 13, wrist: 7, armhole: 19, frontLength: 29, jacketLength: 30, lapelWidth: 3.5, buttonStyle: '2 Button', ventStyle: 'Double Vent', pocketStyle: 'Patch Pockets', overallFit: 'Regular Fit' },
    shirt: { chest: 40, waist: 34, shoulderWidth: 17, sleeveLength: 33, neck: 15, bicep: 13, wrist: 7, shirtLength: 29, cuffStyle: 'Barrel', collarStyle: 'Button Down' },
    pants: { waist: 34, hip: 40, inseam: 31, outseam: 41, thigh: 23, knee: 15.5, legOpening: 14.5, rise: 10, fitType: 'Regular' },
    notes: 'Hem only needed', history: [{ title: 'Pants Measurements', date: '2026-03-04', takenBy: 'Michael T.', description: 'Alteration measurements' }],
  },
  {
    id: '4', customerId: '4', customerName: 'Emily Davis', garmentTypes: ['Suit', 'Shirt', 'Pants'], status: 'complete', lastUpdated: '2026-02-28',
    height: "5'4\"", weight: '120 lbs', bodyType: 'Slim', posture: 'Normal',
    suit: { chest: 34, waist: 26, shoulderWidth: 14.5, sleeveLength: 29, neck: 13.5, bicep: 10.5, wrist: 5.5, armhole: 16, frontLength: 26, jacketLength: 26, lapelWidth: 2.5, buttonStyle: '1 Button', ventStyle: 'No Vent', pocketStyle: 'Welt Pockets', overallFit: 'Tailored Fit' },
    shirt: { chest: 34, waist: 26, shoulderWidth: 14.5, sleeveLength: 29, neck: 13.5, bicep: 10.5, wrist: 5.5, shirtLength: 26, cuffStyle: 'French', collarStyle: 'Mandarin' },
    pants: { waist: 26, hip: 34, inseam: 28, outseam: 38, thigh: 20, knee: 13, legOpening: 12, rise: 9, fitType: 'Tailored' },
    notes: 'Complete wedding package measurements', history: [{ title: 'Full Measurements', date: '2026-02-28', takenBy: 'Sarah K.', description: 'Wedding package' }],
  },
];

export const orders: Order[] = [
  { id: '1', orderNumber: 'ORD-045', customerId: '1', customerName: 'John Smith', garmentType: 'Custom Suit', fabric: 'Italian Wool - Navy Blue', deliveryDate: '2026-03-15', status: 'in-progress', total: 850, items: [{ description: '3-Piece Suit', quantity: 1, price: 750 }, { description: 'Alterations', quantity: 1, price: 100 }], notes: 'Wedding suit - priority order' },
  { id: '2', orderNumber: 'ORD-046', customerId: '2', customerName: 'Sarah Johnson', garmentType: 'Shirt Alteration', fabric: 'Egyptian Cotton - White', deliveryDate: '2026-03-10', status: 'pending', total: 320, items: [{ description: 'Dress Shirt', quantity: 2, price: 150 }, { description: 'Monogramming', quantity: 2, price: 10 }], notes: '' },
  { id: '3', orderNumber: 'ORD-047', customerId: '3', customerName: 'Michael Chen', garmentType: 'Pants Hemming', fabric: 'Wool Blend - Gray', deliveryDate: '2026-03-09', status: 'completed', total: 180, items: [{ description: 'Pants Hemming', quantity: 2, price: 90 }], notes: 'Hem only' },
  { id: '4', orderNumber: 'ORD-048', customerId: '4', customerName: 'Emily Davis', garmentType: 'Wedding Suit Package', fabric: 'Premium Cashmere - Black', deliveryDate: '2026-03-20', status: 'in-progress', total: 1200, items: [{ description: 'Wedding Suit', quantity: 1, price: 950 }, { description: 'Dress Shirt', quantity: 1, price: 150 }, { description: 'Accessories', quantity: 1, price: 100 }], notes: 'Premium package with accessories' },
  { id: '5', orderNumber: 'ORD-049', customerId: '5', customerName: 'Robert Wilson', garmentType: '2-Piece Suit', fabric: 'Linen - Beige', deliveryDate: '2026-03-12', status: 'delivered', total: 650, items: [{ description: '2-Piece Suit', quantity: 1, price: 600 }, { description: 'Minor Alterations', quantity: 1, price: 50 }], notes: 'Ready for pickup' },
  { id: '6', orderNumber: 'ORD-050', customerId: '6', customerName: 'Lisa Anderson', garmentType: 'Custom Blazer', fabric: 'Tweed - Herringbone', deliveryDate: '2026-03-18', status: 'pending', total: 480, items: [{ description: 'Custom Blazer', quantity: 1, price: 480 }], notes: '' },
];

export const invoices: Invoice[] = [
  { id: '1', invoiceNumber: 'INV-001', customerId: '1', customerName: 'John Smith', orderId: '1', orderNumber: 'ORD-045', amount: 850, status: 'paid', date: '2026-03-01', service: 'Custom Suit', items: [{ description: '3-Piece Suit', quantity: 1, price: 750 }, { description: 'Alterations', quantity: 1, price: 100 }], paymentMethod: 'Credit Card', paymentDate: '2026-03-01' },
  { id: '2', invoiceNumber: 'INV-002', customerId: '2', customerName: 'Sarah Johnson', orderId: '2', orderNumber: 'ORD-046', amount: 320, status: 'pending', date: '2026-03-03', service: 'Shirt Alteration', items: [{ description: 'Dress Shirt', quantity: 2, price: 150 }, { description: 'Monogramming', quantity: 2, price: 10 }], paymentMethod: '', paymentDate: '' },
  { id: '3', invoiceNumber: 'INV-003', customerId: '3', customerName: 'Michael Chen', orderId: '3', orderNumber: 'ORD-047', amount: 180, status: 'overdue', date: '2026-03-04', service: 'Pants Hemming', items: [{ description: 'Pants Hemming', quantity: 2, price: 90 }], paymentMethod: '', paymentDate: '' },
  { id: '4', invoiceNumber: 'INV-004', customerId: '4', customerName: 'Emily Davis', orderId: '4', orderNumber: 'ORD-048', amount: 1200, status: 'paid', date: '2026-03-05', service: 'Wedding Suit Package', items: [{ description: 'Wedding Suit', quantity: 1, price: 950 }, { description: 'Dress Shirt', quantity: 1, price: 150 }, { description: 'Accessories', quantity: 1, price: 100 }], paymentMethod: 'Bank Transfer', paymentDate: '2026-03-05' },
];
