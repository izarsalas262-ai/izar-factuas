/// <reference types="vite/client" />
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Trash2, 
  X,
  CreditCard,
  User,
  ArrowRight,
  Banknote,
  DollarSign,
  Ticket,
  Printer,
  Save,
  FileText,
  Users,
  Settings,
  Calculator,
  Tag,
  Barcode,
  ClipboardList,
  LayoutDashboard,
  Calendar,
  ChevronDown,
  Pencil,
  LayoutGrid,
  Zap,
  BarChart3,
  Star,
  FileUp,
  Check,
  ChevronUp,
  FilePlus,
  Eye,
  Camera,
  Image as ImageIcon,
  Upload,
  Edit2,
  ArrowDownCircle,
  ArrowUpCircle,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  ArrowRightLeft,
  History,
  MessageCircle,
  Menu,
  Info,
  Bell,
  Archive,
  Scale,
  Monitor,
  Lock,
  Unlock,
  Key,
  Shield,
  UserCheck,
  UserX,
  LogOut,
  Cloud,
  CloudOff,
  RefreshCw,
  Mail,
  Ban,
  RotateCcw,
  Hash,
  Type,
  Bold
} from 'lucide-react';

const AVAILABLE_FONTS = [
  { name: 'Standard (Sans)', value: '"Inter", sans-serif' },
  { name: 'Modern (Grotesk)', value: '"Space Grotesk", sans-serif' },
  { name: 'Classic (Serif)', value: '"Playfair Display", serif' },
  { name: 'Technical (Mono)', value: '"JetBrains Mono", monospace' },
  { name: 'Elegant (Outfit)', value: '"Outfit", sans-serif' },
  { name: 'Impact (Anton)', value: '"Anton", sans-serif' },
  { name: 'Handwritten (Satisfy)', value: '"Satisfy", cursive' }
];
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where,
  updateDoc,
  Timestamp,
  serverTimestamp,
  writeBatch,
  getDocFromServer
} from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Configuration consolidated from firebase-applet-config.json
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "facturacion-izar",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:873464345399:web:ac9ae2ed8b735a3fada0b2",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCu6fuECK7OVHxvy0CK5G5lmL9KyDqNWkM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "facturacion-izar.firebaseapp.com",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "facturacion-izar.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "873464345399",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-YWJD270EZ3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Types
interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

// Error handling logic
function handleFirestoreError(error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null): never {
  const authInfo = auth.currentUser ? {
    userId: auth.currentUser.uid,
    email: auth.currentUser.email || '',
    emailVerified: auth.currentUser.emailVerified,
    isAnonymous: auth.currentUser.isAnonymous,
    providerInfo: auth.currentUser.providerData.map(p => ({
      providerId: p.providerId,
      displayName: p.displayName || '',
      email: p.email || '',
    }))
  } : {
    userId: 'unauthenticated',
    email: '',
    emailVerified: false,
    isAnonymous: true,
    providerInfo: []
  };

  const errorInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo
  };
  throw new Error(JSON.stringify(errorInfo));
}

// Global test function
async function testConnection() {
  console.log("Iniciando prueba de conexión con Firebase...");
  try {
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Conexión con Firebase establecida correctamente.");
  } catch (error: any) {
    if (error.code !== 'permission-denied') {
      console.error("Error de conexión Firebase:", error.message);
    }
  }
}

// Mock Data (Empty by default as requested)
const PRODUCTS: any[] = [];

interface CartItem {
  id: number;
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  costPrice: number;
  category: string;
  stock: number;
  minStock: number;
  barcode: string;
  image: string | null;
  department: string;
  useInventory: boolean;
}

interface Sale {
  id: number;
  items: any[];
  subtotal: number;
  discount: number;
  itbis: number;
  tipAmount: number;
  total: number;
  date: string;
  paymentMethod: string;
  cashier: string;
  customerId: number | null;
  usdInfo: {
    rate: number;
    received: number;
    changeDop: number;
  };
  status: 'completada' | 'cancelada' | 'devuelta';
}

interface Promotion {
  id: number;
  title: string;
  description: string;
  image: string | null;
  startDate: string;
  endDate: string;
  active: boolean;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  rnc?: string;
  address: string;
  points: number;
  balance: number;
  discountPercentage?: number;
  createdAt: string;
}

interface FinancingPayment {
  id: number;
  amount: number;
  date: string;
  note: string;
  method?: string;
}

interface Financing {
  id: number;
  customerId: number;
  customerName: string;
  totalAmount: number;
  remainingAmount: number;
  downPayment: number;
  installmentsCount: number;
  installmentsFrequency: 'semanal' | 'quincenal' | 'mensual';
  startDate: string;
  status: 'activo' | 'completado' | 'atrasado';
  payments: FinancingPayment[];
  items: CartItem[];
}

interface CashOut {
  id: number;
  amount: number;
  description: string;
  category: string;
  date: string;
  cashier: string;
}

interface UserPermissions {
  canManageProducts: boolean;
  canManageInventory: boolean;
  canManageCustomers: boolean;
  canViewSales: boolean;
  canDeleteSales: boolean;
  canViewFinances: boolean;
  canPerformCorte: boolean;
  canManageSettings: boolean;
  canManageUsers: boolean;
  canManageSalidas: boolean;
  canEditPrices: boolean;
}

interface OpenAccount {
  id: number;
  name: string;
  items: CartItem[];
  total: number;
  createdAt: string;
  customerId?: number | null;
}

interface Quotation {
  id: number;
  items: CartItem[];
  subtotal: number;
  discount: number;
  itbis: number;
  total: number;
  createdAt: string;
  validUntil: string;
  customerId: number | null;
  customerName: string;
  notes?: string;
  status: 'pendiente' | 'aceptada' | 'vencida';
}

interface AppUser {
  id: number;
  name: string;
  username: string;
  pin: string;
  role: 'admin' | 'cajero';
  permissions: UserPermissions;
  active: boolean;
}

const CustomerSearchSelect = ({ 
  customers, 
  value, 
  onChange, 
  placeholder = "-- Seleccione Cliente --",
  colorScheme = "blue",
  allowClear = true,
  className = ""
}: { 
  customers: Customer[], 
  value: number | null, 
  onChange: (id: number | null) => void,
  placeholder?: string,
  colorScheme?: "blue" | "yellow" | "orange" | "red",
  allowClear?: boolean,
  className?: string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.rnc && c.rnc.includes(search))
  );

  const selected = customers.find(c => c.id === value);

  const schemes = {
    blue: {
      border: "border-blue-500",
      ring: "focus:ring-blue-100",
      text: "text-blue-700",
      bg: "bg-blue-50",
      hover: "hover:bg-blue-100",
      icon: "text-blue-400"
    },
    yellow: {
      border: "border-yellow-500",
      ring: "focus:ring-yellow-100",
      text: "text-yellow-700",
      bg: "bg-yellow-50",
      hover: "hover:bg-yellow-100",
      icon: "text-yellow-400"
    },
    orange: {
      border: "border-orange-400",
      ring: "focus:ring-orange-100",
      text: "text-orange-700",
      bg: "bg-orange-50",
      hover: "hover:bg-orange-100",
      icon: "text-orange-400"
    },
    red: {
      border: "border-red-500",
      ring: "focus:ring-red-100",
      text: "text-red-700",
      bg: "bg-red-50",
      hover: "hover:bg-red-100",
      icon: "text-red-400"
    }
  };

  const scheme = schemes[colorScheme];

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border-2 ${scheme.border} rounded-xl p-3 text-left font-bold text-gray-700 outline-none focus:ring-4 ${scheme.ring} transition-all flex justify-between items-center shadow-sm`}
      >
        <span className={`${selected ? "text-gray-900" : "text-gray-400"} truncate`}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown size={18} className={`transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''} ${scheme.icon}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[150]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border-2 border-gray-100 z-[160] overflow-hidden flex flex-col max-h-[350px]"
            >
              <div className="p-3 border-b-2 border-gray-50 bg-gray-50/30">
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Buscar cliente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white border-2 border-gray-100 rounded-xl py-2 pl-9 pr-4 text-xs font-black uppercase tracking-tight text-gray-700 outline-none focus:border-blue-400 transition-all"
                  />
                </div>
              </div>

              <div className="overflow-y-auto custom-scrollbar">
                {allowClear && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(null);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 transition-all flex items-center justify-between group"
                  >
                    <span className="text-gray-400 font-bold italic text-xs uppercase tracking-widest">-- Quitar Selección --</span>
                  </button>
                )}
                {filtered.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onChange(c.id);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-all flex items-center justify-between group ${scheme.hover} ${value === c.id ? scheme.bg : ''}`}
                  >
                    <div className="min-w-0 pr-4 text-left">
                      <div className={`font-black uppercase tracking-tight truncate text-xs ${value === c.id ? scheme.text : 'text-gray-800'}`}>{c.name}</div>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Tel: {c.phone}</span>
                        {c.rnc && <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">RNC: {c.rnc}</span>}
                      </div>
                    </div>
                    {value === c.id && <Check size={14} className={scheme.text} />}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="p-8 text-center text-gray-300">
                    <Search size={24} className="mx-auto mb-2 opacity-20" />
                    <p className="font-black uppercase text-[10px] tracking-widest">No hay resultados</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const DEFAULT_ADMIN: AppUser = {
  id: 1,
  name: 'Administrador',
  username: 'admin',
  pin: '1234',
  role: 'admin',
  active: true,
  permissions: {
    canManageProducts: true,
    canManageInventory: true,
    canManageCustomers: true,
    canViewSales: true,
    canDeleteSales: true,
    canViewFinances: true,
    canPerformCorte: true,
    canManageSettings: true,
    canManageUsers: true,
    canManageSalidas: true,
    canEditPrices: true,
  }
};

export default function App() {
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [businessInfo, setBusinessInfo] = useState<any>(null);
  const [allBusinesses, setAllBusinesses] = useState<any[]>([]);
  const [showEmailForm, setShowEmailForm] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  const isSuperAdmin = useMemo(() => {
    return fbUser?.email === 'izar.salas262@gmail.com';
  }, [fbUser]);

  // Sync all businesses for SuperAdmin
  useEffect(() => {
    if (isSuperAdmin) {
      const unsub = onSnapshot(collection(db, 'businesses'), (snap) => {
        setAllBusinesses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsub();
    } else {
      setAllBusinesses([]);
    }
  }, [isSuperAdmin]);

  // Auth Listener
  useEffect(() => {
    // Safety timeout to ensure isAuthLoading doesn't stay true forever
    const safetyTimer = setTimeout(() => {
      setIsAuthLoading(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
      setIsAuthLoading(false);
      clearTimeout(safetyTimer);
      if (user) {
        testConnection();
      } else {
        setBusinessInfo(null);
        // Revenir a datos locales
        const savedProducts = localStorage.getItem('yg_products');
        setProductsList(savedProducts ? JSON.parse(savedProducts) : PRODUCTS);
        
        const savedCustomers = localStorage.getItem('yg_customers');
        setCustomersList(savedCustomers ? JSON.parse(savedCustomers) : []);
        
        const savedUsers = localStorage.getItem('yg_users');
        setUsersList(savedUsers ? JSON.parse(savedUsers) : [DEFAULT_ADMIN]);
        
        const savedSales = localStorage.getItem('yg_sales');
        setSalesHistory(savedSales ? JSON.parse(savedSales) : []);
      }
    });
    return () => unsubscribe();
  }, []);

  // Is Subscription Expired?
  const isSubscriptionExpired = useMemo(() => {
    if (!fbUser || !businessInfo || isSuperAdmin) return false;
    if (!businessInfo.subscriptionEndDate) return false; 
    
    const endDate = new Date(businessInfo.subscriptionEndDate);
    return new Date() > endDate;
  }, [fbUser, businessInfo, isSuperAdmin]);

  // Cloud Sync Effect
  useEffect(() => {
    if (!fbUser) return;

    setIsSyncing(true);
    const busId = fbUser.uid;
    
    // Subscribe to Business Info
    const unsubBus = onSnapshot(doc(db, 'businesses', busId), (snap) => {
      if (snap.exists()) {
        setBusinessInfo(snap.data());
      } else {
        // Initial setup if business doesn't exist
        const initialData = {
          ownerId: fbUser.uid,
          email: fbUser.email,
          name: ticketConfig.storeName,
          createdAt: new Date().toISOString(),
          // Default 30 days trial for new cloud users
          subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'trial'
        };
        setDoc(doc(db, 'businesses', busId), initialData);
        setBusinessInfo(initialData);
      }
    }, (err) => handleFirestoreError(err, 'get', `businesses/${busId}`));

    // Subscribe to collections
    const unsubProducts = onSnapshot(collection(db, `businesses/${busId}/products`), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (data.length > 0) setProductsList(data as any);
    }, (err) => handleFirestoreError(err, 'list', `businesses/${busId}/products`));

    const unsubSales = onSnapshot(collection(db, `businesses/${busId}/sales`), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (data.length > 0) setSalesHistory(data as any);
    }, (err) => handleFirestoreError(err, 'list', `businesses/${busId}/sales`));

    const unsubCustomers = onSnapshot(collection(db, `businesses/${busId}/customers`), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (data.length > 0) setCustomersList(data as any);
    }, (err) => handleFirestoreError(err, 'list', `businesses/${busId}/customers`));

    const unsubUsers = onSnapshot(collection(db, `businesses/${busId}/users`), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (data.length > 0) {
        setUsersList(data as any);
      } else {
        // Si no hay usuarios en la nube, creamos el admin maestro
        const defaultAdmin = DEFAULT_ADMIN;
        setDoc(doc(db, `businesses/${busId}/users`, defaultAdmin.id.toString()), defaultAdmin);
        setUsersList([defaultAdmin]);
      }
    }, (err) => handleFirestoreError(err, 'list', `businesses/${busId}/users`));

    const unsubCashOuts = onSnapshot(collection(db, `businesses/${busId}/cashouts`), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (data.length > 0) setCashOutsList(data as any);
    }, (err) => handleFirestoreError(err, 'list', `businesses/${busId}/cashouts`));

    setIsSyncing(false);

    return () => {
      unsubBus();
      unsubProducts();
      unsubSales();
      unsubCustomers();
      unsubUsers();
      unsubCashOuts();
    };
  }, [fbUser]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      showMessage('Por favor ingrese correo y contraseña', 'error');
      return;
    }
    
    setIsAuthLoading(true);
    
    try {
      console.log("Intentando login para:", authEmail);
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
      console.log("Login exitoso en Firebase Auth");
      showMessage('Conexión establecida. Entrando...', 'success');
      
      // Limpiar password y cerrar formularios
      setAuthPassword('');
      setShowEmailForm(false);
      
      // Intentar login inmediato con un admin o fallback
      const admin = usersList.find(u => u.role === 'admin' && u.active) || usersList[0] || DEFAULT_ADMIN;
      console.log("Seleccionando usuario inicial:", admin.name);
      setCurrentUser(admin);
      setShowLogin(false);
      
    } catch (error: any) {
      console.error("Error de autenticación completo:", error);
      
      if (error.code === 'auth/too-many-requests') {
        showMessage('DEMASIADOS INTENTOS: Espere unos minutos antes de volver a intentar.', 'error');
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        showMessage('CREDENCIALES INCORRECTAS: Verifique su correo y contraseña.', 'error');
      } else if (error.code === 'auth/user-not-found') {
        showMessage('USUARIO NO ENCONTRADO: El correo no está registrado en Firebase.', 'error');
      } else if (error.code === 'auth/invalid-email') {
        showMessage('CORREO INVÁLIDO: El formato del correo no es correcto.', 'error');
      } else if (error.code === 'auth/operation-not-allowed') {
        showMessage('ERROR DE FIREBASE: El proveedor de Correo/Contraseña no está habilitado en la consola de Firebase.', 'error');
      } else if (error.code === 'auth/network-request-failed') {
        showMessage('ERROR DE RED: No hay conexión con los servidores de Firebase.', 'error');
      } else {
        showMessage('ERROR: ' + (error.message || 'Ocurrió un problema al iniciar sesión'), 'error');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogoutCloud = async () => {
    try {
      await firebaseSignOut(auth);
      showMessage('Sesión de la nube cerrada', 'info');
    } catch (error: any) {
      showMessage('Error al cerrar sesión: ' + error.message, 'error');
    }
  };

  const updateSubscription = async (busId: string, daysToAdd: number) => {
    try {
      const busRef = doc(db, 'businesses', busId);
      const business = allBusinesses.find(b => b.id === busId);
      const currentEnd = business?.subscriptionEndDate;
      
      let baseDate = currentEnd ? new Date(currentEnd) : new Date();
      // Si ya está vencido, empezamos desde hoy
      if (baseDate < new Date()) baseDate = new Date();
      
      const newEndDate = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      
      await updateDoc(busRef, {
        subscriptionEndDate: newEndDate.toISOString(),
        status: 'active'
      });
      
      showMessage(`Suscripción de ${business?.name || 'negocio'} actualizada`, 'success');
    } catch (error: any) {
      showMessage('Error al actualizar: ' + error.message, 'error');
    }
  };

  const cloudSync = {
    saveProduct: async (p: any) => {
      if (!fbUser) return;
      try {
        await setDoc(doc(db, `businesses/${fbUser.uid}/products`, p.id.toString()), {
          ...p,
          updatedAt: serverTimestamp()
        });
      } catch (e) {}
    },
    saveSale: async (s: any) => {
      if (!fbUser) return;
      try {
        await setDoc(doc(db, `businesses/${fbUser.uid}/sales`, s.id.toString()), s);
      } catch (e) {}
    },
    saveCustomer: async (c: any) => {
      if (!fbUser) return;
      try {
        await setDoc(doc(db, `businesses/${fbUser.uid}/customers`, c.id.toString()), c);
      } catch (e) {}
    },
    saveUser: async (u: any) => {
      if (!fbUser) return;
      try {
        await setDoc(doc(db, `businesses/${fbUser.uid}/users`, u.id.toString()), u);
      } catch (e) {}
    },
    saveCashOut: async (co: any) => {
      if (!fbUser) return;
      try {
        await setDoc(doc(db, `businesses/${fbUser.uid}/cashouts`, co.id.toString()), co);
      } catch (e) {}
    }
  };

  const migrateToCloud = async () => {
    if (!fbUser) return;
    const busId = fbUser.uid;
    
    setIsSyncing(true);
    try {
      const batch = writeBatch(db);
      
      // Save business document
      batch.set(doc(db, 'businesses', busId), {
        ownerId: fbUser.uid,
        email: fbUser.email,
        name: ticketConfig.storeName,
        createdAt: serverTimestamp()
      });

      // Migrate Products
      productsList.forEach(p => {
        const ref = doc(collection(db, `businesses/${busId}/products`), p.id.toString());
        batch.set(ref, { ...p, updatedAt: serverTimestamp() });
      });

      // Migrate Customers
      customersList.forEach(c => {
        const ref = doc(collection(db, `businesses/${busId}/customers`), c.id.toString());
        batch.set(ref, c);
      });

      // Migrate Users
      usersList.forEach(u => {
        const ref = doc(collection(db, `businesses/${busId}/users`), u.id.toString());
        batch.set(ref, u);
      });

      // Commit
      await batch.commit();
      showMessage('Datos sincronizados con la nube correctamente', 'success');
    } catch (error: any) {
      console.error(error);
      showMessage('Error al sincronizar: ' + error.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const [productsList, setProductsList] = useState(() => {
    try {
      const saved = localStorage.getItem('yg_products');
      const parsed = saved ? JSON.parse(saved) : PRODUCTS;
      return Array.isArray(parsed) ? parsed : PRODUCTS;
    } catch {
      return PRODUCTS;
    }
  });
  const [departments, setDepartments] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('yg_departments');
      const parsed = saved ? JSON.parse(saved) : ['Sin Departamento'];
      return Array.isArray(parsed) ? parsed : ['Sin Departamento'];
    } catch {
      return ['Sin Departamento'];
    }
  });
  const [salesHistory, setSalesHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('yg_sales');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [promotionsList, setPromotionsList] = useState<Promotion[]>(() => {
    try {
      const saved = localStorage.getItem('yg_promotions');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [customersList, setCustomersList] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem('yg_customers');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [financingsList, setFinancingsList] = useState<Financing[]>(() => {
    try {
      const saved = localStorage.getItem('yg_financings');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [salesDateFilter, setSalesDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Sale | null>(null);

  const [cashOutsList, setCashOutsList] = useState<CashOut[]>(() => {
    try {
      const saved = localStorage.getItem('yg_cash_outs');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const cashOutCategories = ['Servicios (Luz/Agua)', 'Distribuidores', 'Nómina', 'Gastos Menores', 'Reparaciones', 'Otros'];

  const [currentView, setCurrentView] = useState('ventas');
  const [corteDate, setCorteDate] = useState(new Date().toISOString().split('T')[0]);
  const [abonoMethod, setAbonoMethod] = useState('efectivo');
  const [initialCash, setInitialCash] = useState<number>(() => {
    const saved = localStorage.getItem('yg_initial_cash');
    return saved ? parseFloat(saved) : 0;
  });
  const [usdRate, setUsdRate] = useState<number>(() => {
    const saved = localStorage.getItem('yg_usd_rate');
    return saved ? parseFloat(saved) : 58.5;
  });

  const [ticketConfig, setTicketConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('yg_ticket_config');
      const defaultTicket = {
        storeName: 'Y.G Facturación',
        address: 'Calle Principal #123, Sector Centro',
        phone: '809-555-0123',
        rnc: '101-23456-7',
        website: 'www.ygmarket.com',
        message: '¡Gracias por su compra!',
        showLogo: true,
        logo: 'https://picsum.photos/seed/shop/200/200',
        printSize: '80mm',
        openDrawerOnPrint: true,
        fontFamily: '"Inter", sans-serif',
        isBold: false
      };
      return saved ? { ...defaultTicket, ...JSON.parse(saved) } : defaultTicket;
    } catch {
      return {
        storeName: 'Y.G Facturación',
        address: 'Calle Principal #123, Sector Centro',
        phone: '809-555-0123',
        rnc: '101-23456-7',
        website: 'www.ygmarket.com',
        message: '¡Gracias por su compra!',
        showLogo: true,
        logo: 'https://picsum.photos/seed/shop/200/200',
        printSize: '80mm',
        openDrawerOnPrint: true
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('yg_ticket_config', JSON.stringify(ticketConfig));
  }, [ticketConfig]);

  const [cashDenominations, setCashDenominations] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('yg_denominations');
      return saved ? JSON.parse(saved) : {
        '2000': 0, '1000': 0, '500': 0, '200': 0, '100': 0, '50': 0, '25': 0, '10': 0, '5': 0, '1': 0
      };
    } catch {
      return { '2000': 0, '1000': 0, '500': 0, '200': 0, '100': 0, '50': 0, '25': 0, '10': 0, '5': 0, '1': 0 };
    }
  });

  useEffect(() => {
    localStorage.setItem('yg_denominations', JSON.stringify(cashDenominations));
  }, [cashDenominations]);

  const [backupConfig, setBackupConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('yg_backup_config');
      return saved ? JSON.parse(saved) : { autoBackup: true, backupInterval: 30 };
    } catch {
      return { autoBackup: true, backupInterval: 30 };
    }
  });

  useEffect(() => {
    localStorage.setItem('yg_backup_config', JSON.stringify(backupConfig));
  }, [backupConfig]);

  useEffect(() => {
    localStorage.setItem('yg_initial_cash', initialCash.toString());
  }, [initialCash]);

  useEffect(() => {
    localStorage.setItem('yg_usd_rate', usdRate.toString());
  }, [usdRate]);

  const [ventasDisplayMode, setVentasDisplayMode] = useState<'search' | 'quick'>('quick');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [usdPaidAmount, setUsdPaidAmount] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [useItbis, setUseItbis] = useState(true);
  const [tipPercentage, setTipPercentage] = useState<number>(0);
  const [productSuccess, setProductSuccess] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [editingQuantityId, setEditingQuantityId] = useState<number | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');
  const [tempQuantity, setTempQuantity] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [globalMessage, setGlobalMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{text: string, onConfirm: () => void} | null>(null);
  const [isScaleConnected, setIsScaleConnected] = useState(false);
  const [currentScaleWeight, setCurrentScaleWeight] = useState<number>(0);
  const [scalePort, setScalePort] = useState<any>(null);
  const [productPendingWeight, setProductPendingWeight] = useState<any>(null);
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [holdAccountName, setHoldAccountName] = useState('');
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null);
  const [quotationSearchTerm, setQuotationSearchTerm] = useState('');

  const [isDemoMode, setIsDemoMode] = useState(false);
  const [openAccounts, setOpenAccounts] = useState<OpenAccount[]>(() => {
    try {
      const saved = localStorage.getItem('yg_open_accounts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [quotationsList, setQuotationsList] = useState<Quotation[]>(() => {
    try {
      const saved = localStorage.getItem('yg_quotations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('yg_quotations', JSON.stringify(quotationsList));
  }, [quotationsList]);

  useEffect(() => {
    localStorage.setItem('yg_open_accounts', JSON.stringify(openAccounts));
  }, [openAccounts]);

  const [usersList, setUsersList] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem('yg_users');
      return saved ? JSON.parse(saved) : [DEFAULT_ADMIN];
    } catch {
      return [DEFAULT_ADMIN];
    }
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [selectedUserForLogin, setSelectedUserForLogin] = useState<AppUser | null>(null);
  const [loginPin, setLoginPin] = useState('');
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [userMode, setUserMode] = useState<'nuevo' | 'editar'>('nuevo');
  const [userForm, setUserForm] = useState<AppUser>({
    id: 0,
    name: '',
    username: '',
    pin: '',
    role: 'cajero',
    active: true,
    permissions: {
      canManageProducts: false,
      canManageInventory: false,
      canManageCustomers: true,
      canViewSales: false,
      canDeleteSales: false,
      canViewFinances: false,
      canPerformCorte: false,
      canManageSettings: false,
      canManageUsers: false,
      canManageSalidas: true,
      canEditPrices: false,
    }
  });

  const loadDemoData = () => {
    // Verificar período de prueba de 15 días
    const demoStartDate = localStorage.getItem('yg_demo_start_date');
    const today = new Date();

    if (demoStartDate) {
      const start = new Date(demoStartDate);
      const diffTime = Math.abs(today.getTime() - start.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 15) {
        setGlobalMessage({
          type: 'error',
          text: 'Su período de prueba de 15 días ha vencido. Contacte a soporte al 829-892-5070 para adquirir la licencia completa.'
        });
        return;
      }
    } else {
      // Primera vez que entra a la demo, guardamos la fecha
      localStorage.setItem('yg_demo_start_date', today.toISOString());
    }

    // Demo Products
    const demoProducts: Product[] = [
      { id: 101, name: 'Refresco Coca Cola 2L', price: 125, costPrice: 95, barcode: '7441001', stock: 45, minStock: 10, category: 'Bebidas', useInventory: true, department: 'Abarrotes', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400' },
      { id: 102, name: 'Arroz Selecto 5lb', price: 185, costPrice: 150, barcode: '7441002', stock: 30, minStock: 5, category: 'Comestibles', useInventory: true, department: 'Abarrotes', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400' },
      { id: 103, name: 'Aceite de Oliva 500ml', price: 450, costPrice: 380, barcode: '7441003', stock: 12, minStock: 3, category: 'Comestibles', useInventory: true, department: 'Abarrotes', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400' },
      { id: 104, name: 'Pringles Original', price: 145, costPrice: 110, barcode: '7441004', stock: 24, minStock: 6, category: 'Snacks', useInventory: true, department: 'Pasillo 4', image: 'https://images.unsplash.com/photo-1566478489297-f6963f93121c?auto=format&fit=crop&q=80&w=400' },
      { id: 105, name: 'Detergente en Polvo 1kg', price: 95, costPrice: 70, barcode: '7441005', stock: 50, minStock: 10, category: 'Limpieza', useInventory: true, department: 'Hogar', image: 'https://images.unsplash.com/photo-1584622781564-1d9876a13d00?auto=format&fit=crop&q=80&w=400' },
      { id: 106, name: 'Leche Entera 1L', price: 75, costPrice: 60, barcode: '7441006', stock: 20, minStock: 4, category: 'Lácteos', useInventory: true, department: 'Refrigerados', image: 'https://images.unsplash.com/photo-1550583724-125581cc2532?auto=format&fit=crop&q=80&w=400' },
      { id: 107, name: 'Queso Cheddar 1lb', price: 320, costPrice: 260, barcode: '7441007', stock: 8, minStock: 2, category: 'Lácteos', useInventory: true, department: 'Refrigerados', image: 'https://images.unsplash.com/photo-1618164435735-413d3b066c9a?auto=format&fit=crop&q=80&w=400' },
      { id: 108, name: 'Café Molido 1lb', price: 225, costPrice: 180, barcode: '7441008', stock: 15, minStock: 5, category: 'Bebidas', useInventory: true, department: 'Abarrotes', image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=400' },
      { id: 109, name: 'Pasta de Dientes', price: 85, costPrice: 60, barcode: '7441009', stock: 35, minStock: 8, category: 'Cuidado Personal', useInventory: true, department: 'Hogar', image: 'https://images.unsplash.com/photo-1559591961-fcd84f67691d?auto=format&fit=crop&q=80&w=400' },
      { id: 110, name: 'Jabón en Barra', price: 45, costPrice: 30, barcode: '7441010', stock: 60, minStock: 12, category: 'Cuidado Personal', useInventory: true, department: 'Hogar', image: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&q=80&w=400' }
    ];

    // Demo Customers
    const demoCustomers: Customer[] = [
      { id: 201, name: 'Juan Pérez', phone: '809-555-0101', email: 'juan@example.com', address: 'Av. Winston Churchill #12, DN', rnc: '101010101', points: 150, balance: 0, createdAt: new Date().toISOString() },
      { id: 202, name: 'María Rodríguez', phone: '829-555-0202', email: 'maria@example.com', address: 'C/ El Sol #45, Santiago', rnc: '', points: 85, balance: 500, createdAt: new Date().toISOString() }
    ];

    // Generate 7 days of sales
    const demoSales: Sale[] = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dailySalesCount = 3 + Math.floor(Math.random() * 5);
        
        for (let j = 0; j < dailySalesCount; j++) {
            const randomProd = demoProducts[Math.floor(Math.random() * demoProducts.length)];
            const qty = 1 + Math.floor(Math.random() * 3);
            const subtotal = randomProd.price * qty;
            const itbis = subtotal * 0.18;
            const total = subtotal + itbis;
            
            demoSales.push({
                id: Date.now() + i * 1000 + j,
                items: [{ ...randomProd, quantity: qty }],
                subtotal,
                discount: 0,
                itbis,
                tipAmount: 0,
                total,
                date: date.toISOString(),
                paymentMethod: 'efectivo',
                cashier: 'Administrador Demo',
                customerId: Math.random() > 0.5 ? 201 : null,
                status: 'completada' as const,
                usdInfo: { rate: 60, received: 0, changeDop: 0 }
            });
        }
    }

    if (productsList.length === 0) setProductsList(demoProducts);
    if (customersList.length === 0) setCustomersList(demoCustomers);
    if (salesHistory.length === 0) setSalesHistory(demoSales);
    
    setIsDemoMode(true);
    setCurrentUser(usersList[0]); // Log in as admin
    setShowLogin(false);
    showMessage('Datos Demo cargados correctamente. ¡Explora el sistema!', 'success');
  };

  const handleLogin = (user: AppUser, pin: string) => {
    // Verificar período de prueba de 15 días si no está en la nube
    if (!fbUser) {
      const demoStartDate = localStorage.getItem('yg_demo_start_date');
      if (demoStartDate) {
        const start = new Date(demoStartDate);
        const diffDays = Math.floor(Math.abs(Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 15) {
          setGlobalMessage({
            type: 'error',
            text: 'Su período de prueba local de 15 días ha vencido. Inicie sesión en la NUBE o contacte a soporte al 829-892-5070.'
          });
          return;
        }
      }
    }

    if (user.pin === pin) {
      setCurrentUser(user);
      setShowLogin(false);
      setSelectedUserForLogin(null);
      setLoginPin('');
      showMessage(`Bienvenido, ${user.name}`, 'success');
    } else {
      showMessage('PIN Incorrecto', 'error');
      setLoginPin('');
    }
  };

  const handleSwitchUser = () => {
    setSelectedUserForLogin(null);
    setLoginPin('');
    setShowLogin(true);
  };

  const handleLogout = () => {
    setConfirmDialog({
      text: '¿Deseas cerrar la sesión actual?',
      onConfirm: () => {
        handleAutoBackup();
        setCurrentUser(null);
        setShowLogin(true);
        setCurrentView('ventas');
        showMessage('Sesión cerrada y respaldo guardado', 'info');
      }
    });
  };

  const saveUser = () => {
    if (!userForm.name || !userForm.username || !userForm.pin) {
      showMessage('Complete todos los campos obligatorios', 'error');
      return;
    }

    let finalUser = { ...userForm };
    if (finalUser.role === 'admin') {
      const allOn = Object.keys(finalUser.permissions).reduce((acc, k) => ({ ...acc, [k]: true }), {});
      finalUser.permissions = allOn as any;
    }

    if (userMode === 'nuevo') {
      const newUser = { ...finalUser, id: Date.now() };
      setUsersList(prev => [...prev, newUser]);
      cloudSync.saveUser(newUser);
      showMessage('Usuario creado con éxito', 'success');
    } else {
      setUsersList(prev => prev.map(u => u.id === finalUser.id ? finalUser : u));
      cloudSync.saveUser(finalUser);
      // Si el usuario editado es el actual, actualizar la sesión
      if (currentUser && currentUser.id === finalUser.id) {
        setCurrentUser(finalUser);
      }
      showMessage('Usuario actualizado con éxito', 'success');
    }
    setShowUserDialog(false);
  };

  const deleteUser = (userId: number) => {
    const userToDelete = usersList.find(u => u.id === userId);
    if (!userToDelete) return;

    if (userToDelete.role === 'admin') {
      showMessage('Por razones de seguridad, los usuarios con rol de Administrador no pueden ser eliminados.', 'error');
      return;
    }

    if (currentUser && currentUser.id === userId) {
      showMessage('No puedes eliminar tu propio usuario mientras estás en sesión.', 'error');
      return;
    }

    setConfirmDialog({
      text: `¿Estás seguro de que deseas ELIMINAR permanentemente al usuario "${userToDelete.name}"? Esta acción no se puede deshacer.`,
      onConfirm: () => {
        setUsersList(prev => prev.filter(u => u.id !== userId));
        showMessage('Usuario eliminado correctamente', 'success');
      }
    });
  };

  useEffect(() => {
    localStorage.setItem('yg_users', JSON.stringify(usersList));
  }, [usersList]);

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setGlobalMessage({ type, text });
    setTimeout(() => setGlobalMessage(null), 3000);
  };

  const handleExportBackup = () => {
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      products: productsList,
      departments: departments,
      sales: salesHistory,
      promotions: promotionsList,
      customers: customersList,
      financings: financingsList,
      cashOuts: cashOutsList,
      initialCash: initialCash,
      usdRate: usdRate,
      ticketConfig: ticketConfig,
      denominations: cashDenominations,
      users: usersList
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_ygmarket_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showMessage('Copia de datos exportada con éxito', 'success');
  };

  // Auto-login app user after cloud sync completes
  useEffect(() => {
    if (fbUser && showLogin) {
      if (currentUser) {
        setShowLogin(false);
        return;
      }

      // Probar selección inmediata si hay usuarios, o esperar un poco para sincronización
      const selectUser = () => {
        const admin = usersList.find(u => u.role === 'admin' && u.active) || usersList[0] || DEFAULT_ADMIN;
        if (admin) {
          console.log("Auto-login detectado para:", admin.name);
          setCurrentUser(admin);
          setShowLogin(false);
          showMessage(`Bienvenido, ${admin.name}`, 'success');
        }
      };

      if (usersList.length > 0) {
        selectUser();
      } else {
        const timer = setTimeout(selectUser, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [fbUser, currentUser, usersList, showLogin]);

  const handleAutoBackup = async () => {
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      products: productsList,
      departments: departments,
      sales: salesHistory,
      promotions: promotionsList,
      customers: customersList,
      financings: financingsList,
      cashOuts: cashOutsList,
      initialCash: initialCash,
      usdRate: usdRate,
      ticketConfig: ticketConfig,
      denominations: cashDenominations,
      users: usersList
    };

    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupData)
      });
      const result = await response.json();
      if (result.success) {
        showMessage('Guardado automático realizado con éxito', 'success');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Backup error:", error);
      showMessage('Error al guardar respaldo automático en servidor', 'error');
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (!data.products || !data.sales || !data.customers) {
          throw new Error('El archivo no parece ser un respaldo válido de Y.G Facturación');
        }

        setConfirmDialog({
          text: '¿Estás seguro de que deseas restaurar este respaldo? Se sobrescribirán todos los datos actuales.',
          onConfirm: () => {
            if (data.products) setProductsList(data.products);
            if (data.departments) setDepartments(data.departments);
            if (data.sales) setSalesHistory(data.sales);
            if (data.promotions) setPromotionsList(data.promotions);
            if (data.customers) setCustomersList(data.customers);
            if (data.financings) setFinancingsList(data.financings);
            if (data.cashOuts) setCashOutsList(data.cashOuts);
            if (data.initialCash !== undefined) setInitialCash(data.initialCash);
            if (data.usdRate !== undefined) setUsdRate(data.usdRate);
            if (data.ticketConfig) setTicketConfig(data.ticketConfig);
            if (data.denominations) setCashDenominations(data.denominations);
            if (data.users && Array.isArray(data.users)) setUsersList(data.users);

            showMessage('Copia de datos restaurada con éxito', 'success');
          }
        });
      } catch (error) {
        showMessage('Error al leer el archivo de respaldo', 'error');
        console.error(error);
      }
    };
    reader.readAsText(file);
    // Clear input
    event.target.value = '';
  };

  const handleConnectScale = async () => {
    if (!('serial' in navigator)) {
      setConfirmDialog({
        text: 'Navegador no compatible con Básculas (Web Serial API). ¿Desea activar el MODO SIMULACIÓN para realizar pruebas?',
        onConfirm: () => {
          setIsScaleConnected(true);
          setCurrentScaleWeight(1.25);
          showMessage('Modo Simulación de Báscula activado', 'info');
        }
      });
      return;
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      setScalePort(port);
      setIsScaleConnected(true);
      showMessage('Báscula conectada correctamente', 'success');

      const textDecoder = new TextDecoder();
      const reader = port.readable.getReader();
      
      const read = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const text = textDecoder.decode(value);
            const weightMatch = text.match(/[-+]?\d*\.\d+|\d+/);
            if (weightMatch) {
              setCurrentScaleWeight(parseFloat(weightMatch[0]));
            }
          }
        } catch (err) {
          console.error("Scale read error:", err);
          setIsScaleConnected(false);
          setScalePort(null);
        } finally {
          reader.releaseLock();
        }
      };

      read();
    } catch (e) {
      console.error("Connection error:", e);
      showMessage('Error al conectar con la báscula o cancelado', 'error');
    }
  };

  const dailyTransactions = useMemo(() => {
    const day = corteDate;
    
    // Sales - Only count direct payments (Cash, Card, Transfer)
    // For Financing sales, we only count the money actually received (down payments are recorded separately in financingsList)
    const salesInDay = salesHistory.filter((s: any) => s.date.startsWith(day));
    
    const incomeFromSales = salesInDay.map((s: any) => ({
      id: s.id,
      date: s.date,
      amount: s.paymentMethod === 'financiamiento' ? 0 : s.total,
      totalSale: s.total, // Keep original total for reference
      method: s.paymentMethod,
      type: 'Venta' as const,
      customer: customersList.find(c => c.id === s.customerId)?.name || 'Venta Mostrador',
      note: s.items.length + ' artículos',
      transferInfo: s.transferInfo,
      cardInfo: s.cardInfo
    })).filter(tx => tx.method !== 'financiamiento' || tx.amount > 0);
    
    // Financing Payments (including downpayments)
    const financingPayments: any[] = [];
    financingsList.forEach(f => {
      f.payments.forEach(p => {
        if (p.date.startsWith(day)) {
          financingPayments.push({
            id: p.id,
            date: p.date,
            amount: p.amount,
            method: p.method || 'efectivo',
            type: 'Abono / Enganche' as const,
            customer: f.customerName,
            note: p.note
          });
        }
      });
    });

    // Cash Outs
    const dayCashOuts = cashOutsList
      .filter(co => co.date.startsWith(day))
      .map(co => ({
        id: co.id,
        date: co.date,
        amount: co.amount,
        method: 'efectivo',
        type: 'Salida de Dinero' as const,
        customer: co.category,
        note: co.description,
        isExpense: true
      }));
    
    const unified = [
      ...incomeFromSales,
      ...financingPayments,
      ...dayCashOuts
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return unified;
  }, [corteDate, salesHistory, financingsList, customersList, cashOutsList]);

  const dailySummary = useMemo(() => {
    const summary = {
      cash: 0,
      card: 0,
      transfer: 0,
      dolares: 0,
      total: 0,
      expenses: 0
    };
    
    dailyTransactions.forEach(tx => {
      if (tx.isExpense) {
        summary.cash -= tx.amount;
        summary.expenses += tx.amount;
        summary.total -= tx.amount;
        return;
      }
      const method = tx.method.toLowerCase();
      if (method === 'efectivo' || method === 'cash') summary.cash += tx.amount;
      else if (method === 'tarjeta' || method === 'card') summary.card += tx.amount;
      else if (method === 'transferencia' || method === 'transfer') summary.transfer += tx.amount;
      else if (method === 'dolares') {
        // En el corte, los dólares se cuentan pero el total es en DOP
        summary.dolares += tx.amount;
      }
      summary.total += tx.amount;
    });
    
    return summary;
  }, [dailyTransactions]);

  const countedCash = useMemo(() => {
    return Object.entries(cashDenominations).reduce((acc: number, [den, count]) => {
      const val = Number(den);
      const qty = Number(count);
      return acc + (val * qty);
    }, 0);
  }, [cashDenominations]);

  const profitStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const getProfit = (sale: any) => {
      const itemsProfit = sale.items.reduce((acc: number, item: any) => {
        const cost = item.costPrice || 0;
        return acc + ((item.price - cost) * item.quantity);
      }, 0);
      return itemsProfit - (sale.discount || 0);
    };

    const isInPeriod = (dateStr: string, days: number) => {
      const date = new Date(dateStr);
      const diff = now.getTime() - date.getTime();
      return diff <= days * 24 * 60 * 60 * 1000;
    };

    const stats = {
      diario: 0,
      semanal: 0,
      quincenal: 0,
      mensual: 0,
      anual: 0
    };

    salesHistory.forEach((sale: any) => {
      const profit = getProfit(sale);
      const saleDate = new Date(sale.date);
      const saleDayStr = sale.date.split('T')[0];

      if (saleDayStr === todayStr) stats.diario += profit;
      if (isInPeriod(sale.date, 7)) stats.semanal += profit;
      if (isInPeriod(sale.date, 15)) stats.quincenal += profit;
      
      // Mensual: Mismo mes y año
      if (saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()) {
        stats.mensual += profit;
      }
      
      // Anual: Mismo año
      if (saleDate.getFullYear() === now.getFullYear()) {
        stats.anual += profit;
      }
    });

    return stats;
  }, [salesHistory]);

  useEffect(() => {
    const defaultsToRemove = ['Granos', 'Aceites', 'Lácteos', 'Bebidas'];
    setDepartments(prev => prev.filter(d => !defaultsToRemove.includes(d)));
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('yg_products', JSON.stringify(productsList));
  }, [productsList]);

  useEffect(() => {
    localStorage.setItem('yg_departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('yg_sales', JSON.stringify(salesHistory));
  }, [salesHistory]);

  useEffect(() => {
    localStorage.setItem('yg_promotions', JSON.stringify(promotionsList));
  }, [promotionsList]);

  useEffect(() => {
    localStorage.setItem('yg_customers', JSON.stringify(customersList));
  }, [customersList]);

  useEffect(() => {
    localStorage.setItem('yg_financings', JSON.stringify(financingsList));
  }, [financingsList]);

  useEffect(() => {
    localStorage.setItem('yg_cash_outs', JSON.stringify(cashOutsList));
  }, [cashOutsList]);

  // Guardado automático periódico
  useEffect(() => {
    if (!backupConfig.autoBackup) return;
    const interval = setInterval(() => {
      handleAutoBackup();
    }, backupConfig.backupInterval * 60 * 1000);
    return () => clearInterval(interval);
  }, [productsList, salesHistory, customersList, financingsList, cashOutsList, departments, promotionsList, cashDenominations, usersList, backupConfig]);

  // Actualización automática de estados de financiamiento
  useEffect(() => {
    const today = new Date();
    let hasChanged = false;
    
    const updated = financingsList.map(f => {
      if (f.remainingAmount <= 0) {
        if (f.status !== 'completado') {
          hasChanged = true;
          return { ...f, status: 'completado' as const };
        }
        return f;
      }
      
      const lastPaymentDate = f.payments.length > 0 
        ? f.payments[f.payments.length - 1].date
        : f.startDate;
      
      const lastDate = new Date(lastPaymentDate);
      const daysToAdd = f.installmentsFrequency === 'semanal' ? 7 
        : f.installmentsFrequency === 'quincenal' ? 15 
        : 30;
        
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + daysToAdd);
      
      const overdueDate = new Date(nextDate);
      overdueDate.setDate(overdueDate.getDate() + 2);
      
      if (today > overdueDate && f.status !== 'atrasado') {
        hasChanged = true;
        return { ...f, status: 'atrasado' as const };
      } else if (today <= overdueDate && f.status === 'atrasado') {
        hasChanged = true;
        return { ...f, status: 'activo' as const };
      }
      return f;
    });

    if (hasChanged) {
      setFinancingsList(updated);
    }
  }, []);

  // Product View States
  const [productMode, setProductMode] = useState<'nuevo' | 'modificar' | 'departamentos'>('nuevo');
  const [isSearchingToModify, setIsSearchingToModify] = useState(false);
  const [isSearchingToDelete, setIsSearchingToDelete] = useState(false);
  const [modifySearchTerm, setModifySearchTerm] = useState('');
  const [newDeptName, setNewDeptName] = useState('');

  // Refs for Barcode Scanner Support
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const ventasSearchRef = useRef<HTMLInputElement>(null);
  const modifySearchRef = useRef<HTMLInputElement>(null);

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Auto-focus logic
  useEffect(() => {
    if (currentView === 'ventas') {
      ventasSearchRef.current?.focus();
    } else if (currentView === 'productos') {
      if (isSearchingToModify) {
        modifySearchRef.current?.focus();
      } else {
        barcodeInputRef.current?.focus();
      }
    }
  }, [currentView, isSearchingToModify]);

  const [editingSale, setEditingSale] = useState<any | null>(null);
  const [saleEditForm, setSaleEditForm] = useState({
    paymentMethod: '',
    notes: ''
  });

  // Corte de Caja States
  const [selectedCashier, setSelectedCashier] = useState('Izar Salas');

  // Sales by Period States
  const [salesStartDate, setSalesStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesEndDate, setSalesEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Salidas de Dinero States
  const [cashOutForm, setCashOutForm] = useState({
    amount: '',
    description: '',
    category: 'Otros'
  });

  const [transferForm, setTransferForm] = useState({
    reference: '',
    bank: ''
  });

  const BANKS = ['Banco Popular', 'Banreservas', 'BHD León', 'Scotiabank', 'Progreso', 'Otros'];

  // Promotion States
  const [promoForm, setPromoForm] = useState({
    title: '',
    description: '',
    image: null as string | null,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    active: true
  });

  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    rnc: '',
    discountPercentage: 0,
    address: ''
  });
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedFinancingId, setSelectedFinancingId] = useState<number | null>(null);
  const [financingStatusFilter, setFinancingStatusFilter] = useState<'todos' | 'activo' | 'atrasado' | 'completado'>('todos');
  const [stockAdjustment, setStockAdjustment] = useState<string>('');
  const [viewingHistoryId, setViewingHistoryId] = useState<number | null>(null);
  const [financingCustomerFilter, setFinancingCustomerFilter] = useState<number | null>(null);
  const [showCommonProductDialog, setShowCommonProductDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [saleNote, setSaleNote] = useState('');
  const [commonProductForm, setCommonProductForm] = useState({
    name: '',
    price: '',
    cost: ''
  });
  const [cardForm, setCardForm] = useState({
    reference: ''
  });

  // Financing Form state in Checkout
  const [financingForm, setFinancingForm] = useState({
    downPayment: 0,
    installments: 4,
    frequency: 'semanal' as const,
    installmentAmount: 0
  });

  const cashiers = ['Izar Salas', 'Juan Pérez', 'María García', 'Pedro López'];

  // Product Form State
  const [productForm, setProductForm] = useState({
    barcode: '',
    description: '',
    sellType: 'unit',
    costPrice: 0,
    sellPrice: 0,
    wholesalePrice: 0,
    department: 'Sin Departamento',
    useInventory: true,
    currentStock: 0,
    minStock: 0,
    image: null as string | null
  });

  const optimizeImage = (file: File, callback: (dataUrl: string) => void) => {
    if (file.size > 2 * 1024 * 1024) {
      showMessage('La imagen es demasiado grande. Máximo 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 800;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => showMessage('Error al procesar la imagen', 'error');
      img.src = event.target?.result as string;
    };
    reader.onerror = () => showMessage('Error al leer el archivo', 'error');
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      optimizeImage(file, (dataUrl) => {
        setProductForm(prev => ({ ...prev, image: dataUrl }));
        showMessage('Imagen optimizada y cargada', 'success');
      });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      optimizeImage(file, (dataUrl) => {
        setTicketConfig(prev => ({ ...prev, logo: dataUrl }));
        showMessage('Logo de factura actualizado correctamente', 'success');
      });
    }
  };

  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const findProduct = (term: string) => {
    const lowerTerm = term.toLowerCase();
    return productsList.find(p => 
      p.id.toString() === term || 
      p.barcode === term ||
      p.name.toLowerCase() === lowerTerm ||
      (p.description && p.description.toLowerCase() === lowerTerm)
    );
  };

  const loadProductData = (product: any) => {
    setProductForm({
      barcode: product.barcode || product.id.toString(),
      description: product.description || product.name,
      sellType: product.sellType || 'unit',
      costPrice: product.costPrice || (product.price * 0.7),
      sellPrice: product.sellPrice || product.price,
      wholesalePrice: product.wholesalePrice || (product.price * 0.9),
      department: product.department || product.category,
      useInventory: product.useInventory !== undefined ? product.useInventory : true,
      currentStock: product.currentStock !== undefined ? product.currentStock : product.stock,
      minStock: product.minStock || 5,
      image: product.image || null
    });
    setEditingProductId(product.id);
    setProductMode('modificar');
    setIsSearchingToModify(false);
    setIsSearchingToDelete(false);
    setModifySearchTerm('');
  };

  const loadProductToModify = () => {
    const product = findProduct(modifySearchTerm);
    if (product) {
      loadProductData(product);
    } else {
      showMessage('Producto no encontrado', 'error');
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          setImportStatus({ type: 'error', message: 'El archivo está vacío' });
          return;
        }

        const newProducts: any[] = [];
        const newDepts = new Set(departments);

        data.forEach((row: any) => {
          const barcode = row.Codigo?.toString() || row.barcode?.toString() || '';
          const description = row.Descripcion?.toString() || row.description?.toString() || row.Nombre?.toString() || '';
          if (!barcode || !description) return;

          const sellType = (row.Tipo || row.sellType)?.toString().toLowerCase() === 'pesado' ? 'weight' : 'unit';
          const costPrice = parseFloat(row.Costo || row.costPrice) || 0;
          const sellPrice = parseFloat(row.Precio || row.sellPrice || row.price) || 0;
          const wholesalePrice = parseFloat(row.Mayoreo || row.wholesalePrice) || sellPrice;
          const department = (row.Departamento || row.department || row.category)?.toString() || 'Sin Departamento';
          const currentStock = parseFloat(row.Existencia || row.currentStock || row.stock) || 0;
          const minStock = parseFloat(row.Minimo || row.minStock) || 5;

          newDepts.add(department);

          newProducts.push({
            id: Date.now() + Math.random(),
            name: description,
            barcode,
            description,
            sellType,
            costPrice,
            sellPrice,
            wholesalePrice,
            department,
            category: department,
            price: sellPrice,
            useInventory: true,
            currentStock,
            stock: currentStock,
            minStock,
            image: null
          });
        });

        if (newProducts.length > 0) {
          setProductsList(prev => [...prev, ...newProducts]);
          setDepartments(Array.from(newDepts));
          setImportStatus({ type: 'success', message: `Se importaron ${newProducts.length} productos exitosamente` });
        } else {
          setImportStatus({ type: 'error', message: 'No se encontraron productos válidos en el archivo' });
        }
      } catch (err) {
        setImportStatus({ type: 'error', message: 'Error al procesar el archivo Excel' });
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const lowerTerm = searchTerm.toLowerCase();
    return productsList.filter(p => 
      (p.name && p.name.toLowerCase().includes(lowerTerm)) ||
      (p.description && p.description.toLowerCase().includes(lowerTerm)) ||
      (p.category && p.category.toLowerCase().includes(lowerTerm)) ||
      (p.department && p.department.toLowerCase().includes(lowerTerm)) ||
      (p.barcode && p.barcode.toString().includes(searchTerm)) ||
      (p.id && p.id.toString().includes(searchTerm))
    );
  }, [searchTerm, productsList]);

  const filteredSalesHistory = useMemo(() => {
    return salesHistory.filter(sale => {
      const saleDate = sale.date.split('T')[0];
      const matchesDate = !salesDateFilter || saleDate === salesDateFilter;
      const customer = customersList.find(c => c.id === sale.customerId);
      const matchesSearch = !salesSearchTerm || 
        sale.id.toString().includes(salesSearchTerm) ||
        sale.cashier.toLowerCase().includes(salesSearchTerm.toLowerCase()) ||
        (customer && customer.name.toLowerCase().includes(salesSearchTerm.toLowerCase()));
      
      return matchesDate && matchesSearch;
    });
  }, [salesHistory, salesSearchTerm, salesDateFilter, customersList]);

  const lowStockProducts = useMemo(() => {
    return productsList.filter(p => 
      p.useInventory && 
      (p.currentStock !== undefined ? p.currentStock : p.stock) <= (p.minStock || 0)
    );
  }, [productsList]);

  const inventoryValue = useMemo(() => {
    return productsList.reduce((acc, p) => acc + ((p.costPrice || (p.price * 0.7)) * (p.currentStock || p.stock || 0)), 0);
  }, [productsList]);

  const quickProducts = useMemo(() => {
    let list = productsList;
    if (selectedDeptFilter !== 'Todos') {
      list = list.filter(p => p.category === selectedDeptFilter);
    }
    return list;
  }, [productsList, selectedDeptFilter]);

  const addToCart = (product: any) => {
    if (product.sellType === 'weight') {
      setProductPendingWeight(product);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { 
        id: product.id, 
        name: product.description || product.name, 
        price: product.sellPrice || product.price, 
        costPrice: product.costPrice || 0,
        quantity: 1 
      }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartItemPrice = (productId: number, newPrice: number) => {
    setCart(prev => prev.map(item => 
      item.id === productId ? { ...item, price: newPrice } : item
    ));
    setEditingPriceId(null);
  };

  const updateCartItemQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(prev => prev.map(item => 
        item.id === productId ? { ...item, quantity: newQuantity } : item
      ));
    }
    setEditingQuantityId(null);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const selectedCustomerData = useMemo(() => {
    return customersList.find(c => c.id === selectedCustomerId);
  }, [selectedCustomerId, customersList]);

  const customerDiscountAmount = useMemo(() => {
    if (!selectedCustomerData || !selectedCustomerData.discountPercentage) return 0;
    return (subtotal * selectedCustomerData.discountPercentage) / 100;
  }, [subtotal, selectedCustomerData]);

  const subtotalAfterDiscount = subtotal - customerDiscountAmount;
  const tipAmount = (subtotalAfterDiscount * tipPercentage) / 100;
  const total = subtotalAfterDiscount + tipAmount;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleHoldCart = () => {
    if (cart.length === 0) {
      showMessage('El carrito está vacío', 'error');
      return;
    }
    setShowHoldDialog(true);
    setHoldAccountName('');
  };

  const confirmHoldCart = () => {
    if (!holdAccountName.trim()) {
      showMessage('Ingrese un nombre para la cuenta', 'error');
      return;
    }

    const newAccount: OpenAccount = {
      id: Date.now(),
      name: holdAccountName.trim(),
      items: [...cart],
      total: total,
      createdAt: new Date().toISOString(),
      customerId: selectedCustomerId
    };

    setOpenAccounts(prev => [...prev, newAccount]);
    setCart([]);
    setSelectedCustomerId(null);
    setShowHoldDialog(false);
    setHoldAccountName('');
    showMessage(`Cuenta "${newAccount.name}" guardada en espera`, 'success');
  };

  const handleCreateQuotation = () => {
    if (cart.length === 0) {
      showMessage('El carrito está vacío', 'error');
      return;
    }
    
    // Valid for 15 days
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + 15);

    const newQuotation: Quotation = {
      id: Date.now(),
      items: [...cart],
      subtotal: subtotalAfterDiscount,
      discount: customerDiscountAmount,
      itbis: useItbis ? (subtotalAfterDiscount - (subtotalAfterDiscount / 1.18)) : 0,
      total: total,
      createdAt: new Date().toISOString(),
      validUntil: validUntilDate.toISOString(),
      customerId: selectedCustomerId,
      customerName: selectedCustomerData?.name || 'Cliente Genérico',
      status: 'pendiente'
    };

    setQuotationsList(prev => [newQuotation, ...prev]);
    showMessage('Cotización generada correctamente', 'success');
  };

  const handleShareQuotationWhatsApp = (quot: Quotation) => {
    const text = `*COTIZACIÓN - ${ticketConfig.storeName}*%0A` +
      `--------------------------------%0A` +
      `*ID:* #${quot.id.toString().slice(-8)}%0A` +
      `*Cliente:* ${quot.customerName}%0A` +
      `*Fecha:* ${new Date(quot.createdAt).toLocaleDateString()}%0A` +
      `*Vence:* ${new Date(quot.validUntil).toLocaleDateString()}%0A` +
      `--------------------------------%0A` +
      `*TOTAL RD$: ${quot.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}*%0A` +
      `--------------------------------%0A` +
      `_Precios sujetos a cambios._%0A` +
      `¡Gracias por preferirnos!`;
    
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const deleteQuotation = (id: number) => {
    setQuotationsList(prev => prev.filter(q => q.id !== id));
    showMessage('Cotización eliminada', 'info');
  };

  const handlePrintQuotation = (quot: Quotation) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showMessage('Por favor, permite las ventanas emergentes para imprimir', 'error');
      return;
    }

    const size = ticketConfig.printSize || '80mm';
    const isOffice = size === 'office';
    const width = isOffice ? '210mm' : size;
    const padding = isOffice ? '20mm' : '5mm';

    const html = `
      <html>
        <head>
          <title>Cotización - ${quot.customerName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Space+Grotesk:wght@400;700&family=Outfit:wght@400;700&family=Anton&family=Satisfy&display=swap');
            body { 
              font-family: ${ticketConfig.fontFamily || (isOffice ? "'Inter', sans-serif" : "'Courier New', Courier, monospace")}; 
              font-weight: ${ticketConfig.isBold ? 'bold' : 'normal'};
              width: ${width}; 
              margin: 0 auto; 
              padding: ${padding};
              color: #000;
              line-height: 1.4;
            }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .logo { max-width: ${isOffice ? '60mm' : '40mm'}; margin-bottom: 10px; }
            .store-name { font-size: ${isOffice ? '28px' : '20px'}; font-weight: 900; text-transform: uppercase; }
            .doc-type { 
              background: #000; 
              color: #fff; 
              display: inline-block; 
              padding: 5px 15px; 
              font-weight: 900; 
              margin-top: 10px; 
              border-radius: 5px;
              font-size: ${isOffice ? '18px' : '14px'};
            }
            .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin: 20px 0; font-size: ${isOffice ? '14px' : '12px'}; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th { text-align: left; border-bottom: 2px solid #000; padding: 10px 5px; text-transform: uppercase; font-size: ${isOffice ? '14px' : '12px'}; }
            .items-table td { padding: 8px 5px; border-bottom: 1px solid #eee; font-size: ${isOffice ? '14px' : '12px'}; }
            .total-section { margin-top: 20px; text-align: right; }
            .total-row { display: flex; justify-content: flex-end; gap: 20px; margin: 5px 0; }
            .total-row.grand { font-size: ${isOffice ? '24px' : '18px'}; font-weight: 900; border-top: 2px solid #000; padding-top: 5px; margin-top: 10px; }
            .disclaimer { margin-top: 40px; font-size: ${isOffice ? '12px' : '10px'}; font-style: italic; text-align: center; border: 1px dashed #ccc; padding: 10px; }
            @media print {
              @page { margin: ${isOffice ? '10mm' : '0'}; }
              body { margin: 0 auto; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${ticketConfig.showLogo && ticketConfig.logo ? `<img src="${ticketConfig.logo}" class="logo" />` : ''}
            <div class="store-name">${ticketConfig.storeName}</div>
            <div>${ticketConfig.address}</div>
            <div>Tel: ${ticketConfig.phone} | RNC: ${ticketConfig.rnc}</div>
            <div class="doc-type">COTIZACIÓN / PRESUPUESTO</div>
          </div>

          <div class="info-grid">
            <div>
              <strong>CLIENTE:</strong><br/>
              ${quot.customerName}<br/>
              Cotización #: ${quot.id.toString().slice(-8)}
            </div>
            <div style="text-align: right;">
              <strong>FECHA:</strong> ${new Date(quot.createdAt).toLocaleDateString()}<br/>
              <strong>VENCE:</strong> ${new Date(quot.validUntil).toLocaleDateString()}<br/>
              <strong>ESTADO:</strong> Pendiente
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th style="text-align: center;">Cant.</th>
                <th style="text-align: right;">Precio</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${quot.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">$${item.price.toFixed(2)}</td>
                  <td style="text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span style="width: 100px; font-weight: bold;">$${(quot.total / (quot.itbis > 0 ? 1.18 : 1)).toFixed(2)}</span>
            </div>
            ${quot.itbis > 0 ? `
              <div class="total-row">
                <span>ITBIS (18%):</span>
                <span style="width: 100px; font-weight: bold;">$${quot.itbis.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="total-row grand">
              <span>TOTAL RD$:</span>
              <span style="width: 150px;">$${quot.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div class="disclaimer">
            Esta cotización es válida por 15 días a partir de la fecha de emisión. 
            Precios sujetos a cambios sin previo aviso según disponibilidad de inventario. 
            Este documento no representa un comprobante fiscal final.
          </div>

          <div style="text-align: center; margin-top: 50px; font-size: 10px; color: #666;">
            Generado por Y.G Facturación - ${new Date().toLocaleString()}
          </div>

          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 600);
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const convertQuotationToCart = (quotation: Quotation) => {
    setCart(quotation.items);
    if (quotation.customerId) setSelectedCustomerId(quotation.customerId);
    setCurrentView('ventas');
    setViewingQuotation(null);
    showMessage('Cotización cargada al carrito', 'success');
  };

  const handleRecallAccount = (account: OpenAccount) => {
    if (cart.length > 0) {
      setConfirmDialog({
        text: 'Ya tienes productos en el carrito. ¿Deseas COMBINARLOS con esta cuenta abierta?',
        onConfirm: () => {
          setCart(prev => [...prev, ...account.items]);
          setOpenAccounts(prev => prev.filter(a => a.id !== account.id));
          if (account.customerId) setSelectedCustomerId(account.customerId);
          showMessage(`Cuenta "${account.name}" cargada`, 'success');
        }
      });
    } else {
      setCart(account.items);
      setOpenAccounts(prev => prev.filter(a => a.id !== account.id));
      if (account.customerId) setSelectedCustomerId(account.customerId);
      showMessage(`Cuenta "${account.name}" cargada`, 'success');
    }
  };

  const handleDeleteAccount = (id: number) => {
    const acc = openAccounts.find(a => a.id === id);
    setConfirmDialog({
      text: `¿Estás seguro de que deseas ELIMINAR la cuenta "${acc?.name}"? Esta acción no se puede deshacer.`,
      onConfirm: () => {
        setOpenAccounts(prev => prev.filter(a => a.id !== id));
        showMessage('Cuenta en espera eliminada', 'info');
      }
    });
  };
  
  const change = Math.max(0, (parseFloat(paidAmount) || 0) - total);

  const handleCancelSale = (sale: Sale) => {
    if (sale.status === 'cancelada') {
      showMessage('Esta factura ya está cancelada', 'error');
      return;
    }

    setConfirmDialog({
      text: `¿Estás seguro de que deseas cancelar la factura #${sale.id.toString().slice(-6)}? El stock será restaurado.`,
      onConfirm: () => {
        // 1. Restaurar stock
        setProductsList(prev => {
          const newList = [...prev];
          sale.items.forEach(saleItem => {
            const productIndex = newList.findIndex(p => p.id === saleItem.id || p.barcode === saleItem.barcode);
            if (productIndex !== -1 && newList[productIndex].useInventory) {
              newList[productIndex].currentStock += saleItem.quantity;
              newList[productIndex].stock = newList[productIndex].currentStock; 
            }
          });
          return newList;
        });

        // 2. Actualizar estado de la venta
        const updatedSale = { ...sale, status: 'cancelada' as const };
        setSalesHistory(prev => prev.map(s => s.id === sale.id ? updatedSale : s));
        
        // 3. Sincronizar con la nube si aplica
        cloudSync.saveSale(updatedSale);
        
        showMessage('Factura cancelada y stock restaurado', 'success');
      }
    });
  };

  const handleReturnItem = (sale: Sale, itemIndex: number, returnQty: number) => {
    const item = sale.items[itemIndex];
    if (returnQty > item.quantity) {
      showMessage('La cantidad a devolver excede lo vendido', 'error');
      return;
    }

    setConfirmDialog({
      text: `¿Deseas procesar la devolución de ${returnQty} unidades de "${item.name}"?`,
      onConfirm: () => {
        // 1. Restaurar stock del item devuelto
        setProductsList(prev => {
          const newList = [...prev];
          const productIndex = newList.findIndex(p => p.id === item.id || p.barcode === item.barcode);
          if (productIndex !== -1 && newList[productIndex].useInventory) {
            newList[productIndex].currentStock += returnQty;
            newList[productIndex].stock = newList[productIndex].currentStock;
          }
          return newList;
        });

        // 2. Actualizar venta (opcionalmente marcar como devuelta)
        const updatedSale = { ...sale, status: 'devuelta' as const };
        setSalesHistory(prev => prev.map(s => s.id === sale.id ? updatedSale : s));
        cloudSync.saveSale(updatedSale);

        showMessage('Devolución procesada y stock actualizado', 'success');
      }
    });
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsCheckoutOpen(true);
    setPaidAmount(total.toString());
  };

  const confirmSale = (action: 'print' | 'whatsapp' | 'none') => {
    if (paymentMethod === 'financiamiento') {
      if (!selectedCustomerId) {
        showMessage('Debe seleccionar un cliente para el financiamiento', 'error');
        return;
      }
      if (financingForm.downPayment >= total) {
        showMessage('El enganche no puede ser igual o mayor al total. Para pago total use Efectivo/Tarjeta.', 'error');
        return;
      }
      if (financingForm.installments < 1) {
        showMessage('Debe especificar al menos 1 cuota para el financiamiento', 'error');
        return;
      }
      const totalCalculated = financingForm.downPayment + (financingForm.installments * (financingForm.installmentAmount || 0));
      if (totalCalculated > total + 0.01) { // Allowing tiny floating point diff
        showMessage(`El enganche + cuotas (${totalCalculated.toFixed(2)}) no pueden exceder el total de la venta (${total.toFixed(2)})`, 'error');
        return;
      }
    }

    if (paymentMethod === 'tarjeta') {
      if (!cardForm.reference) {
        showMessage('Referencia de pago obligatoria', 'error');
        return;
      }
    }

    if (paymentMethod === 'dolares') {
      const received = parseFloat(usdPaidAmount);
      if (isNaN(received) || received < (total / usdRate)) {
        showMessage('Monto en dólares insuficiente o inválido', 'error');
        return;
      }
    }

    const newSale = {
      id: Date.now(),
      date: new Date().toISOString(),
      items: [...cart],
      subtotal: subtotalAfterDiscount,
      discount: customerDiscountAmount,
      tipAmount: tipAmount,
      total: total,
      paymentMethod: paymentMethod,
      cashier: selectedCashier,
      customerId: selectedCustomerId,
      note: saleNote,
      status: 'completada' as const,
      transferInfo: paymentMethod === 'transferencia' ? { ...transferForm } : null,
      cardInfo: paymentMethod === 'tarjeta' ? { ...cardForm } : null,
      usdInfo: paymentMethod === 'dolares' ? {
        rate: usdRate,
        received: parseFloat(usdPaidAmount),
        changeDop: parseFloat(usdPaidAmount) * usdRate - total
      } : null
    };
    
    setSalesHistory(prev => [newSale, ...prev]);
    cloudSync.saveSale(newSale);

    // Handle Post-Sale Actions
    if (action === 'print') {
      handlePrintReceipt(newSale);
    } else if (action === 'whatsapp') {
      handleSendWhatsApp(newSale);
    }

    // Handle Financing
    if (paymentMethod === 'financiamiento') {
      if (!selectedCustomerId) {
        showMessage('Debe seleccionar un cliente para el financiamiento', 'error');
        return;
      }
      const newFinancing: Financing = {
        id: Date.now(),
        customerId: selectedCustomerId,
        customerName: customersList.find(c => c.id === selectedCustomerId)?.name || 'Cliente',
        totalAmount: total,
        remainingAmount: total - financingForm.downPayment,
        downPayment: financingForm.downPayment,
        installmentsCount: financingForm.installments,
        installmentsFrequency: financingForm.frequency,
        startDate: new Date().toISOString(),
        status: 'activo',
        payments: financingForm.downPayment > 0 ? [{
          id: Date.now() + 1,
          amount: financingForm.downPayment,
          date: new Date().toISOString(),
          note: 'Enganche Inicial'
        }] : [],
        items: [...cart]
      };
      setFinancingsList(prev => [newFinancing, ...prev]);
    }

    setTipPercentage(0); // Reset tip after sale
    setSelectedCustomerId(null); // Reset selected customer
    setSaleNote(''); // Reset note
    setCardForm({ reference: '' }); // Reset card form
    setTransferForm({ reference: '', bank: '' }); // Reset transfer form
    setUsdPaidAmount(''); // Reset USD amount
    setFinancingForm({ downPayment: 0, installments: 4, frequency: 'semanal' }); // Reset financing form
    
    // Update inventory if enabled
    setProductsList(prev => prev.map(p => {
      const cartItem = cart.find(item => item.id === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      }
      return p;
    }));

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setIsCheckoutOpen(false);
      setCart([]);
      setPaidAmount('');
    }, 2000);
  };

  const inventoryStats = useMemo(() => {
    if (!Array.isArray(productsList)) return { totalProducts: 0, lowStockCount: 0, totalValue: 0 };
    
    const totalProducts = productsList.length;
    const lowStockCount = productsList.filter(p => 
      p && (p.useInventory !== false) && 
      (p.stock !== undefined ? p.stock : p.currentStock || 0) <= (p.minStock || 0)
    ).length;
    const totalValue = productsList.reduce((sum, p) => {
      if (!p) return sum;
      const stock = p.stock !== undefined ? p.stock : (p.currentStock || 0);
      const cost = p.costPrice || (p.price * 0.7) || 0;
      return sum + (cost * stock);
    }, 0);
    return { totalProducts, lowStockCount, totalValue };
  }, [productsList]);

  const pendingReminders = useMemo(() => {
    const today = new Date();
    return financingsList.filter(f => {
      if (f.status === 'completado' || f.remainingAmount <= 0) return false;
      
      const lastPaymentDate = f.payments.length > 0 
        ? f.payments[f.payments.length - 1].date
        : f.startDate;
      
      const lastDate = new Date(lastPaymentDate);
      const daysToAdd = f.installmentsFrequency === 'semanal' ? 7 
        : f.installmentsFrequency === 'quincenal' ? 15 
        : 30;
        
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + daysToAdd);
      
      return nextDate <= today;
    });
  }, [financingsList]);

  const handleSaveCashOut = () => {
    const amount = parseFloat(cashOutForm.amount);
    if (!amount || amount <= 0 || !cashOutForm.description) {
      showMessage('Ingrese un monto válido y una descripción', 'error');
      return;
    }

    const newCashOut: CashOut = {
      id: Date.now(),
      amount,
      description: cashOutForm.description,
      category: cashOutForm.category,
      date: new Date().toISOString(),
      cashier: selectedCashier
    };

    setCashOutsList(prev => [newCashOut, ...prev]);
    setCashOutForm({ amount: '', description: '', category: 'Otros' });
    showMessage('Salida de dinero registrada con éxito', 'success');
    
    // Ofrecer impresión inmediata
    setConfirmDialog({
      text: '¿Deseas imprimir el recibo de esta salida de dinero?',
      onConfirm: () => handlePrintCashOut(newCashOut)
    });
  };

  const handlePrintCashOut = (co: CashOut) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const size = ticketConfig.printSize || '80mm';
    const isOffice = size === 'office';
    const width = isOffice ? '210mm' : size;
    const padding = isOffice ? '20mm' : '5mm';

    const html = `
      <html>
        <head>
          <title>Recibo de Salida - ${ticketConfig.storeName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Space+Grotesk:wght@400;700&family=Outfit:wght@400;700&family=Anton&family=Satisfy&display=swap');
            body { 
              font-family: ${ticketConfig.fontFamily || (isOffice ? "'Inter', sans-serif" : "'Courier New', Courier, monospace")}; 
              font-weight: ${ticketConfig.isBold ? 'bold' : 'normal'};
              width: ${width}; 
              min-height: ${isOffice ? '297mm' : 'auto'};
              padding: ${padding}; 
              margin: 0 auto; 
              color: #000;
            }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .logo { max-width: ${isOffice ? '60mm' : '40mm'}; margin-bottom: 5px; }
            .title { font-size: ${isOffice ? '28px' : '18px'}; font-weight: bold; margin: 5px 0; }
            .subtitle { font-size: ${isOffice ? '16px' : '12px'}; font-weight: bold; text-transform: uppercase; }
            .content { margin-bottom: 20px; font-size: ${isOffice ? '16px' : '14px'}; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .footer { border-top: 2px dashed #000; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; }
            .signature { border-top: 1px solid #000; width: ${isOffice ? '80mm' : '40mm'}; display: inline-block; padding-top: 5px; margin-top: 30px; }
            @media print {
              @page { margin: ${isOffice ? '10mm' : '0'}; }
              body { margin: 0 auto; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${ticketConfig.showLogo && ticketConfig.logo ? `<img src="${ticketConfig.logo}" class="logo" />` : ''}
            <div class="subtitle">${ticketConfig.storeName}</div>
            <div class="title">COMPROBANTE DE SALIDA</div>
            <div>${new Date(co.date).toLocaleString()}</div>
          </div>
          <div class="content">
            <div class="row">
              <span>Nº Transacción:</span>
              <span>#${co.id.toString().slice(-6)}</span>
            </div>
            <div class="row">
              <span>Cajero:</span>
              <span>${co.cashier}</span>
            </div>
            <div class="row">
              <span>Categoría:</span>
              <span>${co.category}</span>
            </div>
            <div style="margin-top: 15px; font-weight: bold;">Descripción:</div>
            <div style="margin-bottom: 15px; border: 1px solid #eee; padding: 5px; min-height: 40px;">
              ${co.description}
            </div>
            <div class="row" style="font-size: ${isOffice ? '24px' : '20px'}; font-weight: bold; border-top: 1px solid #000; padding-top: 5px;">
              <span>TOTAL:</span>
              <span>$${co.amount.toFixed(2)}</span>
            </div>
          </div>
          <div style="text-align: center; margin-top: 40px;">
            <div class="signature">Firma Autorizada</div>
            <div class="signature" style="margin-top: 30px;">Recibido Conforme</div>
          </div>
          <div class="footer">
            SISTEMA DE GESTIÓN Y.G FACTURACIÓN<br>
            ¡Control y Transparencia!
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePrintPreReceipt = (account: OpenAccount) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const size = ticketConfig.printSize || '80mm';
    const isOffice = size === 'office';
    const width = isOffice ? '210mm' : size;
    const padding = isOffice ? '20mm' : '5mm';
    const fontSize = size === '58mm' ? '10px' : (isOffice ? '14px' : '12px');

    const subtotal = account.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // Note: Pre-receipts usually show the raw values or current cart state. 
    // We'll calculate the totals based on the account object.

    const html = `
      <html>
        <head>
          <title>Pre-Cuenta - ${account.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Space+Grotesk:wght@400;700&family=Outfit:wght@400;700&family=Anton&family=Satisfy&display=swap');
            body { 
              font-family: ${ticketConfig.fontFamily || (isOffice ? "'Inter', sans-serif" : "'Courier New', Courier, monospace")}; 
              font-weight: ${ticketConfig.isBold ? 'bold' : 'normal'};
              width: ${width}; 
              margin: 0 auto; 
              padding: ${padding};
              color: #000;
            }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
            .logo { max-width: ${isOffice ? '60mm' : '40mm'}; margin-bottom: 10px; }
            .store-name { font-size: ${isOffice ? '24px' : '18px'}; font-weight: bold; text-transform: uppercase; }
            .pre-bill-badge { 
              background: #000; 
              color: #fff; 
              display: inline-block; 
              padding: 5px 15px; 
              font-weight: 900; 
              margin-top: 10px; 
              font-size: ${isOffice ? '16px' : '12px'};
            }
            .info { font-size: ${fontSize}; margin: 15px 0; }
            .items { font-size: ${fontSize}; width: 100%; border-collapse: collapse; margin: 15px 0; }
            .items th { text-align: left; border-bottom: 1px solid #000; padding: 5px 0; }
            .items td { padding: 5px 0; border-bottom: 1px solid #eee; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
            .total-row { font-weight: bold; font-size: ${isOffice ? '20px' : '15px'}; border-top: 2px solid #000; margin-top: 10px; padding-top: 5px; }
            .disclaimer { text-align: center; font-size: 10px; margin-top: 20px; font-style: italic; border: 1px dashed #000; padding: 10px; }
            @media print {
              @page { margin: 0; }
              body { margin: 0 auto; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${ticketConfig.showLogo && ticketConfig.logo ? `<img src="${ticketConfig.logo}" class="logo" />` : ''}
            <div class="store-name">${ticketConfig.storeName}</div>
            <div class="pre-bill-badge">COPIA PARA EL CLIENTE - PRE-CUENTA</div>
          </div>

          <div class="info">
            <div class="row"><span>MESA/PEDIDO:</span> <span>${account.name}</span></div>
            <div class="row"><span>FECHA:</span> <span>${new Date().toLocaleString()}</span></div>
            <div class="row"><span>ID TEMP:</span> <span>#${account.id.toString().slice(-6)}</span></div>
          </div>

          <table class="items">
            <thead>
              <tr>
                <th>DESCRIPCIÓN</th>
                <th style="text-align: center;">CANT</th>
                <th style="text-align: right;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${account.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="row">
              <span>SUBTOTAL:</span>
              <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="row total-row">
              <span>TOTAL A PAGAR:</span>
              <span>$${account.total.toFixed(2)}</span>
            </div>
          </div>

          <div class="disclaimer">
            ESTE DOCUMENTO NO ES UNA FACTURA VÁLIDA PARA CRÉDITO FISCAL.<br/>
            FAVOR DIRÍJASE A LA CAJA PARA EL PAGO FINAL Y RECIBIR SU FACTURA.
          </div>

          <div style="text-align: center; margin-top: 30px; font-size: 10px; color: #666;">
            ¡Gracias por visitarnos!
          </div>

          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePrintReceipt = (sale: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const size = ticketConfig.printSize || '80mm';
    const isOffice = size === 'office';
    const width = isOffice ? '210mm' : size;
    const padding = isOffice ? '20mm' : '5mm';
    const fontSize = size === '58mm' ? '10px' : (isOffice ? '14px' : '12px');

    const html = `
      <html>
        <head>
          <title>Factura - ${ticketConfig.storeName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Space+Grotesk:wght@400;700&family=Outfit:wght@400;700&family=Anton&family=Satisfy&display=swap');
            body { 
              font-family: ${ticketConfig.fontFamily || (isOffice ? "'Inter', sans-serif" : "'Courier New', Courier, monospace")}; 
              font-weight: ${ticketConfig.isBold ? 'bold' : 'normal'};
              width: ${width}; 
              min-height: ${isOffice ? '297mm' : 'auto'};
              padding: ${padding}; 
              margin: 0 auto; 
              color: #000; 
              background: white;
            }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
            .logo { max-width: ${isOffice ? '60mm' : '40mm'}; margin-bottom: 10px; }
            .store-name { font-size: ${isOffice ? '28px' : '18px'}; font-weight: bold; text-transform: uppercase; letter-spacing: -1px; }
            .store-info { font-size: ${isOffice ? '12px' : '11px'}; line-height: 1.4; color: #333; }
            .ticket-info { font-size: ${fontSize}; margin: 15px 0; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
            .items { font-size: ${fontSize}; width: 100%; border-collapse: collapse; margin: 15px 0; }
            .items th { 
              text-align: left; 
              border-bottom: 2px solid #000; 
              padding: 8px 0; 
              text-transform: uppercase;
              font-weight: 900;
            }
            .items td { padding: 8px 0; border-bottom: 1px solid #eee; vertical-align: top; }
            .totals { 
              margin-top: 15px; 
              font-size: ${isOffice ? '16px' : '13px'}; 
              font-weight: bold; 
              border-top: 2px solid #000; 
              padding-top: 10px; 
            }
            .row { display: flex; justify-content: space-between; margin: 4px 0; }
            .footer { 
              border-top: 1px dashed #000; 
              padding-top: 15px; 
              margin-top: 30px; 
              text-align: center; 
              font-size: ${isOffice ? '12px' : '10px'}; 
              color: #666;
            }
            .office-header { display: ${isOffice ? 'flex' : 'none'}; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
            @media print {
              @page { margin: ${isOffice ? '10mm' : '0'}; }
              body { margin: 0 auto; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${isOffice ? `
          <div class="office-header">
            <div style="text-align: left">
              ${ticketConfig.showLogo && ticketConfig.logo ? `<img src="${ticketConfig.logo}" class="logo" />` : ''}
            </div>
            <div style="text-align: right">
              <h1 style="margin: 0; font-size: 32px; color: #eee; text-transform: uppercase;">FACTURA</h1>
              <div style="font-weight: bold;">#${sale.id.toString().slice(-8)}</div>
              <div>${new Date(sale.date).toLocaleDateString()}</div>
            </div>
          </div>
          ` : ''}

          <div class="header" style="${isOffice ? 'text-align: left; border-bottom: none; padding-bottom: 0;' : ''}">
            ${!isOffice && ticketConfig.showLogo && ticketConfig.logo ? `<img src="${ticketConfig.logo}" class="logo" />` : ''}
            <div class="store-name">${ticketConfig.storeName}</div>
            <div class="store-info">
              ${ticketConfig.address}<br>
              Tel: ${ticketConfig.phone}<br>
              ${ticketConfig.rnc ? `RNC: ${ticketConfig.rnc}<br>` : ''}
              ${ticketConfig.website ? ticketConfig.website : ''}
            </div>
          </div>

          <div class="ticket-info">
            <div class="row"><span>FECHA:</span> <span>${new Date(sale.date).toLocaleString()}</span></div>
            <div class="row"><span>TICKET:</span> <span>#${sale.id.toString().slice(-8)}</span></div>
            <div class="row"><span>CAJERO:</span> <span>${sale.cashier}</span></div>
            ${sale.customerId ? `<div class="row"><span>CLIENTE:</span> <span>${customersList.find(c => c.id === sale.customerId)?.name || 'Cliente'}</span></div>` : ''}
            <div class="row"><span>METODO PAGO:</span> <span style="text-transform: uppercase;">${sale.paymentMethod}</span></div>
            ${sale.status !== 'completada' ? `<div class="row" style="color: red; font-weight: bold; border: 2px solid red; padding: 4px; text-align: center; margin: 10px 0; text-transform: uppercase; display: block; font-size: 1.2em;">ESTADO: ${sale.status}</div>` : ''}
          </div>

          <table class="items">
            <thead>
              <tr>
                <th style="width: 60%">DESCRIPCIÓN</th>
                <th style="width: 15%; text-align: center;">CANT</th>
                <th style="width: 25%; text-align: right;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${sale.items.map((item: any) => `
                <tr>
                  <td>
                    <div style="font-weight: bold;">${item.name}</div>
                    ${isOffice ? `<div style="font-size: 11px; color: #666;">Precio Unit: $${item.price.toFixed(2)}</div>` : ''}
                  </td>
                  <td style="text-align: center;">${item.quantity.toString().includes('.') ? item.quantity.toFixed(3) : item.quantity}</td>
                  <td style="text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="row"><span>SUBTOTAL:</span> <span>$${sale.subtotal.toFixed(2)}</span></div>
            ${sale.discount > 0 ? `<div class="row" style="color: #d32f2f;"><span>DESCUENTO:</span> <span>-$${sale.discount.toFixed(2)}</span></div>` : ''}
            ${sale.tipAmount > 0 ? `<div class="row" style="color: #2e7d32;"><span>PROPINA:</span> <span>$${sale.tipAmount.toFixed(2)}</span></div>` : ''}
            <div class="row" style="font-size: ${isOffice ? '24px' : '18px'}; margin-top: 10px; border-top: 1px solid #000; padding-top: 10px;">
              <span>TOTAL DOP:</span> <span>$${sale.total.toFixed(2)}</span>
            </div>
            
            ${sale.paymentMethod === 'dolares' ? `
              <div class="row" style="color: #666; font-size: ${isOffice ? '13px' : '11px'}; margin-top: 10px;"><span>EQUIVALENTE USD (Tasa: ${sale.usdInfo.rate.toFixed(2)}):</span> <span>$${(sale.total / sale.usdInfo.rate).toFixed(2)}</span></div>
              <div class="row" style="color: #666; font-size: ${isOffice ? '13px' : '11px'};"><span>RECIBIDO USD:</span> <span>$${sale.usdInfo.received.toFixed(2)}</span></div>
              <div class="row" style="color: #666; font-size: ${isOffice ? '13px' : '11px'};"><span>CAMBIO DOP:</span> <span>$${sale.usdInfo.changeDop.toFixed(2)}</span></div>
            ` : ''}
          </div>

          <div class="footer">
            <p style="font-weight: bold; margin-bottom: 5px;">${ticketConfig.message}</p>
            <p>¡GRACIAS POR PREFERIRNOS! - YG FACTURACIÓN v2.0</p>
          </div>

          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleSendWhatsApp = (sale: any) => {
    const customer = customersList.find(c => c.id === sale.customerId);
    const phoneNumber = customer?.phone ? customer.phone.replace(/\D/g, '') : '';
    
    // Si no es un número dominicano válido (ej: solo 10 dígitos), agregar el código de área por defecto
    let finalPhone = phoneNumber;
    if (finalPhone.length === 10) {
      finalPhone = '1' + finalPhone; // Prefijo para RD si solo tiene 10 dígitos
    }

    const header = `*${ticketConfig.storeName.toUpperCase()}*\n`;
    const info = `📄 *RECIBO:* #${sale.id.toString().slice(-8)}\n📅 *FECHA:* ${new Date(sale.date).toLocaleString()}\n💳 *PAGO:* ${sale.paymentMethod.toUpperCase()}\n--------------------------------\n`;
    
    let items = '';
    sale.items.forEach((item: any) => {
      items += `🔹 ${item.name}\n   ${item.quantity} x $${item.price.toFixed(2)} = *$${(item.price * item.quantity).toFixed(2)}*\n`;
    });
    
    const footer = `--------------------------------\n💰 *SUBTOTAL:* $${sale.subtotal.toFixed(2)}\n${sale.discount > 0 ? `📉 *DESCUENTO:* -$${sale.discount.toFixed(2)}\n` : ''}${sale.tipAmount > 0 ? `✨ *PROPINA:* $${sale.tipAmount.toFixed(2)}\n` : ''}*🔥 TOTAL:* *$${sale.total.toFixed(2)}*\n\n${ticketConfig.message || '¡Gracias por su compra!'}\n_YG Market - Punto de Venta Inteligente_`;

    const fullMessage = encodeURIComponent(header + info + items + footer);
    const whatsappUrl = `https://wa.me/${finalPhone}?text=${fullMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleOpenDrawer = () => {
    if (!ticketConfig.openDrawerOnPrint) {
      showMessage('La apertura de gaveta está desactivada en configuración', 'info');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Un documento casi vacío que dispara el comando de impresión.
    // La mayoría de los drivers están configurados para abrir la gaveta al inicio o fin del trabajo.
    const html = `
      <html>
        <body style="margin:0; padding:0; display:flex; align-items:center; justify-content:center; height:10mm; width:30mm;">
          <div style="font-size: 8px; font-family: monospace;">OPEN_DRAWER</div>
          <script>
            window.print();
            setTimeout(() => window.close(), 500);
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    showMessage('Abriendo gaveta...', 'success');
  };

  // Keyboard Shortcuts Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // General Navigation
      if (e.key === 'Escape') {
        if (isCheckoutOpen) setIsCheckoutOpen(false);
        if (showNoteDialog) setShowNoteDialog(false);
        if (showCommonProductDialog) setShowCommonProductDialog(false);
      }

      // Checkout Shortcuts
      if (isCheckoutOpen) {
        if (e.key === 'F1') { e.preventDefault(); confirmSale('print'); }
        if (e.key === 'F2') { e.preventDefault(); confirmSale('none'); }
        if (e.key === 'F3') { e.preventDefault(); confirmSale('whatsapp'); }
      }

      // POS General Shortcuts
      if (currentView === 'ventas' && !isCheckoutOpen) {
        if (e.key === 'F4') { e.preventDefault(); setShowNoteDialog(true); }
        if (e.key === 'F10') { e.preventDefault(); handleCheckout(); }
        if (e.key === 'F9') { e.preventDefault(); setShowCommonProductDialog(true); }
        if (e.key === 'F12') { e.preventDefault(); handleOpenDrawer(); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCheckoutOpen, showNoteDialog, showCommonProductDialog, currentView, cart.length, total]);

  const saveProduct = () => {
    // Validation: Check for duplicate barcode in 'nuevo' mode
    if (productMode === 'nuevo') {
      const exists = productsList.some(p => p.id.toString() === productForm.barcode);
      if (exists) {
        setProductError('(código asignado a otro producto)');
        setTimeout(() => setProductError(null), 3000);
        return;
      }
    }

    // Simulate saving
    if (productMode === 'nuevo') {
      const newProduct = {
        ...productForm,
        id: parseInt(productForm.barcode) || Math.floor(Math.random() * 10000),
        name: productForm.description,
        price: productForm.sellPrice,
        category: productForm.department,
        stock: productForm.currentStock
      };
      setProductsList(prev => [...prev, newProduct]);
      cloudSync.saveProduct(newProduct);
    } else {
      const updatedProduct = { 
        ...productsList.find(p => p.id === editingProductId), 
        ...productForm,
        name: productForm.description, 
        price: productForm.sellPrice, 
        category: productForm.department, 
        stock: productForm.currentStock 
      };
      setProductsList(prev => prev.map(p => 
        p.id === editingProductId ? updatedProduct : p
      ));
      cloudSync.saveProduct(updatedProduct);
      setEditingProductId(null);
    }

    setProductSuccess(true);
    setTimeout(() => {
      setProductSuccess(false);
      // Reset form after saving if in 'nuevo' mode
      if (productMode === 'nuevo') {
        setProductForm({
          barcode: '',
          description: '',
          sellType: 'unit',
          costPrice: 0,
          sellPrice: 0,
          wholesalePrice: 0,
          department: 'Sin Departamento',
          useInventory: true,
          currentStock: 0,
          minStock: 0,
          image: null
        });
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-yellow-50 font-sans text-gray-900 selection:bg-yellow-200">
      
      {/* Overlay de Suscripción Vencida (Cloud) */}
      <AnimatePresence>
        {isSubscriptionExpired && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-900/95 backdrop-blur-md z-[1000] flex items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-12 max-w-2xl shadow-2xl border-8 border-red-500"
            >
               <div className="bg-red-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                 <AlertTriangle size={64} className="text-red-600" />
               </div>
               <h2 className="text-4xl font-black text-gray-800 uppercase italic tracking-tighter mb-4">Servicio Suspendido</h2>
               <p className="text-xl font-bold text-gray-500 mb-8 leading-tight">
                 Su suscripción mensual de <span className="text-red-600 font-black">Y.G Facturación Cloud</span> ha vencido.
                 Para continuar disfrutando de la sincronización y respaldos, favor realizar su pago.
               </p>
               
               <div className="bg-gray-50 rounded-3xl p-6 mb-10 border-2 border-gray-100 italic">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tu cuenta venció el:</p>
                  <p className="text-2xl font-black text-red-700">{new Date(businessInfo.subscriptionEndDate).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-bold mt-2 inline-block">ID DE CUENTA: {fbUser?.uid ? fbUser.uid.slice(0, 8) : 'S/N'}</div>
               </div>

               <div className="flex flex-col sm:flex-row gap-4">
                 <button 
                   onClick={() => window.open('https://wa.me/18298925070?text=Hola, mi cuenta de Y.G Facturación ha vencido. ID: ' + (fbUser?.uid || 'S/N'), '_blank')}
                   className="flex-1 bg-green-500 text-white py-5 rounded-2xl font-black text-xl shadow-[0_8px_0_0_rgba(21,128,61,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                 >
                   RENOVAR POR WHATSAPP
                 </button>
                 <button 
                   onClick={handleLogoutCloud}
                   className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                 >
                   Cerrar Sesión Cloud
                 </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay de Login */}
      <AnimatePresence>
        {showLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-red-900 flex items-center justify-center p-4 overflow-hidden"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-lg bg-white rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl p-6 sm:p-10 relative overflow-hidden border-[6px] sm:border-8 border-yellow-400"
            >
              {currentUser && (
                <button 
                  onClick={() => setShowLogin(false)}
                  className="absolute top-6 right-6 p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl transition-colors"
                >
                  <X size={24} />
                </button>
              )}
              <div className="flex flex-col items-center text-center mb-10">
                <div className="bg-yellow-400 p-6 rounded-[2.5rem] shadow-xl rotate-3 mb-6 border-4 border-red-700">
                  <ShoppingCart className="text-red-700" size={64} />
                </div>
                <h1 className="text-3xl sm:text-5xl font-black text-red-700 tracking-tighter italic">Y.G <span className="text-yellow-400 drop-shadow-md uppercase">Facturación</span></h1>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mt-2">Sistema de Punto de Venta</p>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {!selectedUserForLogin ? (
                  <>
                    {/* Email Login Section */}
                    <div className="mb-6 p-6 bg-blue-50/50 rounded-[2rem] border-4 border-blue-100/50 flex flex-col items-center group hover:bg-blue-50 hover:border-blue-200 transition-all">
                       <div className="bg-white p-3 rounded-2xl shadow-sm border-2 border-blue-100 mb-3 group-hover:scale-110 transition-transform">
                          <User size={32} className="text-blue-500" />
                       </div>
                       <h3 className="text-lg font-black text-blue-700 uppercase italic tracking-tighter mb-4 text-center">Inicie Sesión en el Sistema</h3>
                       
                       {!fbUser ? (
                           <form onSubmit={handleEmailAuth} className="w-full space-y-3 p-2 bg-white rounded-2xl border-2 border-blue-100 shadow-sm">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                 <input 
                                   type="email" 
                                   value={authEmail}
                                   onChange={(e) => setAuthEmail(e.target.value)}
                                   placeholder="tu@negocio.com"
                                   className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:border-blue-400 outline-none transition-all"
                                   required
                                 />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
                                 <input 
                                   type="password" 
                                   value={authPassword}
                                   onChange={(e) => setAuthPassword(e.target.value)}
                                   placeholder="••••••••"
                                   className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:border-blue-400 outline-none transition-all"
                                   required
                                 />
                              </div>
                              <div className="pt-2 flex flex-col gap-2">
                                 <button 
                                   type="submit"
                                   disabled={isAuthLoading}
                                   className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 active:translate-y-1 transition-all disabled:opacity-50"
                                 >
                                   {isAuthLoading ? 'CONECTANDO...' : 'ENTRAR AL SISTEMA'}
                                 </button>
                              </div>
                           </form>
                       ) : (
                         <div className="flex flex-col gap-4 w-full">
                           <div className="flex items-center justify-between gap-4 bg-white px-5 py-4 rounded-3xl border-4 border-blue-100 w-full animate-in fade-in slide-in-from-top-2 shadow-xl">
                              <div className="flex items-center gap-3 min-w-0">
                                 <div className="bg-green-500 p-2 rounded-2xl text-white flex-shrink-0 shadow-lg shadow-green-200">
                                    <Check size={16} />
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest leading-none mb-1">PROPIETARIO CONECTADO</p>
                                    <p className="font-black text-blue-900 truncate text-sm italic">{fbUser.email}</p>
                                 </div>
                              </div>
                              <button 
                                 onClick={handleLogoutCloud}
                                 className="p-2 bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-colors"
                              >
                                 <X size={20} />
                              </button>
                           </div>

                           <button 
                             onClick={() => {
                               const admin = usersList.find(u => u.role === 'admin' && u.active) || usersList.find(u => u.active);
                               if (admin) {
                                 setCurrentUser(admin);
                                 setShowLogin(false);
                                 showMessage(`Acceso Maestro: Bienvenido de nuevo`, 'success');
                               }
                             }}
                             className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-[2rem] font-black text-lg uppercase tracking-tighter shadow-2xl shadow-blue-300 active:translate-y-1 transition-all flex items-center justify-center gap-4 border-4 border-white"
                           >
                             <Zap size={24} className="text-yellow-400 fill-yellow-400" /> ¡ENTRAR AL SISTEMA AHORA!
                           </button>
                         </div>
                       )}
                    </div>

                    <div className="relative flex items-center justify-center py-4">
                        <div className="absolute inset-x-0 h-0.5 bg-gray-100" />
                        <span className="relative bg-white px-4 text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Cajeros del Negocio</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {usersList.filter(u => u.active).map(user => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedUserForLogin(user);
                            setLoginPin('');
                          }}
                          className="flex flex-col items-center gap-3 p-6 bg-gray-50 border-4 border-gray-100 rounded-3xl hover:bg-yellow-50 hover:border-yellow-400 transition-all group"
                        >
                          <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-gray-100 group-hover:scale-110 transition-transform">
                            <User className="text-red-600" size={32} />
                          </div>
                          <span className="font-black text-gray-700 uppercase italic tracking-tighter">{user.name}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user.role}</span>
                        </button>
                      ))}
                    </div>
                    
                    <div className="mt-8 pt-8 border-t-2 border-gray-100 flex flex-col gap-4">
                      <p className="text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">¿Deseas probar el sistema?</p>
                      <button 
                        onClick={loadDemoData}
                        className="bg-red-700 hover:bg-red-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_5px_0_0_rgba(153,27,27,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
                      >
                        <Zap size={20} className="text-yellow-400" /> ACCESO DEMO (DATOS DE PRUEBA)
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <button 
                      onClick={() => setSelectedUserForLogin(null)}
                      className="mb-4 text-gray-400 hover:text-red-600 flex items-center gap-1 font-black text-xs uppercase"
                    >
                      <ArrowRight className="rotate-180" size={14} /> Volver a usuarios
                    </button>
                    <div className="bg-red-50 p-6 rounded-[2.5rem] border-4 border-red-100 flex flex-col items-center w-full">
                      <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-red-100 mb-4">
                        <Lock className="text-red-600" size={32} />
                      </div>
                      <h3 className="text-xl font-black text-red-700 uppercase italic tracking-tighter mb-1">{selectedUserForLogin.name}</h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Ingrese su código de acceso</p>
                      
                      <div className="flex gap-3 mb-8">
                        {[1, 2, 3, 4].map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-4 h-4 rounded-full border-2 transition-all ${
                              loginPin.length > i ? 'bg-red-600 border-red-600 scale-110' : 'bg-transparent border-gray-300'
                            }`}
                          />
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((btn) => (
                          <button
                            key={btn.toString()}
                            onClick={() => {
                              if (btn === 'C') setLoginPin('');
                              else if (btn === 'OK') {
                                if (loginPin.length > 0) handleLogin(selectedUserForLogin, loginPin);
                              } else if (loginPin.length < 4) {
                                const newPin = loginPin + btn;
                                setLoginPin(newPin);
                                if (newPin.length === 4) {
                                  setTimeout(() => handleLogin(selectedUserForLogin, newPin), 200);
                                }
                              }
                            }}
                            className={`h-16 rounded-2xl font-black text-xl flex items-center justify-center transition-all shadow-[0_4px_0_0_rgba(0,0,0,0.1)] active:translate-y-1 active:shadow-none ${
                              btn === 'OK' 
                                ? 'bg-green-500 text-white shadow-green-700' 
                                : btn === 'C' 
                                  ? 'bg-red-500 text-white shadow-red-700' 
                                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-100'
                            }`}
                          >
                            {btn}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-12 text-center">
                <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest leading-relaxed">
                  Terminal autorizada para uso exclusivo de personal de Y.G Facturación.<br/>
                  Versión Pro 2.0 - 2026
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. BARRA DE NAVEGACIÓN (ESTILO SEMÁFORO) */}
      <nav className="bg-red-700 sticky top-0 z-50 shadow-2xl border-b-4 border-red-800">
        {isDemoMode && (
          <div className="bg-yellow-400 py-1.5 px-4 text-center font-black text-[10px] uppercase tracking-[0.2em] text-red-700 flex items-center justify-center gap-4 border-b-2 border-red-800">
            <Zap size={12} className="animate-pulse" />
            SISTEMA EN MODO DEMO - Y.G FACTURACIÓN
            {(() => {
              const start = localStorage.getItem('yg_demo_start_date');
              if (!start) return null;
              const diffDays = Math.floor(Math.abs(new Date().getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
              const remaining = Math.max(0, 15 - diffDays);
              return <span className="bg-red-700 text-white px-2 py-0.5 rounded-md ml-2">{remaining} DÍAS RESTANTES</span>;
            })()}
            <button 
              onClick={() => window.open('https://wa.me/18298925070', '_blank')}
              className="ml-4 bg-red-700 text-white px-3 py-0.5 rounded-full hover:bg-red-600 transition-colors flex items-center gap-1"
            >
              <Users size={10} /> CONTACTAR VENTAS
            </button>
          </div>
        )}
        <div className="w-full mx-auto px-4 lg:px-6 py-2 flex justify-between items-center">
          <div className="flex items-center gap-4 lg:gap-8">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-white hover:bg-red-800 rounded-xl transition-colors shrink-0"
            >
              <Menu size={28} />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-yellow-400 p-2 rounded-xl shadow-lg rotate-3 hidden sm:block">
                <ShoppingCart className="text-red-700" size={28} />
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-white tracking-tighter italic mr-1 sm:mr-4">Y.G <span className="text-yellow-400 uppercase">Facturación</span></h1>

              <div className="flex items-center gap-2">
                {isAuthLoading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : fbUser ? (
                  <div className="flex items-center gap-2 bg-red-800/50 px-3 py-1.5 rounded-full border border-red-600/50 backdrop-blur-sm">
                    {isSyncing ? (
                      <RefreshCw size={14} className="text-yellow-400 animate-spin" />
                    ) : (
                      <Cloud size={14} className="text-green-400" />
                    )}
                    <span className="text-[10px] font-black text-white/90 uppercase truncate max-w-[120px] tracking-tight">
                      {fbUser.displayName || fbUser.email?.split('@')[0]}
                    </span>
                    <button 
                      onClick={handleLogoutCloud} 
                      title="Cerrar sesión de la nube"
                      className="ml-1 text-red-300 hover:text-white transition-colors p-0.5"
                    >
                      <LogOut size={14} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => { setShowLogin(true); setShowEmailForm(true); }}
                    className="flex items-center gap-2 bg-white/10 hover:bg-red-600/20 px-3 py-1.5 rounded-full border border-white/10 hover:border-red-400/50 transition-all group"
                  >
                    <CloudOff size={14} className="text-gray-400 group-hover:text-red-300" />
                    <span className="text-[10px] font-black text-white/80 uppercase italic group-hover:text-white tracking-widest bg-clip-text">Sincronizar</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="hidden md:flex gap-1 lg:gap-2">
              {[
                { id: 'ventas', label: 'VENTAS', icon: ShoppingCart },
                { id: 'cotizaciones', label: 'COTIZACIONES', icon: FileText },
                { id: 'inventario', label: 'INVENTARIO', icon: ClipboardList, p: 'canManageInventory' },
                { id: 'productos', label: 'PRODUCTOS', icon: Tag, p: 'canManageProducts' },
                { id: 'clientes', label: 'CLIENTES', icon: Users, p: 'canManageCustomers' },
                { id: 'financiamiento', label: 'FINANZAS', icon: CreditCard, p: 'canViewFinances' },
                { id: 'corte', label: 'CORTE', icon: Calculator, p: 'canPerformCorte' },
                { id: 'config', label: 'CONFIG', icon: Settings, p: 'canManageSettings' },
              ].filter(tab => !tab.p || currentUser?.role === 'admin' || (currentUser?.permissions as any)?.[tab.p]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id as any)}
                  className={`flex items-center gap-1 xl:gap-2 px-2 lg:px-4 xl:px-6 py-2 rounded-2xl font-black transition-all ${
                    currentView === tab.id 
                    ? 'bg-yellow-400 text-red-700 shadow-[0_4px_0_0_rgba(185,28,28,1)] -translate-y-1' 
                    : 'text-red-100 hover:bg-red-600'
                  }`}
                >
                  <tab.icon size={16} className="shrink-0" />
                  <span className="hidden xl:block text-xs">{tab.label}</span>
                  <span className="xl:hidden text-[10px]">{tab.label.slice(0, 4)}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4 lg:mr-16">
            <div className="hidden lg:block text-right">
              <p className="text-[10px] font-black text-red-300 uppercase tracking-widest">Cajero en Turno</p>
              <p className="text-sm font-black text-white hover:text-yellow-400 cursor-pointer transition-colors uppercase italic" onClick={handleSwitchUser}>{currentUser?.name || 'Administrador'}</p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleSwitchUser}
                className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg border-2 border-red-800 hover:bg-blue-400 transition-all group"
                title="Cambiar Usuario"
              >
                <Users className="text-white group-hover:scale-110 transition-transform" size={20} />
              </button>
              <button 
                onClick={handleLogout}
                className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg border-2 border-red-800 hover:bg-yellow-300 transition-all group"
                title="Cerrar Sesión / Salir"
              >
                <LogOut className="text-red-700 group-hover:scale-110 transition-transform" size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-red-900/60 backdrop-blur-sm z-[100] md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-red-700 z-[101] shadow-2xl md:hidden flex flex-col border-r-4 border-red-800"
            >
              <div className="p-6 bg-red-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-400 p-2 rounded-xl shadow-lg rotate-3">
                    <ShoppingCart className="text-red-700" size={24} />
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tighter italic">Y.G <span className="text-yellow-400 uppercase">Menú</span></h2>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-red-300 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                {[
                  { id: 'ventas', label: 'VENTAS', icon: ShoppingCart },
                  { id: 'cotizaciones', label: 'COTIZACIONES', icon: FileText },
                  { id: 'inventario', label: 'INVENTARIO', icon: ClipboardList, p: 'canManageInventory' },
                  { id: 'productos', label: 'PRODUCTOS', icon: Tag, p: 'canManageProducts' },
                  { id: 'clientes', label: 'CLIENTES', icon: Users, p: 'canManageCustomers' },
                  { id: 'financiamiento', label: 'FINANZAS', icon: CreditCard, p: 'canViewFinances' },
                  { id: 'corte', label: 'CORTE', icon: Calculator, p: 'canPerformCorte' },
                  { id: 'config', label: 'CONFIG', icon: Settings, p: 'canManageSettings' },
                ].filter(tab => !tab.p || currentUser?.role === 'admin' || (currentUser?.permissions as any)?.[tab.p]).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setCurrentView(tab.id as any);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black transition-all ${
                      currentView === tab.id 
                      ? 'bg-yellow-400 text-red-700 shadow-lg' 
                      : 'text-red-100 hover:bg-red-650'
                    }`}
                  >
                    <tab.icon size={24} />
                    <span className="text-lg tracking-tight uppercase italic">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-6 border-t border-red-600/50 bg-red-800/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-black text-xs">
                    {currentUser?.name[0].toUpperCase() || 'A'}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-red-300 uppercase tracking-widest leading-none">Usuario</p>
                    <p className="text-sm font-black text-white italic">{currentUser?.name || 'Administrador'}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-400 text-red-700 py-3 rounded-xl font-black text-sm uppercase tracking-widest shadow-md hover:bg-yellow-300 transition-all"
                >
                  <LogOut size={18} /> CERRAR SESIÓN
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {globalMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md px-4"
          >
            <div className={`p-4 rounded-2xl shadow-2xl border-2 flex items-center gap-3 ${
              globalMessage.type === 'error' ? 'bg-red-600 border-red-400 text-white' :
              globalMessage.type === 'success' ? 'bg-green-600 border-green-400 text-white' :
              'bg-blue-600 border-blue-400 text-white'
            }`}>
              {globalMessage.type === 'error' ? <AlertTriangle size={24} /> :
               globalMessage.type === 'success' ? <CheckCircle size={24} /> :
               <AlertCircle size={24} />}
              <span className="font-black uppercase tracking-tight">{globalMessage.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full border-4 border-yellow-400 shadow-2xl"
            >
              <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center text-red-600 mb-6">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-2xl font-black text-gray-800 mb-4 uppercase leading-tight">Confirmación</h3>
              <p className="text-gray-600 font-bold mb-8">{confirmDialog.text}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-black transition-colors"
                >
                  CANCELAR
                </button>
                <button
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog(null);
                  }}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black transition-colors shadow-[0_4px_0_0_rgba(185,28,28,1)] active:translate-y-1 active:shadow-none"
                >
                  SÍ, ELIMINAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="w-full mx-auto px-4 lg:px-6 py-2">
        <AnimatePresence mode="wait">
          {currentView === 'ventas' ? (
            <motion.div
              key="ventas-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              {/* 5. PUNTO DE VENTA (ESTILO SEMÁFORO) */}
              <div className="w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-yellow-400 flex flex-col lg:flex-row">
                
                {/* Lista de Productos */}
                <div className="flex-1 p-4 lg:p-6 bg-green-50/50 flex flex-col">
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1 relative">
                      <div className="flex items-center bg-white p-4 rounded-2xl shadow-inner border-2 border-yellow-200 focus-within:border-yellow-400 transition-colors">
                        <Search className="text-yellow-500 mr-3" />
                        <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 text-gray-300 pointer-events-none">
                          <Barcode size={16} />
                          <span className="text-[10px] font-black uppercase tracking-tighter">Escáner Activo</span>
                        </div>
                        <input 
                          ref={ventasSearchRef}
                          type="text" 
                          value={searchTerm}
                          onFocus={() => setIsSearchFocused(true)}
                          onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSearchTerm(val);
                            setVentasDisplayMode('search'); 
                            setSelectedIndex(0);
                            
                            const exactMatch = productsList.find(p => p.barcode === val || p.id.toString() === val);
                            if (exactMatch && val.length >= 3) {
                              addToCart(exactMatch);
                              setSearchTerm('');
                              showMessage('Producto agregado', 'success');
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setSelectedIndex(prev => (prev + 1) % (filteredProducts.length || 1));
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setSelectedIndex(prev => (prev - 1 + (filteredProducts.length || 1)) % (filteredProducts.length || 1));
                            } else if (e.key === 'Enter') {
                              // Búsqueda directa por código de barras para mayor rapidez con escáner
                              const exactMatch = productsList.find(p => p.barcode === searchTerm || p.id.toString() === searchTerm);
                              if (exactMatch) {
                                addToCart(exactMatch);
                                setSearchTerm('');
                                setSelectedIndex(0);
                                return;
                              }

                              if (filteredProducts[selectedIndex]) {
                                addToCart(filteredProducts[selectedIndex]);
                                setSearchTerm('');
                                setSelectedIndex(0);
                              }
                            } else if (e.key === 'Escape') {
                              setSearchTerm('');
                              setVentasDisplayMode('quick');
                            }
                          }}
                          placeholder="Código, Nombre o Descripción..." 
                          className="w-full outline-none bg-transparent font-bold text-lg placeholder:text-gray-300" 
                        />
                        {searchTerm && (
                          <button onClick={() => { setSearchTerm(''); setVentasDisplayMode('quick'); }} className="text-gray-300 hover:text-gray-500">
                            <X size={20} />
                          </button>
                        )}
                      </div>

                      {/* Autocomplete Suggestions */}
                      <AnimatePresence>
                        {isSearchFocused && searchTerm.trim() && filteredProducts.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-yellow-400 z-[60] overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar"
                          >
                            {filteredProducts.map((product, index) => (
                              <button
                                key={product.id}
                                onClick={() => {
                                  addToCart(product);
                                  setSearchTerm('');
                                }}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={`w-full p-4 flex items-center gap-4 transition-colors text-left border-b border-gray-50 last:border-0 ${
                                  selectedIndex === index ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : ''
                                }`}
                              >
                                <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                                  {product.image ? (
                                    <img src={product.image} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                      <ImageIcon size={20} />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <p className="font-black text-gray-800 uppercase text-xs truncate">{product.name}</p>
                                    <p className="font-black text-green-600 ml-2">${product.price.toFixed(2)}</p>
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                    <span>Stock: {product.stock}</span>
                                    <span>{product.barcode || product.id}</span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <div className="flex bg-white p-1 rounded-2xl border-2 border-yellow-200 shadow-sm">
                      <button 
                        onClick={() => setVentasDisplayMode('search')}
                        className={`px-4 py-2 rounded-xl font-black transition-all flex items-center gap-2 ${ventasDisplayMode === 'search' ? 'bg-yellow-400 text-red-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        <Search size={20} /> BUSCAR
                      </button>
                      <button 
                        onClick={() => setVentasDisplayMode('quick')}
                        className={`px-4 py-2 rounded-xl font-black transition-all flex items-center gap-2 ${ventasDisplayMode === 'quick' ? 'bg-yellow-400 text-red-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        <LayoutGrid size={20} /> RÁPIDO
                      </button>
                      <button 
                        onClick={() => setShowCommonProductDialog(true)}
                        className="px-4 py-2 rounded-xl font-black transition-all flex items-center gap-2 text-gray-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <FilePlus size={20} /> COMÚN
                      </button>
                      <button 
                        onClick={handleOpenDrawer}
                        className="px-4 py-2 rounded-xl font-black transition-all flex items-center gap-2 text-gray-400 hover:text-green-600 hover:bg-green-50"
                        title="Abrir Gaveta (F12)"
                      >
                        <Archive size={20} /> GAVETA
                      </button>
                    </div>
                  </div>

                  {ventasDisplayMode === 'quick' && (
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
                      {['Todos', ...departments].map(dept => (
                        <button
                          key={dept}
                          onClick={() => setSelectedDeptFilter(dept)}
                          className={`px-2 py-0.5 rounded-md font-black text-[8px] tracking-tight whitespace-nowrap transition-all uppercase ${selectedDeptFilter === dept ? 'bg-red-600 text-white shadow-sm' : 'bg-white text-gray-400 hover:bg-gray-100 border border-gray-100'}`}
                        >
                          {dept}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-1 pb-4">
                      {(ventasDisplayMode === 'search' ? filteredProducts : quickProducts).map(product => (
                        <motion.div 
                          layout
                          key={product.id}
                          onClick={() => {
                            addToCart(product);
                            setSearchTerm('');
                          }}
                          className={`bg-white rounded-lg shadow-sm border transition-all group overflow-hidden cursor-pointer flex flex-col ${
                            ventasDisplayMode === 'search' && selectedIndex === filteredProducts.indexOf(product)
                            ? 'border-yellow-400 shadow-lg ring-2 ring-yellow-100 scale-[1.01]'
                            : 'border-gray-100 hover:border-yellow-400 hover:shadow-md'
                          }`}
                        >
                          <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-gray-200">
                                <ImageIcon size={32} strokeWidth={1} />
                              </div>
                            )}
                            <div className="absolute top-2 right-2 flex flex-col gap-1">
                              {product.stock <= product.minStock && product.useInventory && (
                                <div className="bg-red-500 text-white p-2 rounded-xl shadow-lg">
                                  <AlertTriangle size={14} />
                                </div>
                              )}
                            </div>
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white text-[10px] font-black uppercase tracking-widest">Añadir al Carrito</span>
                            </div>
                            <div className="absolute inset-0 bg-yellow-400/0 group-hover:bg-yellow-400/10 transition-colors" />
                          </div>
                          <div className="p-1 sm:p-2 flex flex-col flex-1 justify-between bg-white">
                            <h4 className="font-black text-gray-800 text-[9px] sm:text-[10px] leading-tight truncate uppercase tracking-tight mb-0.5">{product.name}</h4>
                            <div className="flex justify-between items-end gap-1">
                              <span className="text-base sm:text-lg font-black text-green-600">${product.price.toFixed(2)}</span>
                              <div className="text-right">
                                <p className={`text-[8px] sm:text-[9px] font-black uppercase leading-none ${product.stock > product.minStock ? 'text-gray-400' : 'text-red-500'}`}>
                                  {product.stock} {product.unit}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {ventasDisplayMode === 'search' && searchTerm.trim() && filteredProducts.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 opacity-50">
                          <Search size={64} className="mb-4" />
                          <p className="font-bold text-lg">No se encontraron productos</p>
                        </div>
                      )}
                      {ventasDisplayMode === 'search' && !searchTerm.trim() && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 opacity-50">
                          <Search size={64} className="mb-4" />
                          <p className="font-bold text-lg text-center leading-tight">Escanee un código o escriba<br/>para buscar productos</p>
                        </div>
                      )}
                      {ventasDisplayMode === 'quick' && quickProducts.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 opacity-50">
                          <LayoutGrid size={64} className="mb-4" />
                          <p className="font-bold text-lg">No hay productos registrados en este departamento</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resumen de Pago */}
                <div className="w-full lg:w-[350px] xl:w-[400px] 2xl:w-[450px] p-4 lg:p-6 bg-red-600 text-white flex flex-col relative shrink-0">
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <h3 className="text-3xl font-black mb-6 flex items-center gap-3">
                      <ShoppingCart size={32} /> FACTURA
                    </h3>

                    {/* Selector de Cliente para Facturación */}
                    <div className="mb-6 bg-red-700/40 p-4 rounded-3xl border border-red-400/30">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-red-100 flex items-center gap-2">
                          <User size={12} /> Cliente para Factura
                        </label>
                      </div>
                      <CustomerSearchSelect 
                        customers={customersList}
                        value={selectedCustomerId}
                        onChange={setSelectedCustomerId}
                        placeholder="-- Ventas de Mostrador (Genérico) --"
                        colorScheme="red"
                        className="mt-1"
                      />
                      {selectedCustomerId && (
                        <div className="mt-2 text-[10px] font-black uppercase text-yellow-300 animate-pulse">
                          Facturando a: {customersList.find(c => c.id === selectedCustomerId)?.name}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {/* Cuentas en Espera */}
                      {openAccounts.length > 0 && (
                        <div className="bg-red-700/30 p-4 rounded-3xl border border-red-500/50 mb-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-red-100 flex items-center gap-2 mb-3">
                            <Clock size={12} /> Cuentas en Espera ({openAccounts.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {openAccounts.map(account => (
                              <button
                                key={account.id}
                                onClick={() => handleRecallAccount(account)}
                                className="bg-yellow-400 text-red-700 px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 shadow-md hover:bg-yellow-300 transition-all group"
                              >
                                <span className="truncate max-w-[100px]">{account.name}</span>
                                <span className="opacity-60">${account.total.toFixed(0)}</span>
                                <div className="flex items-center gap-1">
                                  <div 
                                    className="hover:bg-red-700/20 p-1 rounded-full transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePrintPreReceipt(account);
                                    }}
                                    title="Imprimir Pre-Cuenta"
                                  >
                                    <Printer size={12} className="text-red-700 opacity-70 group-hover:opacity-100" />
                                  </div>
                                  <div 
                                    className="hover:bg-red-700/20 p-1 rounded-full transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAccount(account.id);
                                    }}
                                    title="Eliminar Cuenta"
                                  >
                                    <X size={12} className="text-red-700 opacity-70 group-hover:opacity-100" />
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <AnimatePresence mode="popLayout">
                        {cart.length === 0 ? (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 bg-red-700/50 rounded-3xl border-2 border-dashed border-red-400"
                          >
                            <Package className="mx-auto mb-2 opacity-50" size={48} />
                            <p className="font-bold text-red-200">Carrito vacío</p>
                          </motion.div>
                        ) : (
                          cart.map(item => (
                            <motion.div 
                              key={item.id}
                              initial={{ x: 20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              exit={{ x: -20, opacity: 0 }}
                              className="flex justify-between items-center bg-red-700/50 p-4 rounded-2xl border border-red-500 group"
                            >
                              <div className="flex-1">
                                <h5 className="font-black text-sm">{item.name}</h5>
                                <div className="flex items-center gap-4 mt-1">
                                  {editingQuantityId === item.id ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        autoFocus
                                        type="number"
                                        value={tempQuantity}
                                        onChange={(e) => setTempQuantity(e.target.value)}
                                        onBlur={() => updateCartItemQuantity(item.id, parseFloat(tempQuantity) || item.quantity)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') updateCartItemQuantity(item.id, parseFloat(tempQuantity) || item.quantity);
                                          if (e.key === 'Escape') setEditingQuantityId(null);
                                        }}
                                        className="bg-white text-red-700 px-2 py-0.5 rounded-lg font-black text-xs w-16 outline-none"
                                      />
                                      <span className="text-xs font-bold text-red-200">uds.</span>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => {
                                        setEditingQuantityId(item.id);
                                        setTempQuantity(item.quantity.toString());
                                      }}
                                      className="text-xs font-bold text-red-200 hover:text-white transition-colors flex items-center gap-1"
                                    >
                                      {item.quantity.toString().includes('.') ? item.quantity.toFixed(3) : item.quantity} uds. <Edit2 size={10} />
                                    </button>
                                  )}

                                  <span className="text-red-400">|</span>

                                  {editingPriceId === item.id ? (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs font-bold text-red-200">$</span>
                                      <input
                                        autoFocus
                                        type="number"
                                        value={tempPrice}
                                        onChange={(e) => setTempPrice(e.target.value)}
                                        onBlur={() => updateCartItemPrice(item.id, parseFloat(tempPrice) || item.price)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') updateCartItemPrice(item.id, parseFloat(tempPrice) || item.price);
                                          if (e.key === 'Escape') setEditingPriceId(null);
                                        }}
                                        className="bg-white text-red-700 px-2 py-0.5 rounded-lg font-black text-xs w-20 outline-none"
                                      />
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => {
                                        if (currentUser?.role === 'admin' || currentUser?.permissions.canEditPrices) {
                                          setEditingPriceId(item.id);
                                          setTempPrice(item.price.toString());
                                        } else {
                                          showMessage('No tienes permiso para editar precios', 'error');
                                        }
                                      }}
                                      className="text-xs font-bold text-red-200 hover:text-white transition-colors flex items-center gap-1"
                                    >
                                      ${item.price.toFixed(2)} {(currentUser?.role === 'admin' || currentUser?.permissions.canEditPrices) && <Edit2 size={10} />}
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-black text-yellow-300">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                                <button 
                                  onClick={() => removeFromCart(item.id)}
                                  className="p-2 hover:bg-red-500 rounded-xl transition-colors text-red-300 hover:text-white"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t-4 border-red-700">
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center justify-between mb-2 bg-red-700/30 p-3 rounded-2xl border border-red-500/50">
                        <span className="text-xs font-black uppercase tracking-widest text-red-200">Aplicar ITBIS (18%)</span>
                        <button 
                          onClick={() => setUseItbis(!useItbis)}
                          className={`w-12 h-6 rounded-full transition-colors relative ${useItbis ? 'bg-green-500' : 'bg-red-900'}`}
                        >
                          <motion.div 
                            animate={{ x: useItbis ? 24 : 4 }}
                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mb-4 bg-red-700/30 p-3 rounded-2xl border border-red-500/50">
                        <span className="text-xs font-black uppercase tracking-widest text-red-200">Propina (%)</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            value={tipPercentage || ''}
                            onChange={(e) => setTipPercentage(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-16 bg-red-900/50 border border-red-500/50 rounded-lg px-2 py-1 text-white font-bold text-right outline-none focus:border-yellow-400"
                            placeholder="0"
                          />
                          <span className="text-red-200 font-bold">%</span>
                        </div>
                      </div>

                      {useItbis ? (
                        <>
                          <div className="flex justify-between text-red-200 font-bold">
                            <span>Subtotal:</span>
                            <span>${(subtotalAfterDiscount / 1.18).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-red-200 font-bold">
                            <span>ITBIS (18%):</span>
                            <span>${(subtotalAfterDiscount - (subtotalAfterDiscount / 1.18)).toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-red-200 font-bold">
                          <span>Subtotal:</span>
                          <span>${subtotalAfterDiscount.toFixed(2)}</span>
                        </div>
                      )}

                      {customerDiscountAmount > 0 && (
                        <div className="flex justify-between text-green-300 font-black animate-pulse">
                          <span>DESC. CLIENTE ({selectedCustomerData?.discountPercentage}%):</span>
                          <span>-${customerDiscountAmount.toFixed(2)}</span>
                        </div>
                      )}

                      {tipAmount > 0 && (
                        <div className="flex justify-between text-yellow-300 font-bold">
                          <span>Propina ({tipPercentage}%):</span>
                          <span>${tipAmount.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center text-2xl lg:text-4xl font-black pt-2 gap-4">
                        <span className="shrink-0">TOTAL:</span>
                        <span className="text-yellow-300 truncate" title={`$${total.toFixed(2)}`}>${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <motion.button 
                          whileTap={{ scale: 0.95 }}
                          onClick={handleHoldCart}
                          disabled={cart.length === 0}
                          className={`w-full py-4 rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2 shadow-lg border-2 ${
                            cart.length === 0 
                            ? 'bg-red-800 text-red-400 opacity-50 cursor-not-allowed border-red-700' 
                            : 'bg-red-700 text-white hover:bg-red-600 border-red-500'
                          }`}
                        >
                          <Clock size={16} /> En Espera
                        </motion.button>

                        <motion.button 
                          whileTap={{ scale: 0.95 }}
                          onClick={handleCreateQuotation}
                          disabled={cart.length === 0}
                          className={`w-full py-4 rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2 shadow-lg border-2 ${
                            cart.length === 0 
                            ? 'bg-orange-800 text-orange-400 opacity-50 cursor-not-allowed border-orange-700' 
                            : 'bg-orange-700 text-white hover:bg-orange-600 border-orange-500'
                          }`}
                        >
                          <FileText size={16} /> Cotizar
                        </motion.button>
                      </div>

                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (cart.length > 0) {
                            handlePrintPreReceipt({
                              id: Date.now(),
                              name: 'PRE-CUENTA ACTUAL',
                              items: cart,
                              total: total,
                              createdAt: new Date().toISOString()
                            });
                          }
                        }}
                        disabled={cart.length === 0}
                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2 shadow-lg border-2 ${
                          cart.length === 0 
                          ? 'bg-gray-800 text-gray-500 opacity-50 cursor-not-allowed border-gray-700' 
                          : 'bg-gray-700 text-white hover:bg-gray-600 border-gray-500'
                        }`}
                      >
                        <Printer size={16} /> Imprimir Pre-Cuenta (Mesa)
                      </motion.button>

                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className={`w-full py-6 rounded-3xl font-black text-2xl shadow-[0_10px_0_0_rgba(21,128,61,1)] transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-3 ${
                          cart.length === 0 
                          ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                          : 'bg-green-500 hover:bg-green-400 text-white'
                        }`}
                      >
                        <CreditCard size={28} /> COBRAR AHORA
                      </motion.button>

                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentView('ventas_historial')}
                        className="w-full mt-4 bg-white border-4 border-blue-600 text-blue-600 py-6 rounded-3xl font-black text-xl uppercase italic tracking-tighter shadow-[0_10px_0_0_rgba(37,99,235,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
                      >
                        <History size={28} /> VENTAS DEL DÍA Y DEVOLUCIONES
                      </motion.button>
                    </div>
                  </div>

                  {/* Success Overlay */}
                  <AnimatePresence>
                    {showSuccess && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-green-500 z-20 flex flex-col items-center justify-center p-8 text-center"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', damping: 12 }}
                        >
                          <CheckCircle size={120} className="mb-6" />
                        </motion.div>
                        <h2 className="text-4xl font-black mb-2">¡VENTA EXITOSA!</h2>
                        <p className="text-green-100 font-bold mb-8">Imprimiendo factura...</p>
                        <div className="w-full bg-green-600 p-4 rounded-2xl flex items-center justify-between font-black">
                          <span>CAMBIO:</span>
                          <span className="text-yellow-300 text-2xl">$0.00</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Modal Producto Común */}
                  <AnimatePresence>
                    {showCommonProductDialog && (
                      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setShowCommonProductDialog(false)}
                          className="absolute inset-0 bg-red-950/80 backdrop-blur-sm"
                        />
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          className="bg-white rounded-[2.5rem] border-4 border-yellow-400 p-8 w-full max-w-md relative z-10 shadow-2xl"
                        >
                          <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                              <div className="bg-red-600 p-3 rounded-2xl text-white">
                                <FilePlus size={24} />
                              </div>
                              <h3 className="text-2xl font-black text-gray-800 tracking-tighter uppercase italic">Producto Común</h3>
                            </div>
                            <button 
                              onClick={() => setShowCommonProductDialog(false)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <X size={24} />
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nombre/Descripción</label>
                              <input 
                                autoFocus
                                type="text"
                                value={commonProductForm.name || ''}
                                onChange={(e) => setCommonProductForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Ej: Servicios Varios"
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-800 outline-none focus:border-red-500 transition-all"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Precio Venta</label>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">$</span>
                                  <input 
                                    type="number"
                                    value={commonProductForm.price || ''}
                                    onChange={(e) => setCommonProductForm(prev => ({ ...prev, price: e.target.value }))}
                                    placeholder="0.00"
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pl-8 font-black text-green-600 outline-none focus:border-red-500 transition-all text-xl"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Costo (Opcional)</label>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">$</span>
                                  <input 
                                    type="number"
                                    value={commonProductForm.cost || ''}
                                    onChange={(e) => setCommonProductForm(prev => ({ ...prev, cost: e.target.value }))}
                                    placeholder="0.00"
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pl-8 font-black text-gray-400 outline-none focus:border-red-500 transition-all text-xl"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <button 
                            disabled={!commonProductForm.name || !commonProductForm.price}
                            onClick={() => {
                              const priceNum = parseFloat(commonProductForm.price);
                              const costNum = parseFloat(commonProductForm.cost) || 0;
                              
                              if (isNaN(priceNum) || priceNum < 0) {
                                showMessage('Precio inválido', 'error');
                                return;
                              }

                              addToCart({
                                id: Date.now(), // Generate a temporary unique ID
                                name: commonProductForm.name,
                                sellPrice: priceNum,
                                costPrice: costNum,
                                stock: 999, // Common products don't have stock limit by default
                                useInventory: false
                              });

                              setCommonProductForm({ name: '', price: '', cost: '' });
                              setShowCommonProductDialog(false);
                              showMessage('Producto común agregado', 'success');
                            }}
                            className={`w-full mt-8 py-5 rounded-2xl font-black text-xl transition-all shadow-[0_8px_0_0_rgba(185,28,28,1)] active:translate-y-1 active:shadow-none flex items-center justify-center gap-3 ${
                              !commonProductForm.name || !commonProductForm.price
                              ? 'bg-gray-300 text-gray-500 shadow-none cursor-not-allowed'
                              : 'bg-red-600 text-white hover:bg-red-500'
                            }`}
                          >
                            <Plus size={24} /> AGREGAR AL CARRITO
                          </button>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Modal de Báscula */}
                  <AnimatePresence>
                    {productPendingWeight && (
                      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setProductPendingWeight(null)}
                          className="absolute inset-0 bg-blue-950/80 backdrop-blur-sm"
                        />
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          className="bg-white rounded-[2.5rem] border-4 border-blue-400 p-8 w-full max-w-md relative z-10 shadow-2xl"
                        >
                          <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-600 p-3 rounded-2xl text-white">
                                <Scale size={24} />
                              </div>
                              <h3 className="text-2xl font-black text-gray-800 tracking-tighter uppercase italic">Lectura de Báscula</h3>
                            </div>
                            <button 
                              onClick={() => setProductPendingWeight(null)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <X size={24} />
                            </button>
                          </div>

                          <div className="text-center mb-8 bg-blue-50 p-8 rounded-[2rem] border-2 border-blue-100 flex flex-col items-center">
                            <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">{productPendingWeight.description || productPendingWeight.name}</p>
                            <div className="text-6xl font-black text-blue-700 font-mono tracking-tighter tabular-nums">
                              {currentScaleWeight.toFixed(2)} <span className="text-2xl opacity-40 italic">lb</span>
                            </div>
                            <p className="text-[10px] font-bold text-blue-400 mt-2 uppercase tracking-widest italic">Pesando en tiempo real...</p>
                            {!isScaleConnected && (
                              <button 
                                onClick={handleConnectScale}
                                className="mt-4 text-xs font-black text-red-500 underline uppercase animate-pulse"
                              >
                                Conectar Báscula
                              </button>
                            )}
                          </div>
                          
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block text-center">Ajuste Manual / Peso Final</label>
                            <input 
                              autoFocus
                              type="number"
                              step="0.01"
                              value={currentScaleWeight || ''}
                              onChange={(e) => setCurrentScaleWeight(parseFloat(e.target.value) || 0)}
                              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-center font-black text-3xl text-gray-800 outline-none focus:border-blue-500 transition-all"
                            />
                            <div className="flex justify-between font-black text-xs text-gray-400 px-1 italic">
                              <span>PRECIO LB: ${productPendingWeight.sellPrice.toFixed(2)}</span>
                              <span className="text-blue-600">TOTAL: ${(currentScaleWeight * productPendingWeight.sellPrice).toFixed(2)}</span>
                            </div>
                          </div>

                          <button 
                            disabled={currentScaleWeight <= 0}
                            onClick={() => {
                              const weight = parseFloat(currentScaleWeight.toString());
                              if (isNaN(weight) || weight <= 0) {
                                showMessage('Peso inválido', 'error');
                                return;
                              }

                              setCart(prev => {
                                const existing = prev.find(item => item.id === productPendingWeight.id);
                                if (existing) {
                                  return prev.map(item => 
                                    item.id === productPendingWeight.id ? { ...item, quantity: item.quantity + weight } : item
                                  );
                                }
                                return [...prev, { 
                                  id: productPendingWeight.id, 
                                  name: productPendingWeight.description || productPendingWeight.name, 
                                  price: productPendingWeight.sellPrice || productPendingWeight.price, 
                                  costPrice: productPendingWeight.costPrice || 0,
                                  quantity: weight 
                                }];
                              });

                              setProductPendingWeight(null);
                              showMessage('Peso registrado', 'success');
                            }}
                            className={`w-full mt-8 py-5 rounded-2xl font-black text-xl transition-all shadow-[0_8px_0_0_rgba(29,78,216,1)] active:translate-y-1 active:shadow-none flex items-center justify-center gap-3 ${
                              currentScaleWeight <= 0
                              ? 'bg-gray-300 text-gray-500 shadow-none cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-500'
                            }`}
                          >
                             ACEPTAR PESO
                          </button>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ) : currentView === 'ventas_historial' ? (
            <motion.div
              key="ventas-historial-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full bg-white rounded-[2.5rem] shadow-2xl border-4 border-yellow-400 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md">
                    <History size={40} />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-tight">Ventas del Día y Devoluciones</h2>
                    <p className="text-blue-200 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 pl-1">Historial de Facturación y Control de Stock</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                   <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={20} />
                    <input 
                      type="text"
                      value={salesSearchTerm}
                      onChange={(e) => setSalesSearchTerm(e.target.value)}
                      placeholder="Ticket, Cliente o Cajero..."
                      className="w-full bg-blue-900/30 border-2 border-blue-400/30 rounded-2xl py-4 pl-12 pr-4 font-bold text-white placeholder:text-blue-300 outline-none focus:border-blue-400 transition-all shadow-inner"
                    />
                  </div>
                  <div className="relative sm:w-48">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={20} />
                    <input 
                      type="date"
                      value={salesDateFilter}
                      onChange={(e) => setSalesDateFilter(e.target.value)}
                      className="w-full bg-blue-900/30 border-2 border-blue-400/30 rounded-2xl py-4 pl-12 pr-4 font-bold text-white outline-none focus:border-blue-400 transition-all shadow-inner text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Stats Summary Panel */}
              <div className="bg-blue-50/50 p-2 sm:p-3 border-b-2 border-blue-100 grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-white p-3 sm:p-4 rounded-[2rem] shadow-sm border-2 border-blue-100 overflow-hidden">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none outline-none">TOTAL VENDIDO ({salesDateFilter || 'Todo'})</p>
                  <p className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tighter italic truncate">
                    ${filteredSalesHistory.reduce((sum, s) => s.status !== 'cancelada' ? sum + s.total : sum, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-[2rem] shadow-sm border-2 border-red-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">FACTURAS EMITIDAS</p>
                  <p className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tighter italic">{filteredSalesHistory.length}</p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-[2rem] shadow-sm border-2 border-green-100">
                  <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1 leading-none">COMPLETAS</p>
                  <p className="text-2xl sm:text-3xl font-black text-green-600 tracking-tighter italic">{filteredSalesHistory.filter(s => s.status === 'completada').length}</p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-[2rem] shadow-sm border-2 border-red-200">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1 leading-none">CANCELADAS</p>
                  <p className="text-2xl sm:text-3xl font-black text-red-600 tracking-tighter italic">{filteredSalesHistory.filter(s => s.status === 'cancelada').length}</p>
                </div>
              </div>

              {/* Sales List Table */}
              <div className="p-2 sm:p-4">
                <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border-2 border-gray-100 shadow-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left min-w-[800px] lg:min-w-[1000px]">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Ticket</th>
                        <th className="px-6 py-4">Fecha/Hora</th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Método</th>
                        <th className="px-6 py-4">Cajero</th>
                        <th className="px-6 py-4 text-right">Monto Total</th>
                        <th className="px-6 py-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                      {filteredSalesHistory.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-20 text-center opacity-20">
                            <History size={64} className="mx-auto mb-4" />
                            <p className="text-2xl font-black uppercase italic tracking-tighter">No hay ventas registradas</p>
                          </td>
                        </tr>
                      ) : (
                        filteredSalesHistory.map(sale => {
                          const customer = customersList.find(c => c.id === sale.customerId);
                          return (
                            <tr key={sale.id} className={`hover:bg-yellow-50/50 transition-colors ${sale.status === 'cancelada' ? 'bg-red-50/50' : ''}`}>
                              <td className="px-6 py-4">
                                <div className={`flex items-center justify-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter w-fit ${
                                  sale.status === 'cancelada' ? 'bg-red-100 text-red-600' : 
                                  sale.status === 'devuelta' ? 'bg-blue-100 text-blue-600' : 
                                  'bg-green-100 text-green-600'
                                }`}>
                                  {sale.status === 'cancelada' ? <Ban size={10} /> : 
                                   sale.status === 'devuelta' ? <RotateCcw size={10} /> : 
                                   <CheckCircle size={10} />}
                                  {sale.status}
                                </div>
                              </td>
                              <td className="px-6 py-4 font-black text-red-700 italic">#{sale.id.toString().slice(-6)}</td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="font-black text-gray-700 leading-none mb-1">{new Date(sale.date).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                                  <span className="text-[10px] font-bold text-gray-400">{new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col max-w-[180px]">
                                  <span className="font-black text-gray-700 leading-none mb-1 truncate uppercase italic">
                                    {customer?.name || 'Venta de Mostrador'}
                                  </span>
                                  <span className="text-[10px] font-bold text-gray-400">{customer?.rnc || 'ID: ' + sale.id.toString().slice(0,4)}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg uppercase italic tracking-tighter">
                                  {sale.paymentMethod}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-black text-gray-500 text-[10px] uppercase italic">{sale.cashier}</td>
                              <td className="px-6 py-4 text-right">
                                <span className={`text-lg font-black tracking-tighter italic ${sale.status === 'cancelada' ? 'text-gray-300 line-through' : 'text-red-700'}`}>
                                  ${sale.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => setSelectedSaleDetail(sale)}
                                    className="p-2 bg-white border-2 border-gray-100 rounded-xl hover:bg-yellow-50 text-yellow-600 shadow-sm transition-all"
                                    title="Ver Detalles"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handlePrintReceipt(sale)}
                                    className="p-2 bg-white border-2 border-gray-100 rounded-xl hover:bg-blue-50 text-blue-600 shadow-sm transition-all"
                                    title="Re-imprimir Ticket"
                                  >
                                    <Printer size={16} />
                                  </button>
                                  {sale.status !== 'cancelada' && (
                                    <button 
                                      onClick={() => handleCancelSale(sale)}
                                      className="p-2 bg-white border-2 border-gray-100 rounded-xl hover:bg-red-50 text-red-600 shadow-sm transition-all"
                                      title="Cancelar Factura"
                                    >
                                      <Ban size={16} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detalle de Venta Overlay */}
              <AnimatePresence>
                {selectedSaleDetail && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-hidden">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedSaleDetail(null)}
                      className="absolute inset-0 bg-blue-950/80 backdrop-blur-md"
                    />
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0, y: 30 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0, y: 30 }}
                      className="bg-white rounded-[3rem] sm:rounded-[4rem] border-[8px] border-yellow-400 p-6 sm:p-10 w-full max-w-2xl relative z-10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                    >
                      <button 
                        onClick={() => setSelectedSaleDetail(null)}
                        className="absolute top-6 right-6 sm:top-10 sm:right-10 p-3 bg-blue-50 text-blue-500 rounded-2xl hover:bg-blue-100 transition-colors z-20"
                      >
                        <X size={24} />
                      </button>

                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl rotate-3">
                          <Ticket size={32} />
                        </div>
                        <div>
                          <h3 className="text-2xl sm:text-4xl font-black text-gray-800 tracking-tighter uppercase italic leading-none">Ticket #{selectedSaleDetail.id.toString().slice(-6)}</h3>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1 pl-1">Detalle Maestro de Transacción</p>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar mb-8 space-y-6">
                        <div className="bg-gray-50 rounded-[2.5rem] p-6 sm:p-8 border-4 border-gray-100">
                           <table className="w-full">
                             <thead>
                               <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b-2 border-gray-200">
                                 <th className="pb-4 text-left">Producto / Servicio</th>
                                 <th className="pb-4 text-center">Cant.</th>
                                 <th className="pb-4 text-right">Precio</th>
                                 <th className="pb-4 text-right">Monto</th>
                                 <th className="pb-4 text-center">Dev.</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                               {selectedSaleDetail.items.map((item, idx) => (
                                 <tr key={idx} className="group hover:bg-white/50 transition-colors">
                                   <td className="py-4">
                                      <p className="font-black text-gray-800 uppercase text-xs tracking-tighter leading-snug">{item.name}</p>
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">{item.barcode || item.id}</p>
                                   </td>
                                   <td className="py-4 text-center font-black text-gray-600 italic text-sm">{item.quantity}</td>
                                   <td className="py-4 text-right font-bold text-gray-400 text-xs">${item.price.toFixed(2)}</td>
                                   <td className="py-4 text-right font-black text-blue-700 tracking-tighter italic text-base">${(item.price * item.quantity).toFixed(2)}</td>
                                   <td className="py-4 text-center">
                                      {selectedSaleDetail.status !== 'cancelada' && (
                                        <button 
                                          onClick={() => handleReturnItem(selectedSaleDetail, idx, 1)}
                                          className="p-2 bg-white border-2 border-gray-100 rounded-xl text-blue-500 hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm"
                                          title="Devolver 1 unidad"
                                        >
                                          <RotateCcw size={14} />
                                        </button>
                                      )}
                                   </td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="bg-blue-50 rounded-[2rem] p-6 border-4 border-blue-100 relative overflow-hidden group">
                              <DollarSign className="absolute -right-4 -bottom-4 text-blue-100 group-hover:text-blue-200 transition-colors" size={100} />
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 relative z-10 leading-none">Método de Cobro</p>
                              <p className="text-2xl font-black text-blue-900 uppercase italic tracking-tighter relative z-10">{selectedSaleDetail.paymentMethod}</p>
                              <div className="flex items-center gap-2 mt-2 relative z-10">
                                 <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black uppercase italic">
                                    {selectedSaleDetail.cashier[0]}
                                 </div>
                                 <p className="text-[10px] font-black text-blue-600 uppercase italic tracking-tighter">Por: {selectedSaleDetail.cashier}</p>
                              </div>
                           </div>
                           <div className="bg-blue-600 rounded-[2rem] p-6 text-white text-right shadow-xl shadow-blue-200 border-4 border-blue-700 relative overflow-hidden group">
                              <ShoppingCart className="absolute -left-4 -bottom-4 text-blue-500 group-hover:text-blue-400 transition-colors" size={100} />
                              <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1 relative z-10 leading-none">TOTAL NETO COBRADO</p>
                              <p className={`text-4xl font-black tracking-tighter italic relative z-10 ${selectedSaleDetail.status === 'cancelada' ? 'line-through decoration-white/50' : ''}`}>
                                ${selectedSaleDetail.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </p>
                              <div className="mt-2 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full relative z-10 backdrop-blur-md">
                                 {selectedSaleDetail.status === 'cancelada' ? <Ban size={10} /> : <CheckCircle size={10} />}
                                 <span className="text-[9px] font-black uppercase italic tracking-widest">{selectedSaleDetail.status}</span>
                              </div>
                           </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                         <button 
                           onClick={() => {
                             handlePrintReceipt(selectedSaleDetail);
                             setSelectedSaleDetail(null);
                           }}
                           className="flex-1 bg-gray-800 text-white py-6 rounded-3xl font-black text-xl uppercase italic tracking-tighter shadow-xl active:translate-y-1 transition-all flex items-center justify-center gap-3 border-4 border-transparent hover:border-gray-500"
                         >
                           <Printer size={28} /> RE-IMPRIMIR TICKET
                         </button>
                         {selectedSaleDetail.status !== 'cancelada' && (
                           <button 
                             onClick={() => {
                               handleCancelSale(selectedSaleDetail);
                               setSelectedSaleDetail(null);
                             }}
                             className="flex-1 bg-red-700 text-white py-6 rounded-3xl font-black text-xl uppercase italic tracking-tighter shadow-xl active:translate-y-1 transition-all flex items-center justify-center gap-3 border-4 border-red-800 hover:bg-red-600"
                           >
                             <Ban size={28} /> CANCELAR FACTURA
                           </button>
                         )}
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : currentView === 'cotizaciones' ? (
            <motion.div
              key="cotizaciones-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-orange-400"
            >
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-2xl">
                    <FileText size={32} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter italic">Cotizaciones</h3>
                    <p className="text-xs font-bold text-orange-100 uppercase tracking-widest pl-1">Presupuestos y Propuestas para Clientes</p>
                  </div>
                </div>

                <div className="relative flex-1 max-w-md">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-200">
                    <Search size={20} />
                  </div>
                  <input 
                    type="text"
                    value={quotationSearchTerm}
                    onChange={(e) => setQuotationSearchTerm(e.target.value)}
                    placeholder="Buscar por cliente o ID..."
                    className="w-full bg-white/10 border-2 border-white/20 rounded-2xl py-3 pl-12 pr-4 font-bold text-white placeholder:text-white/40 outline-none focus:bg-white/20 focus:border-white transition-all"
                  />
                </div>
              </div>

              <div className="p-4 lg:p-6">
                {quotationsList.length === 0 ? (
                  <div className="py-20 text-center opacity-20">
                    <ClipboardList size={120} className="mx-auto mb-4" />
                    <h4 className="text-4xl font-black uppercase tracking-tighter italic">No hay cotizaciones</h4>
                    <p className="font-bold text-xl uppercase tracking-widest mt-2 font-mono">Genera una cotización desde el punto de venta</p>
                    <button 
                      onClick={() => setCurrentView('ventas')}
                      className="mt-8 bg-orange-600 text-white px-8 py-4 rounded-2xl font-black text-xl shadow-[0_5px_0_0_rgba(154,52,18,1)] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 mx-auto"
                    >
                      IR A VENTAS <ArrowRight size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quotationsList.filter(q => 
                      q.customerName.toLowerCase().includes(quotationSearchTerm.toLowerCase()) ||
                      q.id.toString().includes(quotationSearchTerm)
                    ).map(quot => (
                      <motion.div 
                        key={quot.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-50 rounded-[2.5rem] border-2 border-gray-100 p-6 hover:shadow-xl hover:border-orange-300 transition-all group flex flex-col"
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 font-black text-xl italic">
                              {quot.customerName.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-black text-gray-800 line-clamp-1 uppercase tracking-tighter">{quot.customerName}</h4>
                              <p className="text-[10px] font-bold text-gray-400">ID: #{quot.id.toString().slice(-6)}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => deleteQuotation(quot.id)}
                            className="bg-white p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 shadow-sm border border-gray-100 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="flex-1 space-y-3 mb-6">
                          <div className="flex justify-between items-center text-xs font-bold text-gray-500 px-1 border-b border-gray-200 pb-2">
                            <span className="uppercase tracking-widest italic">Artículos</span>
                            <span className="text-gray-800 uppercase">{quot.items.reduce((sum, i) => sum + i.quantity, 0)} Unidades</span>
                          </div>
                          <div className="max-h-24 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {quot.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-[10px] font-bold text-gray-400">
                                <span className="line-clamp-1">{item.name} x{item.quantity}</span>
                                <span className="font-black text-gray-600 shrink-0">${(item.price * item.quantity).toFixed(0)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-6 flex justify-between items-center shadow-inner">
                          <div className="text-left">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5 leading-none">TOTAL ESTIMADO</p>
                            <p className="text-2xl font-black text-orange-600 tracking-tighter italic leading-none">${quot.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5 leading-none">VENCE EL</p>
                            <p className="text-[11px] font-black text-gray-800">{new Date(quot.validUntil).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <button 
                            onClick={() => convertQuotationToCart(quot)}
                            className="bg-orange-600 hover:bg-orange-500 text-white p-2 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-[0_3px_0_0_rgba(154,52,18,1)] active:translate-y-1 active:shadow-none transition-all flex flex-col items-center justify-center gap-1"
                            title="Convertir a Factura"
                          >
                            <ShoppingCart size={14} /> Facturar
                          </button>
                          <button 
                            onClick={() => handlePrintQuotation(quot)}
                            className="bg-gray-800 hover:bg-black text-white p-2 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-[0_3px_0_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex flex-col items-center justify-center gap-1"
                            title="Imprimir Directamente"
                          >
                            <Printer size={14} /> Imprimir
                          </button>
                          <button 
                            onClick={() => setViewingQuotation(quot)}
                            className="bg-white hover:bg-gray-50 text-gray-500 border-2 border-gray-100 p-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-1"
                            title="Ver Detalle"
                          >
                            <Eye size={14} /> Ver
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : currentView === 'productos' ? (
            <motion.div
              key="productos-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-yellow-400"
            >
              {/* Header Naranja/Amarillo */}
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 flex items-center gap-2 text-white font-black">
                <Tag size={24} />
                <span className="text-xl uppercase tracking-tighter">PRODUCTOS</span>
              </div>

              {/* Alertas de Stock Bajo (Nueva Sección Solicitada) */}
              <AnimatePresence>
                {isQuickAddOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[60] bg-yellow-500/95 backdrop-blur-md p-8 flex flex-col items-center justify-center overflow-y-auto"
                  >
                    <div className="w-full max-w-lg bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl p-6 sm:p-8 border-4 sm:border-8 border-yellow-300 relative">
                      <button 
                        onClick={() => setIsQuickAddOpen(false)}
                        className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-red-600 text-white p-2 sm:p-3 rounded-full shadow-xl hover:bg-red-700 transition-colors"
                      >
                        <X size={20} />
                      </button>

                      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                        <div className="bg-yellow-100 p-3 sm:p-4 rounded-2xl sm:rounded-3xl">
                          <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 fill-yellow-600" />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-3xl font-black text-gray-800 tracking-tighter uppercase">Alta Rápida</h3>
                          <p className="text-gray-400 font-bold uppercase text-[8px] sm:text-[10px] tracking-widest leading-none">Registro Express de Productos</p>
                        </div>
                      </div>

                      <div className="space-y-4 sm:space-y-6">
                        <div className="space-y-1 sm:space-y-2">
                          <label className="font-black text-gray-700 uppercase text-[10px] tracking-widest pl-1">Código de Barras</label>
                          <input 
                            autoFocus
                            type="text"
                            value={productForm.barcode}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProductForm({...productForm, barcode: val});
                              
                              // Auto-search in Quick Add too
                              if (val && val.length >= 3) {
                                const existing = productsList.find(p => p.barcode === val);
                                if (existing) {
                                  loadProductData(existing);
                                  setIsQuickAddOpen(false);
                                  showMessage('Producto encontrado y cargado', 'info');
                                  setTimeout(() => descriptionInputRef.current?.focus(), 100);
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                // Direct search on Enter in Quick Add
                                const val = productForm.barcode;
                                if (val) {
                                  const existing = productsList.find(p => p.barcode === val || p.id.toString() === val);
                                  if (existing) {
                                    loadProductData(existing);
                                    setIsQuickAddOpen(false);
                                    showMessage('Producto encontrado y cargado', 'info');
                                    setTimeout(() => descriptionInputRef.current?.focus(), 100);
                                    return;
                                  }
                                }
                                document.getElementById('quick-name')?.focus();
                              }
                            }}
                            className="w-full bg-yellow-50 border-2 sm:border-4 border-yellow-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 font-black text-lg sm:text-2xl text-yellow-700 outline-none focus:border-yellow-300 transition-all placeholder:text-yellow-200"
                            placeholder="00000000"
                          />
                        </div>

                        <div className="space-y-1 sm:space-y-2">
                          <label className="font-black text-gray-700 uppercase text-[10px] tracking-widest pl-1">Nombre / Descripción</label>
                          <input 
                            id="quick-name"
                            type="text"
                            value={productForm.description}
                            onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') document.getElementById('quick-price')?.focus();
                            }}
                            className="w-full bg-gray-50 border-2 sm:border-4 border-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 font-black text-lg sm:text-2xl text-gray-700 outline-none focus:border-yellow-300 transition-all placeholder:text-gray-200"
                            placeholder="Nombre del Producto"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-1 sm:space-y-2">
                            <label className="font-black text-gray-700 uppercase text-[10px] tracking-widest pl-1">Precio Venta</label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 text-green-500" size={18} sm:size={24} />
                              <input 
                                id="quick-price"
                                type="number"
                                value={productForm.sellPrice || ''}
                                onChange={(e) => setProductForm({...productForm, sellPrice: parseFloat(e.target.value) || 0})}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveProduct();
                                }}
                                className="w-full bg-green-50 border-2 sm:border-4 border-green-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 pl-8 sm:pl-12 font-black text-lg sm:text-2xl text-green-700 outline-none focus:border-green-300 transition-all"
                              />
                            </div>
                          </div>
                          <div className="space-y-1 sm:space-y-2">
                            <label className="font-black text-gray-700 uppercase text-[10px] tracking-widest pl-1">Stock Inicial</label>
                            <input 
                              type="number"
                              value={productForm.currentStock || ''}
                              onChange={(e) => setProductForm({...productForm, currentStock: parseFloat(e.target.value) || 0})}
                              className="w-full bg-blue-50 border-2 sm:border-4 border-blue-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 font-black text-lg sm:text-2xl text-blue-700 outline-none focus:border-blue-300 transition-all"
                            />
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            if (!productForm.barcode || !productForm.description || !productForm.sellPrice) {
                              showMessage('Completa los campos obligatorios', 'error');
                              return;
                            }
                            saveProduct();
                            setIsQuickAddOpen(false);
                          }}
                          className="w-full bg-red-600 text-white py-6 rounded-[2rem] font-black text-2xl shadow-[0_12px_0_0_rgba(185,28,28,1)] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-3 uppercase tracking-tighter mt-4"
                        >
                          <Plus size={32} /> Registrar Ahora
                        </button>
                        <p className="text-[10px] text-gray-300 font-bold text-center uppercase tracking-widest">Se asignará al depto. "Sin Departamento" por defecto</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Alertas de Stock Bajo (Nueva Sección Solicitada) */}
              {lowStockProducts.length > 0 && (
                <div className="bg-red-50 border-b-4 border-red-500 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-red-700 font-black flex items-center gap-2 uppercase tracking-tighter">
                      <AlertTriangle className="animate-pulse" size={24} /> 
                      ¡ATENCIÓN! {lowStockProducts.length} PRODUCTOS CON STOCK BAJO
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {lowStockProducts.map((product) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={product.id}
                        className="bg-white p-3 rounded-2xl border-2 border-red-100 shadow-sm flex items-center gap-4 group hover:border-red-300 transition-colors cursor-pointer"
                        onClick={() => {
                          setProductForm({
                            barcode: product.barcode || product.id.toString(),
                            description: product.description || product.name,
                            sellType: product.sellType || 'unit',
                            costPrice: product.costPrice || (product.price * 0.7),
                            sellPrice: product.sellPrice || product.price,
                            wholesalePrice: product.wholesalePrice || (product.price * 0.9),
                            department: product.department || product.category,
                            useInventory: product.useInventory !== undefined ? product.useInventory : true,
                            currentStock: product.currentStock !== undefined ? product.currentStock : product.stock,
                            minStock: product.minStock || 5,
                            image: product.image || null
                          });
                          setEditingProductId(product.id);
                          setProductMode('modificar');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <Package size={24} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-gray-800 text-sm truncate uppercase">{product.name || product.description}</h4>
                          <div className="flex items-center gap-2">
                             <span className="text-red-600 font-black text-xs">Stock: {product.currentStock || product.stock}</span>
                             <span className="text-gray-400 text-[10px] font-bold">Mín: {product.minStock || 5}</span>
                          </div>
                        </div>
                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <Pencil size={14} className="text-red-400" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Toolbar */}
              <div className="bg-gray-100 p-2 border-b-2 border-gray-200 flex flex-wrap gap-2">
                {[
                  { id: 'nuevo', label: 'Nuevo', icon: FilePlus, p: 'canManageProducts' },
                  { id: 'quick', label: 'Alta Rápida', icon: Zap, p: 'canManageProducts' },
                  { id: 'modificar', label: 'Modificar', icon: Pencil, p: 'canManageProducts' },
                  { id: 'eliminar', label: 'Eliminar', icon: Trash2, p: 'canManageProducts' },
                  { id: 'deptos', label: 'Departamentos', icon: LayoutGrid, p: 'canManageProducts' },
                  { id: 'ventas', label: 'Ventas por Periodo', icon: BarChart3, p: 'canViewSales' },
                  { id: 'promos', label: 'Promociones', icon: Tag, p: 'canManageProducts' },
                  { id: 'importar', label: 'Importar ...', icon: FileUp, p: 'canManageProducts' },
                ].filter(btn => !btn.p || currentUser?.role === 'admin' || (currentUser?.permissions as any)?.[btn.p]).map((btn) => (
                  <button 
                    key={btn.id} 
                    onClick={() => {
                      if (btn.id === 'nuevo') {
                        setProductMode('nuevo');
                        setIsSearchingToModify(false);
                        setEditingProductId(null);
                        setProductForm({
                          barcode: '',
                          description: '',
                          sellType: 'unit',
                          costPrice: 0,
                          sellPrice: 0,
                          wholesalePrice: 0,
                          department: 'Sin Departamento',
                          useInventory: true,
                          currentStock: 0,
                          minStock: 0,
                          image: null
                        });
                      } else if (btn.id === 'quick') {
                        setProductMode('nuevo');
                        setIsSearchingToModify(false);
                        setEditingProductId(null);
                        setProductForm({
                          barcode: '',
                          description: '',
                          sellType: 'unit',
                          costPrice: 0,
                          sellPrice: 0,
                          wholesalePrice: 0,
                          department: 'Sin Departamento',
                          useInventory: true,
                          currentStock: 0,
                          minStock: 0,
                          image: null
                        });
                        setIsQuickAddOpen(true);
                      } else if (btn.id === 'modificar') {
                        setIsSearchingToModify(true);
                        setIsSearchingToDelete(false);
                        setEditingProductId(null);
                      } else if (btn.id === 'eliminar') {
                        if (productMode === 'modificar' && editingProductId) {
                          setConfirmDialog({
                            text: '¿Estás seguro de que deseas eliminar este producto?',
                            onConfirm: () => {
                              setProductsList(prev => prev.filter(p => p.id !== editingProductId));
                              setProductMode('nuevo');
                              setEditingProductId(null);
                              setProductForm({
                                barcode: '',
                                description: '',
                                sellType: 'unit',
                                costPrice: 0,
                                sellPrice: 0,
                                wholesalePrice: 0,
                                department: 'Sin Departamento',
                                useInventory: true,
                                currentStock: 0,
                                minStock: 0,
                                image: null
                              });
                              showMessage('Producto eliminado', 'success');
                            }
                          });
                        } else {
                          setIsSearchingToDelete(true);
                          setIsSearchingToModify(false);
                          setEditingProductId(null);
                        }
                      } else if (btn.id === 'deptos') {
                        setProductMode('departamentos');
                        setIsSearchingToModify(false);
                        setIsSearchingToDelete(false);
                      } else if (btn.id === 'ventas') {
                        setCurrentView('ventas_periodo');
                      } else if (btn.id === 'promos') {
                        setCurrentView('promociones');
                      } else if (btn.id === 'importar') {
                        setCurrentView('importar_productos');
                      }
                    }}
                    className={`bg-white border border-gray-300 px-4 py-2 rounded shadow-sm flex items-center gap-2 hover:bg-gray-50 transition-colors text-sm font-bold text-gray-700 ${
                      (btn.id === 'nuevo' && productMode === 'nuevo' && !isSearchingToModify && !isSearchingToDelete) || 
                      (btn.id === 'modificar' && isSearchingToModify) ||
                      (btn.id === 'eliminar' && isSearchingToDelete) ||
                      (btn.id === 'modificar' && productMode === 'modificar' && !isSearchingToModify && !isSearchingToDelete) ||
                      (btn.id === 'deptos' && productMode === 'departamentos')
                      ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <btn.icon size={16} className="text-blue-600" />
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Formulario o Buscador de Modificar */}
              <div className="p-8 relative min-h-[400px] sm:min-h-[500px]">
                <AnimatePresence mode="wait">
                  {(isSearchingToModify || isSearchingToDelete) ? (
                    <motion.div
                      key="search-modify"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute inset-0 flex items-center justify-center bg-gray-500/20 backdrop-blur-sm z-10"
                    >
                      <div className="bg-[#d1d1d1] p-1 shadow-xl border border-gray-400 w-full max-w-md">
                        <div className="bg-[#f0f0f0] border border-gray-300 p-6 flex flex-col items-center">
                          <h3 className="text-xl font-serif text-gray-800 mb-4">
                            {isSearchingToDelete ? 'Eliminar Producto' : 'Modificar Producto'}
                          </h3>
                          <div className="w-full space-y-2">
                            <label className="text-sm text-gray-700 font-serif block text-center">
                              Nombre o Código del Producto:
                            </label>
                            <input 
                              ref={modifySearchRef}
                              type="text"
                              value={modifySearchTerm}
                              onChange={(e) => {
                                const val = e.target.value;
                                setModifySearchTerm(val);
                                // Auto-load if it matches a barcode exactly
                                const product = findProduct(val);
                                if (product) {
                                  loadProductData(product);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') loadProductToModify();
                                if (e.key === 'Escape') {
                                  setIsSearchingToModify(false);
                                  setIsSearchingToDelete(false);
                                }
                              }}
                              className="w-full bg-[#fdfdfd] border border-gray-400 p-1 outline-none focus:border-blue-500 shadow-inner text-lg"
                            />
                          </div>
                          <button 
                            onClick={loadProductToModify}
                            className="mt-6 bg-[#e1e1e1] border border-gray-500 px-8 py-1 flex items-center gap-2 hover:bg-gray-200 active:bg-gray-300 transition-colors text-sm font-serif shadow-sm"
                          >
                            <Check size={14} className="text-green-600" /> Aceptar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <div className="mb-8">
                  <h3 className="text-2xl font-black text-yellow-600 uppercase mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
                      {productMode === 'nuevo' ? <FilePlus size={20} className="text-yellow-600" /> : 
                       productMode === 'modificar' ? <Pencil size={20} className="text-yellow-600" /> :
                       <LayoutGrid size={20} className="text-yellow-600" />}
                    </div>
                    {productMode === 'nuevo' ? 'NUEVO PRODUCTO' : 
                     productMode === 'modificar' ? 'MODIFICAR PRODUCTO' : 
                     'ADMINISTRAR DEPARTAMENTOS'}
                  </h3>

                  {productMode === 'departamentos' ? (
                    <div className="space-y-8">
                      <div className="bg-yellow-50 p-6 rounded-3xl border-2 border-yellow-200">
                        <h4 className="font-black text-gray-700 mb-4 uppercase text-sm tracking-widest">Agregar Nuevo Departamento</h4>
                        <div className="flex gap-4">
                          <input 
                            type="text"
                            value={newDeptName}
                            onChange={(e) => setNewDeptName(e.target.value)}
                            placeholder="Nombre del departamento..."
                            className="flex-1 bg-white border-2 border-yellow-200 rounded-xl p-3 font-bold text-gray-700 outline-none focus:border-yellow-400 transition-colors"
                          />
                          <button 
                            onClick={() => {
                              if (newDeptName.trim()) {
                                if (departments.includes(newDeptName.trim())) {
                                  showMessage('Este departamento ya existe', 'error');
                                  return;
                                }
                                setDepartments([...departments, newDeptName.trim()]);
                                setNewDeptName('');
                                showMessage('Departamento agregado', 'success');
                              }
                            }}
                            className="bg-yellow-500 text-white px-6 rounded-xl font-black hover:bg-yellow-600 transition-colors flex items-center gap-2"
                          >
                            <Plus size={20} /> AGREGAR
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {departments.map((dept) => (
                          <div key={dept} className="bg-white p-4 rounded-2xl border-2 border-gray-100 flex justify-between items-center group hover:border-yellow-200 transition-colors">
                            <span className="font-bold text-gray-700">{dept}</span>
                            {dept !== 'Sin Departamento' && (
                              <button 
                                onClick={() => {
                                  setConfirmDialog({
                                    text: `¿Estás seguro de eliminar el departamento "${dept}"?`,
                                    onConfirm: () => {
                                      setDepartments(departments.filter(d => d !== dept));
                                      showMessage('Departamento eliminado', 'success');
                                    }
                                  });
                                }}
                                className="text-red-500 hover:text-red-700 p-2 transition-colors flex items-center gap-1"
                                title="Eliminar Departamento"
                              >
                                <Trash2 size={18} />
                                <span className="text-[10px] font-black uppercase">Eliminar</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="h-1 w-full bg-yellow-100 rounded-full mb-8" />
                      <div className="flex flex-col lg:flex-row gap-8">
                  {/* Columna Izquierda: Foto */}
                  <div className="w-full lg:w-64 flex flex-col items-center gap-4">
                    <label className="font-black text-gray-700 uppercase tracking-widest text-sm self-start">Foto del Producto</label>
                    <div 
                      className="w-full aspect-square bg-yellow-50 border-4 border-dashed border-yellow-200 rounded-3xl flex flex-col items-center justify-center overflow-hidden relative group cursor-pointer hover:border-yellow-400 transition-colors"
                      onClick={() => document.getElementById('product-image-input')?.click()}
                    >
                      {productForm.image ? (
                        <>
                          <img src={productForm.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="text-white" size={48} />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-yellow-400 group-hover:text-yellow-500 transition-colors">
                          <ImageIcon size={64} strokeWidth={1.5} />
                          <span className="font-bold text-sm mt-2">Subir Imagen</span>
                        </div>
                      )}
                      <input 
                        id="product-image-input"
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold text-center">Formatos: JPG, PNG. Máx 2MB</p>
                    {productForm.image && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductForm(prev => ({ ...prev, image: null }));
                        }}
                        className="text-red-500 font-bold text-xs hover:underline"
                      >
                        Eliminar foto
                      </button>
                    )}
                  </div>

                  {/* Columna Derecha: Datos */}
                  <div className="flex-1 space-y-6">
                    {/* Código de Barras */}
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <label className="w-full md:w-48 font-black text-gray-700 uppercase text-[10px] tracking-widest pl-1">Código de Barras</label>
                    <input 
                      ref={barcodeInputRef}
                      type="text"
                      value={productForm.barcode || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProductForm({...productForm, barcode: val});
                        
                        // Auto-search if scanned barcode already exists
                        if (val && productMode === 'nuevo' && val.length >= 3) {
                          const existing = productsList.find(p => p.barcode === val);
                          if (existing) {
                            loadProductData(existing);
                            showMessage('Producto encontrado y cargado', 'info');
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          // Force a search on Enter if not already found in onChange
                          const barcode = productForm.barcode;
                          if (barcode) {
                            const existing = productsList.find(p => p.barcode === barcode || p.id.toString() === barcode);
                            if (existing) {
                              loadProductData(existing);
                              showMessage('Producto encontrado y cargado', 'info');
                              // Wait for state updates then focus description
                              setTimeout(() => descriptionInputRef.current?.focus(), 100);
                              return;
                            }
                          }
                          descriptionInputRef.current?.focus();
                        }
                      }}
                      className="flex-1 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 font-bold text-gray-700 outline-none focus:border-yellow-400 transition-colors"
                      placeholder="Escanee o escriba el código..."
                    />
                  </div>

                  {/* Descripción */}
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <label className="w-full md:w-48 font-black text-gray-700 uppercase text-[10px] tracking-widest pl-1">Descripción</label>
                    <input 
                      ref={descriptionInputRef}
                      type="text"
                      value={productForm.description || ''}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      className="flex-1 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 font-bold text-gray-700 outline-none focus:border-yellow-400 transition-colors"
                    />
                  </div>

                  {/* Se vende por */}
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <label className="w-full md:w-48 font-black text-gray-700 uppercase text-[10px] tracking-widest pl-1">Se vende</label>
                    <div className="flex flex-wrap gap-2 sm:gap-6">
                      {[
                        { id: 'unit', label: 'Por Unidad/Pza' },
                        { id: 'bulk', label: 'A Granel (Usa Decimales)' },
                        { id: 'kit', label: 'Como paquete (kit)' },
                        { id: 'weight', label: 'Venta por Peso (Báscula)' },
                      ].map((type) => (
                        <label key={type.id} className="flex items-center gap-2 cursor-pointer group bg-gray-50 p-2 rounded-lg border border-transparent hover:border-yellow-200 transition-all">
                          <input 
                            type="radio"
                            name="sellType"
                            checked={productForm.sellType === type.id}
                            onChange={() => setProductForm({...productForm, sellType: type.id})}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 focus:ring-yellow-400 border-gray-300"
                          />
                          <span className="font-bold text-gray-700 group-hover:text-yellow-600 transition-colors text-xs sm:text-sm">{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Precios */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    {[
                      { id: 'costPrice', label: 'Precio Costo' },
                      { id: 'sellPrice', label: 'Precio Venta' },
                      { id: 'wholesalePrice', label: 'Precio Mayoreo' },
                    ].map((price) => (
                      <div key={price.id} className="space-y-1 sm:space-y-2">
                        <label className="font-black text-gray-700 uppercase text-[10px] tracking-widest pl-1">{price.label}</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-700 font-black">$</span>
                          <input 
                            type="number"
                            value={productForm[price.id as keyof typeof productForm] !== undefined ? productForm[price.id as keyof typeof productForm] : ''}
                            onChange={(e) => setProductForm({...productForm, [price.id]: parseFloat(e.target.value) || 0})}
                            className="w-full bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 pl-8 font-bold text-gray-700 outline-none focus:border-yellow-400 transition-colors"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Departamento */}
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <label className="w-full md:w-48 font-black text-gray-700 uppercase text-[10px] tracking-widest pl-1">Departamento</label>
                    <div className="relative flex-1">
                      <select 
                        value={productForm.department}
                        onChange={(e) => setProductForm({...productForm, department: e.target.value})}
                        className="w-full bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 font-bold text-gray-700 outline-none focus:border-yellow-400 appearance-none transition-colors"
                      >
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-600 pointer-events-none" size={20} />
                    </div>
                  </div>
                  </div>
                </div>

                {/* Inventario Section */}
                  <div className="pt-8">
                    <div className="flex items-center gap-4 mb-6">
                      <h4 className="font-black text-gray-700 uppercase tracking-widest">Inventario</h4>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>
                    
                    <div className="space-y-6">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox"
                          checked={productForm.useInventory}
                          onChange={(e) => setProductForm({...productForm, useInventory: e.target.checked})}
                          className="w-6 h-6 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                        />
                        <span className="font-bold text-gray-700 group-hover:text-yellow-600 transition-colors">Este producto SI utiliza inventario.</span>
                      </label>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="font-bold text-gray-600">Cantidad Actual</label>
                          <div className="flex flex-col gap-2">
                            <input 
                              type="number"
                              disabled={!productForm.useInventory}
                              value={productForm.currentStock !== undefined ? productForm.currentStock : ''}
                              onChange={(e) => setProductForm({...productForm, currentStock: parseFloat(e.target.value) || 0})}
                              className={`w-full border-2 rounded-xl p-3 font-bold text-gray-700 outline-none transition-colors ${productForm.useInventory ? 'bg-yellow-50 border-yellow-200 focus:border-yellow-400' : 'bg-gray-100 border-gray-200 cursor-not-allowed'}`}
                            />
                            
                            {productMode === 'modificar' && productForm.useInventory && (
                              <div className="bg-white p-4 rounded-2xl border-2 border-yellow-200 shadow-sm mt-2">
                                <span className="text-[10px] font-black uppercase text-yellow-600 block mb-2 tracking-widest">Ajuste Rápido de Stock</span>
                                <div className="flex gap-2">
                                  <input 
                                    type="number"
                                    value={stockAdjustment || ''}
                                    onChange={(e) => setStockAdjustment(e.target.value)}
                                    placeholder="Cant."
                                    className="w-20 bg-gray-50 border-2 border-gray-200 rounded-lg p-2 font-black text-center text-sm outline-none focus:border-yellow-400 transition-colors"
                                  />
                                  <button 
                                    onClick={() => {
                                      const adj = parseFloat(stockAdjustment);
                                      if (isNaN(adj) || adj === 0) return;
                                      
                                      const newStock = productForm.currentStock + adj;
                                      
                                      // Update form
                                      setProductForm({ ...productForm, currentStock: newStock });
                                      
                                      // If we want to save immediately (as requested "independientemente"):
                                      if (editingProductId) {
                                        setProductsList(prev => prev.map(p => 
                                          p.id === editingProductId ? { ...p, stock: newStock } : p
                                        ));
                                        setStockAdjustment('');
                                        showMessage('Stock actualizado con éxito', 'success');
                                      }
                                    }}
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black text-[10px] uppercase rounded-lg shadow-[0_3px_0_0_rgba(21,128,61,1)] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1"
                                  >
                                    <Plus size={12} /> Sumar
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const adj = parseFloat(stockAdjustment);
                                      if (isNaN(adj) || adj === 0) return;
                                      
                                      const newStock = Math.max(0, productForm.currentStock - adj);
                                      
                                      // Update form
                                      setProductForm({ ...productForm, currentStock: newStock });
                                      
                                      // If we want to save immediately:
                                      if (editingProductId) {
                                        setProductsList(prev => prev.map(p => 
                                          p.id === editingProductId ? { ...p, stock: newStock } : p
                                        ));
                                        setStockAdjustment('');
                                        showMessage('Stock actualizado con éxito', 'success');
                                      }
                                    }}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black text-[10px] uppercase rounded-lg shadow-[0_3px_0_0_rgba(153,27,27,1)] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1"
                                  >
                                    <Trash2 size={12} /> Restar
                                  </button>
                                </div>
                                <p className="text-[9px] text-gray-400 font-bold mt-2 text-center italic">Esto actualiza el inventario inmediatamente.</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="font-bold text-gray-600">Mínimo</label>
                          <input 
                            type="number"
                            disabled={!productForm.useInventory}
                            value={productForm.minStock}
                            onChange={(e) => setProductForm({...productForm, minStock: parseFloat(e.target.value) || 0})}
                            className={`w-full border-2 rounded-xl p-3 font-bold text-gray-700 outline-none transition-colors ${productForm.useInventory ? 'bg-yellow-50 border-yellow-200 focus:border-yellow-400' : 'bg-gray-100 border-gray-200 cursor-not-allowed'}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                {/* Footer / Save Button */}
                <div className="mt-12 pt-8 border-t-2 border-gray-100 flex justify-center flex-col items-center gap-4">
                  <AnimatePresence>
                    {productSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-green-100 border-2 border-green-500 text-green-700 px-6 py-3 rounded-xl font-black flex items-center gap-2"
                      >
                        <CheckCircle size={20} />
                        PRODUCTO {productMode === 'nuevo' ? 'CREADO' : 'MODIFICADO'} CON ÉXITO
                      </motion.div>
                    )}
                    {productError && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-red-100 border-2 border-red-500 text-red-700 px-6 py-3 rounded-xl font-black flex items-center gap-2"
                      >
                        <AlertTriangle size={20} />
                        {productError}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex flex-wrap justify-center gap-4">
                    <button 
                      onClick={saveProduct}
                      className="bg-green-600 text-white px-12 py-5 rounded-2xl font-black text-2xl shadow-[0_8px_0_0_rgba(21,128,61,1)] active:translate-y-1 active:shadow-none transition-all flex items-center gap-3"
                    >
                      <Check size={28} /> GUARDAR PRODUCTO
                    </button>

                    {productMode === 'modificar' && editingProductId && (
                      <button 
                        onClick={() => {
                          if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
                            setProductsList(prev => prev.filter(p => p.id !== editingProductId));
                            setProductMode('nuevo');
                            setEditingProductId(null);
                            setProductForm({
                              barcode: '',
                              description: '',
                              sellType: 'unit',
                              costPrice: 0,
                              sellPrice: 0,
                              wholesalePrice: 0,
                              department: 'Sin Departamento',
                              useInventory: true,
                              currentStock: 0,
                              minStock: 0,
                              image: null
                            });
                          }
                        }}
                        className="bg-red-600 text-white px-12 py-5 rounded-2xl font-black text-2xl shadow-[0_8px_0_0_rgba(185,28,28,1)] active:translate-y-1 active:shadow-none transition-all flex items-center gap-3"
                      >
                        <Trash2 size={28} /> ELIMINAR PRODUCTO
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Inventory Summary */}
            <div className="bg-gray-50 border-t-4 border-yellow-400 p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-blue-100 flex items-center gap-4">
                  <div className="bg-blue-100 p-4 rounded-2xl text-blue-600">
                    <Package size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Total Productos</p>
                    <p className="text-3xl font-black text-gray-800">{inventoryStats.totalProducts}</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-red-100 flex items-center gap-4">
                  <div className="bg-red-100 p-4 rounded-2xl text-red-600">
                    <AlertTriangle size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Stock Bajo</p>
                    <p className="text-3xl font-black text-gray-800">{inventoryStats.lowStockCount}</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-green-100 flex items-center gap-4">
                  <div className="bg-green-100 p-4 rounded-2xl text-green-600">
                    <TrendingUp size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-green-400 uppercase tracking-widest leading-none mb-1">Valor Inventario</p>
                    <p className="text-3xl font-black text-gray-800">${inventoryStats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
          ) : currentView === 'promociones' ? (
            <motion.div
              key="promociones-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full bg-white rounded-[2.5rem] shadow-2xl border-4 border-yellow-400 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Star size={32} />
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">Promociones</h2>
                </div>
                <button 
                  onClick={() => setCurrentView('productos')}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Formulario de Nueva Promoción */}
                  <div className="bg-yellow-50 p-8 rounded-[2rem] border-2 border-yellow-200">
                    <h3 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
                      <Plus className="text-yellow-600" /> NUEVA PROMOCIÓN
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="font-black text-gray-700 uppercase text-xs tracking-widest">Título de la Promo</label>
                        <input 
                          type="text"
                          value={promoForm.title || ''}
                          onChange={(e) => setPromoForm({...promoForm, title: e.target.value})}
                          placeholder="Ej: Oferta de Verano"
                          className="w-full bg-white border-2 border-yellow-200 rounded-2xl p-4 font-bold text-gray-700 outline-none focus:border-yellow-400 transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="font-black text-gray-700 uppercase text-xs tracking-widest">Descripción</label>
                        <textarea 
                          value={promoForm.description || ''}
                          onChange={(e) => setPromoForm({...promoForm, description: e.target.value})}
                          placeholder="Detalles de la promoción..."
                          rows={3}
                          className="w-full bg-white border-2 border-yellow-200 rounded-2xl p-4 font-bold text-gray-700 outline-none focus:border-yellow-400 transition-colors resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="font-black text-gray-700 uppercase text-xs tracking-widest">Inicia</label>
                          <input 
                            type="date"
                            value={promoForm.startDate}
                            onChange={(e) => setPromoForm({...promoForm, startDate: e.target.value})}
                            className="w-full bg-white border-2 border-yellow-200 rounded-xl p-3 font-bold text-gray-700 outline-none focus:border-yellow-400 transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="font-black text-gray-700 uppercase text-xs tracking-widest">Finaliza</label>
                          <input 
                            type="date"
                            value={promoForm.endDate}
                            onChange={(e) => setPromoForm({...promoForm, endDate: e.target.value})}
                            className="w-full bg-white border-2 border-yellow-200 rounded-xl p-3 font-bold text-gray-700 outline-none focus:border-yellow-400 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="font-black text-gray-700 uppercase text-xs tracking-widest">Imagen de la Promo</label>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <label className="relative group cursor-pointer block">
                              <div className="bg-white border-2 border-dashed border-yellow-300 rounded-2xl p-4 text-center group-hover:border-yellow-500 transition-colors">
                                <div className="flex flex-col items-center gap-2">
                                  <Upload className="text-yellow-500" />
                                  <span className="text-sm font-bold text-gray-500">Subir Imagen</span>
                                </div>
                              </div>
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    optimizeImage(file, (dataUrl) => {
                                      setPromoForm({...promoForm, image: dataUrl});
                                      showMessage('Imagen de promo optimizada', 'success');
                                    });
                                  }
                                }}
                                className="hidden" 
                              />
                            </label>
                          </div>
                          {promoForm.image && (
                            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-yellow-400">
                              <img src={promoForm.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <button 
                                onClick={() => setPromoForm({...promoForm, image: null})}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          if (!promoForm.title) {
                            showMessage('El título es obligatorio', 'error');
                            return;
                          }
                          const newPromo: Promotion = {
                            ...promoForm,
                            id: Date.now()
                          };
                          setPromotionsList(prev => [...prev, newPromo]);
                          setPromoForm({
                            title: '',
                            description: '',
                            image: null,
                            startDate: new Date().toISOString().split('T')[0],
                            endDate: new Date().toISOString().split('T')[0],
                            active: true
                          });
                        }}
                        className="w-full bg-yellow-500 text-white py-4 rounded-2xl font-black text-xl shadow-[0_6px_0_0_rgba(202,138,4,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                      >
                        <Save size={24} /> GUARDAR PROMOCIÓN
                      </button>
                    </div>
                  </div>

                  {/* Listado de Promociones */}
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                      <ClipboardList className="text-orange-500" /> LISTADO DE PROMOS
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {promotionsList.length === 0 ? (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                          <Star size={48} className="text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-400 font-bold">No hay promociones activas</p>
                        </div>
                      ) : (
                        promotionsList.map((promo) => (
                          <motion.div 
                            layout
                            key={promo.id}
                            className="bg-white border-2 border-gray-100 rounded-[2rem] p-4 flex gap-4 group hover:border-yellow-200 transition-colors shadow-sm"
                          >
                            <div className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                              {promo.image ? (
                                <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <ImageIcon size={32} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h4 className="font-black text-gray-800 text-lg truncate">{promo.title}</h4>
                                <button 
                                  onClick={() => {
                                    setConfirmDialog({
                                      text: '¿Eliminar esta promoción?',
                                      onConfirm: () => {
                                        setPromotionsList(prev => prev.filter(p => p.id !== promo.id));
                                        showMessage('Promoción eliminada', 'success');
                                      }
                                    });
                                  }}
                                  className="text-red-300 hover:text-red-500 p-1 transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                              <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-2">{promo.description}</p>
                              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                                <div className="flex items-center gap-1 text-blue-500">
                                  <Calendar size={12} /> {promo.startDate}
                                </div>
                                <div className="text-gray-300">/</div>
                                <div className="flex items-center gap-1 text-red-500">
                                  <Calendar size={12} /> {promo.endDate}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : currentView === 'importar_productos' ? (
            <motion.div
              key="importar-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full bg-white rounded-[2.5rem] shadow-2xl border-4 border-blue-400 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <FileUp size={32} />
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">Importar Productos</h2>
                </div>
                <button 
                  onClick={() => setCurrentView('productos')}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-10">
                <div className="max-w-2xl mx-auto text-center space-y-8">
                  <div className="bg-blue-50 p-8 rounded-[2rem] border-2 border-blue-100">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileSpreadsheet size={40} className="text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-800 mb-2">Importación desde Excel</h3>
                    <p className="text-gray-500 font-medium mb-6">
                      Sube tu archivo de Excel con las columnas correspondientes para cargar tus productos de forma masiva.
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-left mb-8">
                      <div className="bg-white p-4 rounded-2xl border border-blue-100">
                        <h4 className="font-black text-blue-600 text-xs uppercase mb-2">Columnas Requeridas</h4>
                        <ul className="text-xs text-gray-600 space-y-1 font-bold">
                          <li>• Codigo (Barcode)</li>
                          <li>• Descripcion</li>
                          <li>• Precio</li>
                        </ul>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-blue-100">
                        <h4 className="font-black text-blue-600 text-xs uppercase mb-2">Columnas Opcionales</h4>
                        <ul className="text-xs text-gray-600 space-y-1 font-bold">
                          <li>• Costo, Mayoreo</li>
                          <li>• Departamento</li>
                          <li>• Existencia, Minimo</li>
                        </ul>
                      </div>
                    </div>

                    <label className="block">
                      <div className="bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-[0_8px_0_0_rgba(30,58,138,1)] active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-3">
                        <Upload size={24} /> SELECCIONAR ARCHIVO EXCEL
                      </div>
                      <input 
                        type="file" 
                        accept=".xlsx, .xls"
                        onChange={handleImportExcel}
                        className="hidden" 
                      />
                    </label>
                  </div>

                  {importStatus && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-6 rounded-2xl border-2 flex items-center gap-4 ${
                        importStatus.type === 'success' 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'bg-red-50 border-red-200 text-red-700'
                      }`}
                    >
                      {importStatus.type === 'success' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                      <div className="text-left">
                        <p className="font-black uppercase text-xs tracking-widest mb-1">
                          {importStatus.type === 'success' ? 'Éxito' : 'Error'}
                        </p>
                        <p className="font-bold">{importStatus.message}</p>
                      </div>
                      {importStatus.type === 'success' && (
                        <button 
                          onClick={() => setCurrentView('productos')}
                          className="ml-auto bg-green-600 text-white px-4 py-2 rounded-xl font-black text-sm"
                        >
                          VER PRODUCTOS
                        </button>
                      )}
                    </motion.div>
                  )}

                  <div className="pt-4">
                    <button 
                      onClick={() => {
                        const template = [
                          {
                            Codigo: '123456',
                            Descripcion: 'Producto Ejemplo',
                            Tipo: 'Unidad',
                            Costo: 50,
                            Precio: 100,
                            Mayoreo: 90,
                            Departamento: 'General',
                            Existencia: 100,
                            Minimo: 10
                          }
                        ];
                        const ws = XLSX.utils.json_to_sheet(template);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
                        XLSX.writeFile(wb, "Plantilla_Importacion_Productos.xlsx");
                      }}
                      className="text-blue-600 font-black text-sm uppercase tracking-widest hover:underline flex items-center justify-center gap-2 mx-auto"
                    >
                      <Download size={16} /> Descargar Plantilla de Ejemplo
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
        ) : currentView === 'clientes' ? (
          <motion.div
            key="clientes-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full bg-white rounded-[2.5rem] shadow-2xl border-4 border-red-600 overflow-hidden"
          >
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-800 p-6 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Users size={32} />
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">Gestión de Clientes</h2>
                </div>
                <button 
                  onClick={() => setCurrentView('ventas')}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Formulario */}
                  <div className="lg:col-span-1 bg-red-50 p-8 rounded-[2rem] border-2 border-red-100">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2 uppercase">
                        {editingCustomer ? <Edit2 className="text-red-600" /> : <Plus className="text-red-600" />}
                        {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                      </h3>
                      {editingCustomer && (
                        <button 
                          onClick={() => {
                            setEditingCustomer(null);
                            setCustomerForm({ name: '', phone: '', email: '', rnc: '', discountPercentage: 0, address: '' });
                          }}
                          className="text-red-500 font-black text-[10px] uppercase hover:underline"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="font-black text-gray-700 uppercase text-[10px] tracking-widest">Nombre Completo</label>
                        <input 
                          type="text"
                          value={customerForm.name || ''}
                          onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                          placeholder="Juan Pérez"
                          className="w-full bg-white border-2 border-red-100 rounded-xl p-3 font-bold text-gray-700 outline-none focus:border-red-400 transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-black text-gray-700 uppercase text-[10px] tracking-widest">Teléfono</label>
                        <input 
                          type="text"
                          value={customerForm.phone || ''}
                          onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                          placeholder="809-000-0000"
                          className="w-full bg-white border-2 border-red-100 rounded-xl p-3 font-bold text-gray-700 outline-none focus:border-red-400 transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-black text-gray-700 uppercase text-[10px] tracking-widest">Email</label>
                        <input 
                          type="email"
                          value={customerForm.email || ''}
                          onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                          placeholder="juan@ejemplo.com"
                          className="w-full bg-white border-2 border-red-100 rounded-xl p-3 font-bold text-gray-700 outline-none focus:border-red-400 transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-black text-gray-700 uppercase text-[10px] tracking-widest">RNC (Opcional)</label>
                        <input 
                          type="text"
                          value={customerForm.rnc || ''}
                          onChange={(e) => setCustomerForm({...customerForm, rnc: e.target.value})}
                          placeholder="131-XXXXX-X"
                          className="w-full bg-white border-2 border-red-100 rounded-xl p-3 font-bold text-gray-700 outline-none focus:border-red-400 transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-black text-gray-700 uppercase text-[10px] tracking-widest">Descuento Preferencial (%)</label>
                        <div className="relative">
                          <input 
                            type="number"
                            value={customerForm.discountPercentage || ''}
                            onChange={(e) => setCustomerForm({...customerForm, discountPercentage: Math.max(0, parseFloat(e.target.value) || 0)})}
                            placeholder="0"
                            className="w-full bg-white border-2 border-red-100 rounded-xl p-3 font-bold text-gray-700 outline-none focus:border-red-400 transition-colors"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-red-300">%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="font-black text-gray-700 uppercase text-[10px] tracking-widest">Dirección</label>
                        <textarea 
                          value={customerForm.address || ''}
                          onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})}
                          placeholder="Calle Principal #123..."
                          rows={2}
                          className="w-full bg-white border-2 border-red-100 rounded-xl p-3 font-bold text-gray-700 outline-none focus:border-red-400 transition-colors resize-none"
                        />
                      </div>

                      <button 
                        onClick={() => {
                          if (!customerForm.name) {
                            showMessage('El nombre es obligatorio', 'error');
                            return;
                          }
                          
                          if (editingCustomer) {
                            const updatedCustomer = { ...editingCustomer, ...customerForm };
                            setCustomersList(prev => prev.map(c => 
                              c.id === editingCustomer.id ? updatedCustomer : c
                            ));
                            cloudSync.saveCustomer(updatedCustomer);
                            setEditingCustomer(null);
                            showMessage('Cliente actualizado con éxito', 'success');
                          } else {
                            const newCustomer: Customer = {
                              id: Date.now(),
                              ...customerForm,
                              points: 0,
                              balance: 0,
                              createdAt: new Date().toISOString()
                            };
                            setCustomersList(prev => [...prev, newCustomer]);
                            cloudSync.saveCustomer(newCustomer);
                            showMessage('Cliente registrado con éxito', 'success');
                          }
                          setCustomerForm({ name: '', phone: '', email: '', rnc: '', discountPercentage: 0, address: '' });
                        }}
                        className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-lg shadow-[0_4px_0_0_rgba(153,27,27,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 mt-4"
                      >
                        <Save size={20} /> {editingCustomer ? 'GUARDAR CAMBIOS' : 'REGISTRAR CLIENTE'}
                      </button>
                    </div>
                  </div>

                  {/* Listado */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2 uppercase">
                        <ClipboardList className="text-red-600" /> Cartera de Clientes
                      </h3>
                      <span className="bg-red-100 text-red-700 px-4 py-1 rounded-full font-black text-xs">
                        {customersList.length} CLIENTES
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {customersList.length === 0 ? (
                        <div className="col-span-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                          <Users size={48} className="text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-400 font-bold italic">No hay clientes registrados aún</p>
                        </div>
                      ) : (
                        customersList.map((customer) => (
                          <motion.div 
                            layout
                            key={customer.id}
                            className="bg-white border-2 border-gray-100 rounded-3xl p-5 hover:border-red-200 transition-colors shadow-sm group relative"
                          >
                            <div className="absolute top-4 right-4 flex gap-2">
                              <button 
                                onClick={() => {
                                  setEditingCustomer(customer);
                                  setCustomerForm({
                                    name: customer.name,
                                    phone: customer.phone,
                                    email: customer.email,
                                    rnc: customer.rnc || '',
                                    discountPercentage: customer.discountPercentage || 0,
                                    address: customer.address
                                  });
                                  // Scroll to top of form on mobile
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="text-gray-300 hover:text-blue-500 transition-colors"
                                title="Editar Cliente"
                              >
                                <Pencil size={18} />
                              </button>
                              <button 
                                onClick={() => {
                                  setConfirmDialog({
                                    text: '¿Eliminar este cliente?',
                                    onConfirm: () => {
                                      setCustomersList(prev => prev.filter(c => c.id !== customer.id));
                                      if (editingCustomer?.id === customer.id) {
                                        setEditingCustomer(null);
                                        setCustomerForm({ name: '', phone: '', email: '', rnc: '', discountPercentage: 0, address: '' });
                                      }
                                      showMessage('Cliente eliminado', 'success');
                                    }
                                  });
                                }}
                                className="text-gray-300 hover:text-red-500 transition-colors"
                                title="Eliminar Cliente"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                                <User size={24} />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-black text-gray-800 truncate pr-8">{customer.name}</h4>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">ID: {customer.id}</p>
                              </div>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                <ArrowRight size={14} className="text-red-400" />
                                <span>{customer.phone || 'Sin teléfono'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                <ArrowRight size={14} className="text-red-400" />
                                <span className="truncate">{customer.email || 'Sin email'}</span>
                              </div>
                              {customer.rnc && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                  <ArrowRight size={14} className="text-red-400" />
                                  <span className="font-black">RNC: {customer.rnc}</span>
                                </div>
                              )}
                              {customer.discountPercentage && customer.discountPercentage > 0 && (
                                <div className="flex items-center gap-2 text-sm text-green-600 font-black">
                                  <Star size={14} className="text-green-500 fill-green-500" />
                                  <span>DESC. PREFERENCIAL: {customer.discountPercentage}%</span>
                                </div>
                              )}
                            </div>

                            <div className="pt-4 border-t border-gray-50 flex flex-col gap-3">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1">
                                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                  <span className="text-xs font-black text-gray-700">{customer.points} Puntos</span>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${customer.balance > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                  Saldo: ${customer.balance?.toFixed(2) || '0.00'}
                                </div>
                              </div>
                              
                              {customer.balance > 0 && (
                                <button 
                                  onClick={() => {
                                    showMessage('Para registrar un abono, por favor contacte al administrador.', 'info');
                                  }}
                                  className="w-full bg-green-600 text-white py-2 rounded-xl font-black text-xs hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                >
                                  <Banknote size={14} /> REGISTRAR ABONO
                                </button>
                              )}
                              
                              <div className="text-center">
                                <span className="text-[10px] font-bold text-gray-300 italic">
                                  Registrado: {new Date(customer.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : currentView === 'ventas_periodo' ? (
            <motion.div
              key="ventas-periodo-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full bg-white rounded-[2.5rem] shadow-2xl border-4 border-yellow-400 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <BarChart3 size={32} />
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">Ventas por Periodo</h2>
                </div>
                <button 
                  onClick={() => setCurrentView('productos')}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8">
                {/* Filtros */}
                <div className="bg-yellow-50 p-6 rounded-3xl border-2 border-yellow-200 mb-8 flex flex-col md:flex-row items-end gap-6">
                  <div className="flex-1 space-y-2">
                    <label className="font-black text-gray-700 uppercase text-xs tracking-widest">Fecha Inicio</label>
                    <input 
                      type="date"
                      value={salesStartDate}
                      onChange={(e) => setSalesStartDate(e.target.value)}
                      className="w-full bg-white border-2 border-yellow-200 rounded-xl p-3 font-bold text-gray-700 outline-none focus:border-yellow-400 transition-colors"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="font-black text-gray-700 uppercase text-xs tracking-widest">Fecha Fin</label>
                    <input 
                      type="date"
                      value={salesEndDate}
                      onChange={(e) => setSalesEndDate(e.target.value)}
                      className="w-full bg-white border-2 border-yellow-200 rounded-xl p-3 font-bold text-gray-700 outline-none focus:border-yellow-400 transition-colors"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        const filteredSales = salesHistory.filter((sale: any) => {
                          const saleDate = sale.date.split('T')[0];
                          return saleDate >= salesStartDate && saleDate <= salesEndDate;
                        });

                        if (filteredSales.length === 0) {
                          showMessage('No hay ventas en este periodo', 'info');
                          return;
                        }

                        const worksheet = XLSX.utils.json_to_sheet(filteredSales.map((s: any) => ({
                          ID: s.id,
                          Fecha: s.date,
                          Subtotal: s.subtotal || s.total,
                          Propina: s.tipAmount || 0,
                          Total: s.total,
                          Metodo: s.paymentMethod,
                          Cliente: customersList.find(c => c.id === s.customerId)?.name || 'Venta Mostrador',
                          Items: s.items.map((i: any) => `${i.name} (x${i.quantity})`).join(', ')
                        })));
                        const workbook = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");
                        XLSX.writeFile(workbook, `Reporte_Ventas_${salesStartDate}_a_${salesEndDate}.xlsx`);
                      }}
                      className="bg-green-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-green-700 transition-colors shadow-lg"
                    >
                      <FileUp size={20} /> EXCEL
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg"
                    >
                      <Printer size={20} /> IMPRIMIR
                    </button>
                  </div>
                </div>

                {/* Tabla de Resultados */}
                <div className="overflow-x-auto rounded-3xl border-2 border-gray-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-widest font-black">
                        <th className="p-4">ID Venta</th>
                        <th className="p-4">Fecha / Hora</th>
                        <th className="p-4">Productos</th>
                        <th className="p-4">Cliente</th>
                        <th className="p-4">Propina</th>
                        <th className="p-4">Método</th>
                        <th className="p-4 text-right">Total</th>
                        <th className="p-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {salesHistory
                        .filter((sale: any) => {
                          const saleDate = sale.date.split('T')[0];
                          return saleDate >= salesStartDate && saleDate <= salesEndDate;
                        })
                        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((sale: any) => (
                          <tr key={sale.id} className="hover:bg-yellow-50 transition-colors group">
                            <td className="p-4 font-mono text-xs text-gray-400">#{sale.id.toString().slice(-6)}</td>
                            <td className="p-4">
                              <div className="font-bold text-gray-700">{new Date(sale.date).toLocaleDateString()}</div>
                              <div className="text-xs text-gray-400">{new Date(sale.date).toLocaleTimeString()}</div>
                            </td>
                            <td className="p-4">
                              <div className="max-w-xs truncate font-medium text-gray-600">
                                {sale.items.map((i: any) => i.name).join(', ')}
                              </div>
                              <div className="text-xs text-gray-400">{sale.items.length} artículos</div>
                              {sale.note && (
                                <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md w-fit border border-yellow-100 italic">
                                  <FileText size={10} /> {sale.note}
                                </div>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-gray-700 uppercase text-xs">
                                {customersList.find(c => c.id === sale.customerId)?.name || 'Mostrador'}
                              </div>
                              {customersList.find(c => c.id === sale.customerId)?.rnc && (
                                <div className="text-[10px] text-gray-400">RNC: {customersList.find(c => c.id === sale.customerId)?.rnc}</div>
                              )}
                            </td>
                            <td className="p-4">
                              {sale.tipAmount > 0 ? (
                                <div className="text-xs font-bold text-yellow-600">+${sale.tipAmount.toFixed(2)}</div>
                              ) : (
                                <span className="text-gray-300 text-xs">-</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                (sale.paymentMethod || sale.method) === 'efectivo' ? 'bg-green-100 text-green-700' : 
                                (sale.paymentMethod || sale.method) === 'tarjeta' ? 'bg-blue-100 text-blue-700' :
                                (sale.paymentMethod || sale.method) === 'transferencia' ? 'bg-purple-100 text-purple-700' :
                                (sale.paymentMethod || sale.method) === 'dolares' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {sale.paymentMethod || sale.method}
                              </span>
                              {sale.transferInfo && (
                                <div className="text-[9px] font-bold text-purple-600 mt-1 uppercase italic leading-tight">
                                  {sale.transferInfo.bank}
                                  {sale.transferInfo.reference && ` | Ref: ${sale.transferInfo.reference}`}
                                </div>
                              )}
                              {sale.cardInfo && (
                                <div className="text-[9px] font-bold text-blue-600 mt-1 uppercase italic leading-tight">
                                  Ref: {sale.cardInfo.reference}
                                </div>
                              )}
                              {sale.usdInfo && (
                                <div className="text-[9px] font-bold text-emerald-600 mt-1 italic leading-tight">
                                  Tasa: {sale.usdInfo.rate.toFixed(2)} | Recibido: ${sale.usdInfo.received.toFixed(2)} USD
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-right font-black text-gray-800 text-lg">
                              ${sale.total.toFixed(2)}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleSendWhatsApp(sale)}
                                  className="text-gray-400 hover:text-green-600 transition-colors p-2"
                                  title="Enviar por WhatsApp"
                                >
                                  <MessageCircle size={18} />
                                </button>
                                <button 
                                  onClick={() => handlePrintReceipt(sale)}
                                  className="text-gray-400 hover:text-blue-600 transition-colors p-2"
                                  title="Re-imprimir Ticket"
                                >
                                  <Printer size={18} />
                                </button>
                                <button 
                                  onClick={() => {
                                    setEditingSale(sale);
                                    setSaleEditForm({
                                      paymentMethod: sale.paymentMethod || sale.method || 'efectivo',
                                      notes: sale.notes || ''
                                    });
                                  }}
                                  className="text-gray-400 hover:text-orange-600 transition-colors p-2"
                                  title="Editar Detalles"
                                >
                                  <Edit2 size={18} />
                                </button>
                                {(currentUser?.role === 'admin' || currentUser?.permissions.canDeleteSales) && (
                                  <button 
                                    onClick={() => {
                                      setConfirmDialog({
                                        text: '¿Está seguro de que desea anular esta venta? Esta acción no se puede deshacer.',
                                        onConfirm: () => {
                                          setSalesHistory(prev => prev.filter(s => s.id !== sale.id));
                                          showMessage('Venta anulada correctamente', 'success');
                                        }
                                      });
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                    title="Anular Venta"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Resumen */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gray-50 p-6 rounded-3xl border-2 border-gray-100">
                    <div className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Total Ventas</div>
                    <div className="text-3xl font-black text-gray-800">
                      {salesHistory.filter((sale: any) => {
                        const saleDate = sale.date.split('T')[0];
                        return saleDate >= salesStartDate && saleDate <= salesEndDate;
                      }).length}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-3xl border-2 border-gray-100">
                    <div className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Total Propinas</div>
                    <div className="text-3xl font-black text-yellow-600">
                      ${salesHistory.filter((sale: any) => {
                        const saleDate = sale.date.split('T')[0];
                        return saleDate >= salesStartDate && saleDate <= salesEndDate;
                      }).reduce((acc: number, sale: any) => acc + (sale.tipAmount || 0), 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-3xl border-2 border-gray-100">
                    <div className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Monto Total</div>
                    <div className="text-3xl font-black text-green-600">
                      ${salesHistory.filter((sale: any) => {
                        const saleDate = sale.date.split('T')[0];
                        return saleDate >= salesStartDate && saleDate <= salesEndDate;
                      }).reduce((acc: number, sale: any) => acc + sale.total, 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-yellow-500 p-6 rounded-3xl border-2 border-yellow-600 shadow-lg">
                    <div className="text-yellow-100 text-xs font-black uppercase tracking-widest mb-2">Promedio por Venta</div>
                    <div className="text-3xl font-black text-white">
                      ${(salesHistory.filter((sale: any) => {
                        const saleDate = sale.date.split('T')[0];
                        return saleDate >= salesStartDate && saleDate <= salesEndDate;
                      }).reduce((acc: number, sale: any) => acc + sale.total, 0) / 
                      (salesHistory.filter((sale: any) => {
                        const saleDate = sale.date.split('T')[0];
                        return saleDate >= salesStartDate && saleDate <= salesEndDate;
                      }).length || 1)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : currentView === 'corte' ? (
            <motion.div
              key="corte-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full bg-white rounded-[2.5rem] shadow-2xl border-4 border-yellow-400 p-8 min-h-[500px] sm:min-h-[600px] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-6 sm:mb-8 bg-gray-50 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-gray-100">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="bg-yellow-400 p-3 sm:p-4 rounded-2xl text-white shadow-lg shrink-0">
                    <Calculator className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-4xl font-black text-gray-800 uppercase italic tracking-tighter leading-none">Corte de Caja</h2>
                    <p className="text-gray-400 font-bold uppercase text-[8px] sm:text-[10px] tracking-widest mt-1">Cuadre diario de ingresos</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full md:w-auto no-print">
                  <div className="flex-1 min-w-[140px] md:w-48 bg-white border-2 border-yellow-200 rounded-xl p-2 px-3 sm:px-4 shadow-sm">
                    <label className="block text-[8px] font-black text-yellow-600 uppercase tracking-widest leading-none mb-1">Fecha del Corte</label>
                    <input 
                      type="date"
                      value={corteDate}
                      onChange={(e) => setCorteDate(e.target.value)}
                      className="w-full bg-transparent font-black text-sm sm:text-base text-gray-700 outline-none"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => {
                        window.print();
                      }}
                      className="flex-1 sm:flex-none bg-blue-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-[0_4px_0_0_rgba(29,78,216,1)] active:translate-y-1 active:shadow-none text-xs sm:text-base"
                    >
                      <Printer size={18} /> <span className="hidden xs:inline">IMPRIMIR</span>
                    </button>
                    <button 
                      onClick={() => {
                        setConfirmDialog({
                          text: '¿Deseas finalizar el día y generar un respaldo automático en la carpeta RESPALDOS del servidor?',
                          onConfirm: () => {
                            handleAutoBackup();
                            setCurrentView('ventas');
                          }
                        });
                      }}
                      className="flex-1 sm:flex-none bg-purple-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-[0_4px_0_0_rgba(126,34,206,1)] active:translate-y-1 active:shadow-none text-xs sm:text-base"
                    >
                      <Save size={18} /> <span className="hidden xs:inline">FINALIZAR</span>
                    </button>
                    <button 
                      onClick={() => setCurrentView('ventas')}
                      className="bg-gray-200 text-gray-600 p-3 sm:p-4 rounded-xl hover:bg-gray-300 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-8 overflow-y-auto pr-2 custom-scrollbar">
                {/* Resumen de Valores */}
                <div className="xl:col-span-2 space-y-8">
                  
                  {/* Cards de Resumen */}
                  <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                    <div className="bg-white p-2 sm:p-3 rounded-2xl sm:rounded-3xl border-2 border-gray-100 shadow-sm group hover:border-yellow-400 transition-all">
                      <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fondo Inicial</p>
                      <div className="relative group">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 font-black text-gray-300 group-focus-within:text-yellow-600 transition-colors">$</span>
                        <input 
                          type="number"
                          value={initialCash}
                          onChange={(e) => setInitialCash(parseFloat(e.target.value) || 0)}
                          className="w-full pl-4 bg-transparent font-black text-lg sm:text-2xl text-gray-800 outline-none focus:text-yellow-600 transition-colors border-b-2 border-transparent focus:border-yellow-200"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-[7px] sm:text-[8px] font-bold text-gray-300 uppercase mt-1">Efectivo en base</p>
                    </div>
                    <div className="bg-green-50 p-2 sm:p-3 rounded-2xl sm:rounded-3xl border-2 border-green-200 shadow-sm relative overflow-hidden">
                      <p className="text-[8px] sm:text-[10px] font-black text-green-600 uppercase tracking-widest mb-1 truncate" title="Efectivo Neto">Efectivo Neto</p>
                      <p className="text-lg md:text-2xl font-black text-green-700 truncate" title={`$${dailySummary.cash.toFixed(2)}`}>
                        ${dailySummary.cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[8px] sm:text-[9px] font-bold text-green-500 uppercase mt-1 flex items-center gap-1 truncate">
                        <ArrowUpCircle size={10} /> Ingresos - Gastos
                      </p>
                    </div>
                    <div className="bg-blue-50 p-2 sm:p-3 rounded-2xl sm:rounded-3xl border-2 border-blue-200 shadow-sm">
                      <p className="text-[8px] sm:text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 truncate" title="Bancos / Tarjetas">Bancos / Tarjetas</p>
                      <p className="text-lg md:text-2xl font-black text-blue-700 truncate" title={`$${(dailySummary.card + dailySummary.transfer).toFixed(2)}`}>
                        ${(dailySummary.card + dailySummary.transfer).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[8px] sm:text-[9px] font-bold text-blue-400 uppercase mt-1 truncate">No físico en caja</p>
                    </div>
                    <div className="bg-emerald-50 p-2 sm:p-3 rounded-2xl sm:rounded-3xl border-2 border-emerald-200 shadow-sm relative overflow-hidden">
                      <p className="text-[8px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 truncate" title="Ventas USD">Ventas USD</p>
                      <p className="text-lg md:text-2xl font-black text-emerald-700 truncate" title={`$${dailySummary.dolares.toFixed(2)}`}>
                        ${dailySummary.dolares.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[8px] sm:text-[9px] font-bold text-emerald-500 uppercase truncate">Equiv. en Pesos</span>
                      <DollarSign className="absolute -right-2 -bottom-2 text-emerald-100 w-12 h-12 sm:w-16 sm:h-16 rotate-12 opacity-50" />
                    </div>
                    <div className="bg-red-50 p-2 sm:p-3 rounded-2xl sm:rounded-3xl border-2 border-red-200 shadow-sm">
                      <p className="text-[8px] sm:text-[10px] font-black text-red-600 uppercase tracking-widest mb-1 truncate" title="Total Gastos">Total Gastos</p>
                      <p className="text-lg md:text-2xl font-black text-red-700 truncate" title={`-$${dailySummary.expenses.toFixed(2)}`}>
                        -${dailySummary.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[8px] sm:text-[9px] font-bold text-red-400 uppercase mt-1 truncate">Salidas registradas</p>
                    </div>
                    <div className="bg-yellow-400 p-2 sm:p-3 rounded-2xl sm:rounded-3xl shadow-xl shadow-yellow-100 relative overflow-hidden border-2 sm:border-4 border-white transform hover:scale-105 transition-transform">
                      <p className="text-[8px] sm:text-[10px] font-black text-yellow-900 uppercase tracking-widest mb-1 relative z-10 truncate" title="Balance de Caja">Balance de Caja</p>
                      <p className="text-xl md:text-2xl font-black text-red-700 relative z-10 leading-none truncate" title={`$${(initialCash + dailySummary.cash + dailySummary.dolares).toFixed(2)}`}>
                        ${(initialCash + dailySummary.cash + dailySummary.dolares).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[8px] sm:text-[9px] font-black text-red-800 uppercase mt-2 relative z-10 opacity-60 truncate">Total esperado</p>
                      <Zap className="absolute -right-4 -bottom-4 text-white/40 w-16 h-16 sm:w-24 sm:h-24 rotate-12" />
                    </div>
                  </div>

                  {/* Panel de Ganancias */}
                  <div className="bg-white rounded-[2rem] border-2 border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                        <TrendingUp size={20} />
                      </div>
                      <h3 className="font-black text-gray-700 uppercase tracking-widest text-xs">Reporte de Ganancias (Beneficio Neto)</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {[
                        { label: 'Hoy', val: profitStats.diario, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: '7 Días', val: profitStats.semanal, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: '15 Días', val: profitStats.quincenal, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Mensual', val: profitStats.mensual, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Anual', val: profitStats.anual, color: 'text-orange-600', bg: 'bg-orange-50' },
                      ].map((stat, i) => (
                        <div key={i} className={`${stat.bg} p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-transparent hover:border-gray-200 transition-all text-center min-w-0`}>
                          <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">{stat.label}</p>
                          <p className={`text-sm sm:text-lg md:text-xl font-black ${stat.color} truncate`} title={`$${stat.val.toFixed(2)}`}>
                            ${stat.val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-[9px] font-bold text-gray-400 uppercase italic opacity-60">
                      * El cálculo se basa en la diferencia entre el precio de venta y el costo de compra, menos descuentos aplicados.
                    </p>
                  </div>

                  {/* Listado de Movimientos del Día */}
                  <div className="bg-white rounded-[2rem] border-2 border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b-2 border-gray-100 flex justify-between items-center">
                      <h3 className="font-black text-gray-700 uppercase tracking-widest text-xs">Movimientos del Día</h3>
                      <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-gray-400 border border-gray-200 uppercase">
                        {dailyTransactions.length} Transacciones
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 sticky top-0 bg-white z-10">
                            <th className="p-4">Hora</th>
                            <th className="p-4">Tipo / Concepto</th>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">Método</th>
                            <th className="p-4 text-right">Monto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {dailyTransactions.length > 0 ? dailyTransactions.map((tx: any) => (
                            <tr key={`${tx.type}-${tx.id}`} className="hover:bg-gray-50 transition-colors">
                              <td className="p-4 text-xs font-bold text-gray-400">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                              <td className="p-4">
                                <div className="font-black text-gray-700 text-sm truncate max-w-[120px]" title={tx.type}>{tx.type}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight truncate max-w-[120px]" title={tx.note}>{tx.note}</div>
                              </td>
                              <td className="p-4 font-bold text-xs text-gray-600 uppercase truncate max-w-[100px]" title={tx.customer}>{tx.customer}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                                  tx.method === 'efectivo' ? 'bg-green-100 text-green-700' : 
                                  tx.method === 'tarjeta' ? 'bg-blue-100 text-blue-700' : 
                                  tx.method === 'transferencia' ? 'bg-purple-100 text-purple-700' :
                                  'bg-orange-100 text-orange-700'
                                }`}>
                                  {tx.method}
                                </span>
                                {tx.transferInfo && (
                                  <div className="text-[8px] font-bold text-purple-600 mt-0.5 italic leading-none truncate max-w-[100px]">
                                    {tx.transferInfo.bank} | {tx.transferInfo.reference}
                                  </div>
                                )}
                                {tx.cardInfo && (
                                  <div className="text-[8px] font-bold text-blue-600 mt-0.5 italic leading-none truncate max-w-[100px]">
                                    Ref: {tx.cardInfo.reference}
                                  </div>
                                )}
                              </td>
                              <td className="p-4 text-right font-black">
                                <span className={tx.isExpense ? 'text-red-600' : 'text-gray-800'}>
                                  {tx.isExpense ? '-' : ''}${tx.amount.toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={5} className="p-12 text-center py-20">
                                <div className="opacity-10 grayscale flex flex-col items-center">
                                  <History size={64} className="mb-4" />
                                  <p className="font-black uppercase tracking-widest">Sin actividad este día</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Columna 3: Calculadora de Denominaciones */}
                <div className="space-y-6">
                  <div className="bg-gray-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="bg-white/10 p-3 rounded-2xl text-yellow-400 shadow-lg">
                          <Barcode size={24} />
                        </div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter">Desglose de Efectivo</h3>
                      </div>

                      <div className="space-y-2 mb-8 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {[
                          { val: 2000, label: 'RD$ 2,000' },
                          { val: 1000, label: 'RD$ 1,000' },
                          { val: 500, label: 'RD$ 500' },
                          { val: 200, label: 'RD$ 200' },
                          { val: 100, label: 'RD$ 100' },
                          { val: 50, label: 'RD$ 50' },
                          { val: 25, label: 'RD$ 25 (M)' },
                          { val: 10, label: 'RD$ 10 (M)' },
                          { val: 5, label: 'RD$ 5 (M)' },
                          { val: 1, label: 'RD$ 1 (M)' },
                        ].map(den => (
                          <div key={den.val} className="flex items-center gap-4 group">
                            <span className="w-20 font-black text-gray-400 text-[10px] uppercase truncate" title={den.label}>{den.label}</span>
                            <div className="flex-1 flex gap-2 min-w-0">
                              <input 
                                type="number"
                                min="0"
                                value={cashDenominations[den.val.toString()] || ''}
                                onChange={(e) => setCashDenominations({
                                  ...cashDenominations,
                                  [den.val.toString()]: parseInt(e.target.value) || 0
                                })}
                                placeholder="0"
                                className="w-full bg-white/10 border-2 border-white/10 rounded-xl p-2 px-4 font-black transition-all focus:border-yellow-400 focus:bg-white/20 outline-none text-sm"
                              />
                            </div>
                            <span className="w-28 text-right font-black text-yellow-400 text-sm truncate" title={`$${((cashDenominations[den.val.toString()] || 0) * den.val).toFixed(2)}`}>
                              ${((cashDenominations[den.val.toString()] || 0) * den.val).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-6 border-t-2 border-white/10 space-y-4">
                        <div className="flex justify-between items-center text-lg gap-4">
                          <span className="font-bold text-gray-400 uppercase text-xs tracking-widest whitespace-nowrap">Total Contado</span>
                          <span className="text-2xl md:text-3xl font-black text-white truncate" title={`$${countedCash.toFixed(2)}`}>
                            ${countedCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-4">
                          <span className="font-bold text-gray-400 uppercase text-xs tracking-widest whitespace-nowrap">Diferencia</span>
                          {(() => {
                            const diff = countedCash - (initialCash + dailySummary.cash);
                            return (
                              <span className={`text-xl md:text-2xl font-black truncate ${diff >= 0 ? (diff === 0 ? 'text-blue-400' : 'text-green-400') : 'text-red-500'}`} title={`$${diff.toFixed(2)}`}>
                                {diff > 0 ? '+' : ''}{diff.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            );
                          })()}
                        </div>
                        
                        {countedCash !== (initialCash + dailySummary.cash) && (
                          <div className={`p-4 rounded-2xl font-black text-[10px] uppercase text-center flex items-center justify-center gap-2 ${
                            (countedCash - (initialCash + dailySummary.cash)) > 0 
                              ? 'bg-green-400/20 text-green-400 border border-green-400/30' 
                              : 'bg-red-500/20 text-red-500 border border-red-500/30'
                          }`}>
                            <AlertTriangle size={14} />
                            {(countedCash - (initialCash + dailySummary.cash)) > 0 ? 'Sobran fondos en caja' : 'Faltan fondos en caja'}
                          </div>
                        )}

                        <button 
                          onClick={() => {
                            setCashDenominations({
                              '2000': 0, '1000': 0, '500': 0, '200': 0, '100': 0, '50': 0, '25': 0, '10': 0, '5': 0, '1': 0
                            });
                          }}
                          className="w-full bg-white/5 border-2 border-white/10 hover:bg-white/10 text-white/50 py-3 rounded-xl font-black text-xs transition-all uppercase tracking-widest no-print"
                        >
                          Reiniciar Calculadora
                        </button>
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : currentView === 'financiamiento' ? (
            <motion.div
              key="financiamiento-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full bg-white rounded-[2.5rem] shadow-2xl border-4 border-yellow-400 overflow-hidden min-h-[500px] sm:min-h-[700px] flex flex-col"
            >
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-8 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Gestión de Financiamientos</h2>
                  <p className="font-bold opacity-80">Seguimiento de cuotas y pagos pendientes</p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30 text-center min-w-[150px]">
                    <span className="text-[10px] font-black uppercase block opacity-70">Por Cobrar Total</span>
                    <span className="text-2xl font-black">${financingsList.reduce((acc, f) => acc + f.remainingAmount, 0).toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => setCurrentView('ventas')}
                    className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors self-start"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col overflow-hidden">
                {!selectedFinancingId ? (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
                      {/* Lado Izquierdo: Listado y Filtros */}
                      <div className="flex-1 flex flex-col min-h-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                          <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100 flex items-center gap-4">
                              <div className="p-4 bg-blue-100 rounded-2xl text-blue-600"><ClipboardList size={32} /></div>
                              <div>
                                <span className="text-[10px] font-black uppercase text-blue-400">Total Activos</span>
                                <div className="text-3xl font-black text-blue-700">{financingsList.filter(f => f.status === 'activo').length}</div>
                              </div>
                          </div>
                          <div className="bg-red-50 p-6 rounded-3xl border-2 border-red-100 flex items-center gap-4">
                              <div className="p-4 bg-red-100 rounded-2xl text-red-600"><AlertTriangle size={32} /></div>
                              <div>
                                <span className="text-[10px] font-black uppercase text-red-400">En Atraso</span>
                                <div className="text-3xl font-black text-red-700">{financingsList.filter(f => f.status === 'atrasado').length}</div>
                              </div>
                          </div>
                          <div className="bg-green-50 p-6 rounded-3xl border-2 border-green-100 flex items-center gap-4">
                              <div className="p-4 bg-green-100 rounded-2xl text-green-600"><CheckCircle2 size={32} /></div>
                              <div>
                                <span className="text-[10px] font-black uppercase text-green-400">Completados</span>
                                <div className="text-3xl font-black text-green-700">{financingsList.filter(f => f.status === 'completado').length}</div>
                              </div>
                          </div>
                        </div>

                        <div className="flex-1 bg-gray-50 rounded-3xl border-2 border-gray-100 overflow-hidden flex flex-col min-h-0">
                          <div className="bg-white p-4 border-b-2 border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
                            <div className="flex flex-col gap-1 w-full sm:w-1/2">
                              <h3 className="font-black text-gray-400 uppercase text-[9px] tracking-widest">Filtrar por Cliente</h3>
                              <CustomerSearchSelect 
                                customers={customersList}
                                value={financingCustomerFilter}
                                onChange={setFinancingCustomerFilter}
                                placeholder="Todos los clientes"
                                colorScheme="yellow"
                                className="w-full"
                              />
                            </div>
                            <div className="flex flex-col gap-1 items-end w-full sm:w-auto">
                              <h3 className="font-black text-gray-400 uppercase text-[9px] tracking-widest">Estado</h3>
                              <div className="flex bg-gray-100 p-1 rounded-xl gap-1 overflow-x-auto w-full sm:w-auto">
                                {(['todos', 'activo', 'atrasado', 'completado'] as const).map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => setFinancingStatusFilter(status)}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all whitespace-nowrap ${
                                      financingStatusFilter === status 
                                        ? 'bg-white text-yellow-600 shadow-sm' 
                                        : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                  >
                                    {status}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div className="grid grid-cols-1 gap-4">
                              {financingsList.filter(f => 
                                (financingStatusFilter === 'todos' || f.status === financingStatusFilter) &&
                                (financingCustomerFilter === null || f.customerId === financingCustomerFilter)
                              ).length > 0 ? (
                                financingsList
                                  .filter(f => 
                                    (financingStatusFilter === 'todos' || f.status === financingStatusFilter) &&
                                    (financingCustomerFilter === null || f.customerId === financingCustomerFilter)
                                  )
                                  .map(f => (
                                    <div 
                                      key={f.id}
                                      className="bg-white p-6 rounded-2xl border-2 border-gray-100 hover:border-yellow-400 transition-all flex items-center justify-between group shadow-sm"
                                    >
                                      <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl ${
                                          f.status === 'activo' ? 'bg-blue-500' : f.status === 'completado' ? 'bg-green-500' : 'bg-red-500'
                                        }`}>
                                          {f.customerName.charAt(0)}
                                        </div>
                                        <div className="text-left">
                                          <h4 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter">{f.customerName}</h4>
                                          <div className="flex items-center gap-4 mt-1">
                                            <span className="text-xs font-bold text-gray-400">Monto: <span className="text-gray-600">${f.totalAmount.toFixed(2)}</span></span>
                                            <span className="text-xs font-bold text-gray-400">Restante: <span className="text-red-500 font-black">${f.remainingAmount.toFixed(2)}</span></span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-3">
                                        <div className="flex items-center gap-2">
                                          <button 
                                            onClick={() => setViewingHistoryId(f.id)}
                                            className="bg-gray-100 hover:bg-yellow-100 text-gray-500 hover:text-yellow-600 p-2 rounded-xl transition-all flex items-center gap-2"
                                            title="Ver Historial de Pagos"
                                          >
                                            <History size={16} />
                                            <span className="text-[10px] font-black uppercase">Historial</span>
                                          </button>
                                          <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            f.status === 'activo' ? 'bg-blue-100 text-blue-600' : f.status === 'completado' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                          }`}>
                                            {f.status}
                                          </span>
                                        </div>
                                        <button 
                                          onClick={() => setSelectedFinancingId(f.id)}
                                          className="flex items-center gap-1 text-gray-400 group-hover:text-yellow-600 transition-colors"
                                        >
                                          <span className="text-xs font-black uppercase">Detalles</span>
                                          <ArrowRight size={16} />
                                        </button>
                                      </div>
                                    </div>
                                  ))
                              ) : (
                                <div className="py-20 text-center opacity-20">
                                  <CreditCard size={80} className="mx-auto mb-4" />
                                  <p className="text-2xl font-black uppercase whitespace-pre-line">
                                    {financingStatusFilter === 'todos' 
                                      ? 'No hay financiamientos registrados' 
                                      : `No hay cuentas con estado\n"${financingStatusFilter.toUpperCase()}"`}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lado Derecho: Recordatorios Automáticos */}
                      <div className="w-full lg:w-[380px] flex flex-col gap-6">
                        <div className="bg-yellow-50 rounded-3xl border-4 border-yellow-400 p-6 shadow-xl flex-1 flex flex-col overflow-hidden">
                           <div className="flex items-center gap-3 mb-6">
                              <div className="p-3 bg-yellow-400 rounded-2xl text-white shadow-lg">
                                <Bell size={24} />
                              </div>
                              <div>
                                <h3 className="font-black text-yellow-800 text-lg uppercase italic tracking-tighter">Recordatorios</h3>
                                <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">Sugeridos para hoy</p>
                              </div>
                           </div>

                           <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                              {pendingReminders.length > 0 ? (
                                pendingReminders.map(f => (
                                  <div key={f.id} className="bg-white rounded-2xl p-4 border-2 border-yellow-200 shadow-sm hover:border-yellow-500 transition-all">
                                    <div className="flex items-center gap-3 mb-4">
                                      <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-700 font-black">
                                        {f.customerName.charAt(0)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-gray-800 uppercase text-xs truncate italic">{f.customerName}</h4>
                                        <p className="text-[10px] font-bold text-red-500">Saldo: ${f.remainingAmount.toFixed(2)}</p>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => {
                                        const customer = customersList.find(c => c.id === f.customerId);
                                        if (!customer?.phone) {
                                          showMessage('El cliente no tiene teléfono', 'error');
                                          return;
                                        }
                                        const installmentAmount = (f.totalAmount - f.downPayment) / f.installmentsCount;
                                        const message = `Hola ${f.customerName}, le saludamos de Y.G Facturación. Le recordamos que tiene un pago pendiente por su financiamiento.\n\n*Saldo:* $${f.remainingAmount.toFixed(2)}\n*Cuota:* $${installmentAmount.toFixed(2)}\n\nFavor pasar por caja. ¡Gracias!`;
                                        const phone = customer.phone.replace(/\D/g, '');
                                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                                      }}
                                      className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                                    >
                                      <MessageCircle size={14} /> Enviar WhatsApp
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <div className="py-12 text-center text-gray-400 font-bold opacity-50 flex flex-col items-center gap-3">
                                   <CheckCircle size={48} />
                                   <p className="text-xs uppercase tracking-widest">Al día. No hay recordatorios pendientes.</p>
                                </div>
                              )}
                           </div>
                           
                           {pendingReminders.length > 0 && (
                             <div className="mt-6 pt-4 border-t-2 border-yellow-200">
                                <p className="text-[9px] font-bold text-yellow-700 text-center uppercase tracking-widest leading-tight">
                                  La "Inteligencia de Cobro" detecta clientes que no han abonado en su frecuencia pactada.
                                </p>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col min-h-0">
                    <button 
                      onClick={() => setSelectedFinancingId(null)}
                      className="flex items-center gap-2 text-yellow-600 font-black text-sm uppercase tracking-widest mb-6 hover:translate-x-[-4px] transition-transform self-start"
                    >
                      <X size={18} /> Volver a la lista
                    </button>

                    {(() => {
                      const f = financingsList.find(x => x.id === selectedFinancingId);
                      if (!f) return null;
                      return (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-8">
                          {/* Columna Izquierda: Detalles */}
                          <div className="lg:col-span-2 space-y-8">
                            <div className="bg-gray-50 rounded-[2.5rem] p-8 border-2 border-gray-100">
                               <div className="flex justify-between items-start mb-8">
                                  <div className="flex items-center gap-4">
                                     <div className="w-20 h-20 bg-yellow-400 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-lg">
                                       {f.customerName.charAt(0)}
                                     </div>
                                     <div>
                                        <div className="flex items-center gap-3">
                                          <h3 className="text-3xl font-black text-gray-800 uppercase italic tracking-tighter">{f.customerName}</h3>
                                          <button 
                                            onClick={() => {
                                              const customer = customersList.find(c => c.id === f.customerId);
                                              if (!customer?.phone) {
                                                showMessage('El cliente no tiene teléfono registrado', 'error');
                                                return;
                                              }
                                              const installmentAmount = (f.totalAmount - f.downPayment) / f.installmentsCount;
                                              const message = `Hola ${f.customerName}, le saludamos de Y.G Facturación. Le recordamos su compromiso de pago de su financiamiento:\n\n*Saldo Pendiente:* $${f.remainingAmount.toFixed(2)}\n*Cuota Próxima:* $${installmentAmount.toFixed(2)} (${f.installmentsFrequency})\n\nPuede pasar por la tienda para realizar su abono. ¡Gracias!`;
                                              const phone = customer.phone.replace(/\D/g, '');
                                              window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                                            }}
                                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 transition-all shadow-md active:scale-95"
                                            title="Enviar recordatorio por WhatsApp"
                                          >
                                            <MessageCircle size={16} />
                                            <span className="text-[10px] font-black uppercase">WhatsApp</span>
                                          </button>
                                        </div>
                                        <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Contrato #{f.id.toString().slice(-6)}</p>
                                     </div>
                                  </div>
                                  <div className="text-right">
                                     <span className={`px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border-2 ${
                                       f.status === 'activo' ? 'bg-blue-50 border-blue-200 text-blue-600' : 
                                       f.status === 'completado' ? 'bg-green-50 border-green-200 text-green-600' : 
                                       'bg-red-50 border-red-200 text-red-600'
                                     }`}>
                                       {f.status}
                                     </span>
                                     <p className="mt-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Iniciado: {new Date(f.startDate).toLocaleDateString()}</p>
                                  </div>
                               </div>

                               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                  <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center">
                                     <span className="text-[10px] font-black text-gray-400 block uppercase mb-1">Monto Total</span>
                                     <span className="text-xl font-black text-gray-800">${f.totalAmount.toFixed(2)}</span>
                                  </div>
                                  <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center">
                                     <span className="text-[10px] font-black text-gray-400 block uppercase mb-1">Enganche</span>
                                     <span className="text-xl font-black text-green-600">${f.downPayment.toFixed(2)}</span>
                                  </div>
                                  <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center">
                                     <span className="text-[10px] font-black text-gray-400 block uppercase mb-1">Monto Pagado</span>
                                     <span className="text-xl font-black text-blue-600">${(f.totalAmount - f.remainingAmount).toFixed(2)}</span>
                                  </div>
                                  <div className="bg-white p-6 rounded-3xl border-4 border-yellow-400 text-center shadow-xl">
                                     <span className="text-[10px] font-black text-yellow-600 block uppercase mb-1">Faltante</span>
                                     <span className="text-2xl font-black text-red-600">${f.remainingAmount.toFixed(2)}</span>
                                  </div>
                               </div>

                               <div className="mt-12">
                                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4 flex items-center gap-2">
                                    <History size={14} /> Historial de Pagos
                                  </h4>
                                  <div className="space-y-3">
                                    {f.payments.map((p, idx) => (
                                      <div key={idx} className="bg-white p-4 rounded-2xl border-2 border-gray-100 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                           <div className="bg-green-100 p-2 rounded-xl text-green-600"><Check size={16} /></div>
                                           <div>
                                             <div className="text-sm font-black text-gray-800">{p.note}</div>
                                             <div className="text-[10px] font-bold text-gray-400">{new Date(p.date).toLocaleString()}</div>
                                           </div>
                                        </div>
                                        <div className="text-lg font-black text-green-600">+ ${p.amount.toFixed(2)}</div>
                                      </div>
                                    ))}
                                    {f.payments.length === 0 && <p className="text-center py-8 text-gray-400 font-bold italic">No hay pagos registrados aún.</p>}
                                  </div>
                               </div>
                            </div>
                          </div>

                          {/* Columna Derecha: Registrar Pago */}
                          <div className="lg:col-span-1">
                            <div className="bg-yellow-50 rounded-[2.5rem] p-8 border-4 border-yellow-400 shadow-2xl space-y-6 sticky top-4">
                               <div className="text-center">
                                 <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
                                   <DollarSign size={32} />
                                 </div>
                                 <h3 className="text-2xl font-black text-yellow-700 uppercase italic">Abono a Cuenta</h3>
                                 <p className="text-xs font-bold text-yellow-600 uppercase tracking-widest">Registrar nueva cuota</p>
                               </div>

                               <div className="space-y-4">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-yellow-800 tracking-widest">Monto del Pago</label>
                                    <div className="relative">
                                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-yellow-700">$</span>
                                      <input 
                                        type="number"
                                        id="payment-amount"
                                        placeholder="0.00"
                                        className="w-full bg-white border-2 border-yellow-200 rounded-2xl p-4 pl-10 text-2xl font-black text-yellow-700 outline-none focus:border-yellow-500 transition-all"
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-yellow-800 tracking-widest">Observación (Opcional)</label>
                                    <input 
                                      type="text"
                                      id="payment-note"
                                      placeholder="Ej: Cuota 2"
                                      className="w-full bg-white border-2 border-yellow-200 rounded-2xl p-4 font-bold text-gray-700 outline-none focus:border-yellow-500 transition-all"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-yellow-800 tracking-widest">Método de Pago</label>
                                    <div className="grid grid-cols-3 gap-2">
                                      {[
                                        { id: 'efectivo', icon: DollarSign, label: 'Efectivo' },
                                        { id: 'tarjeta', icon: CreditCard, label: 'Tarjeta' },
                                        { id: 'transferencia', icon: ArrowRightLeft, label: 'Transf.' },
                                      ].map((m) => (
                                        <button
                                          key={m.id}
                                          onClick={() => setAbonoMethod(m.id)}
                                          className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                                           abonoMethod === m.id 
                                             ? 'bg-yellow-100 border-yellow-500 text-yellow-700 shadow-inner' 
                                             : 'bg-white border-yellow-100 text-yellow-500 hover:border-yellow-200'
                                          }`}
                                        >
                                          <m.icon size={16} />
                                          <span className="text-[8px] font-black uppercase mt-1">{m.label}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                               </div>

                               <button 
                                 onClick={() => {
                                   const amountInput = document.getElementById('payment-amount') as HTMLInputElement;
                                   const noteInput = document.getElementById('payment-note') as HTMLInputElement;
                                   const amount = parseFloat(amountInput.value);
                                   if (isNaN(amount) || amount <= 0) {
                                     showMessage('Ingrese un monto válido', 'error');
                                     return;
                                   }
                                   if (amount > f.remainingAmount) {
                                     showMessage('El monto excede el saldo restante', 'error');
                                     return;
                                   }

                                   const newPayment: FinancingPayment = {
                                     id: Date.now(),
                                     amount: amount,
                                     date: new Date().toISOString(),
                                     note: noteInput.value || `Abono de cuota`,
                                     method: abonoMethod
                                   };

                                   const updatedFinancings = financingsList.map(item => {
                                     if (item.id === f.id) {
                                       const newRemaining = item.remainingAmount - amount;
                                       return {
                                         ...item,
                                         remainingAmount: newRemaining,
                                         status: newRemaining <= 0 ? 'completado' : item.status,
                                         payments: [...item.payments, newPayment]
                                       };
                                     }
                                     return item;
                                   });

                                   setFinancingsList(updatedFinancings as Financing[]);
                                   amountInput.value = '';
                                   noteInput.value = '';
                                   showMessage('Pago registrado con éxito', 'success');
                                 }}
                                 className="w-full bg-yellow-600 text-white py-5 rounded-2xl font-black text-xl shadow-[0_8px_0_0_rgba(180,83,9,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
                               >
                                 <Plus size={24} /> REGISTRAR ABONO
                               </button>

                               <div className="text-center">
                                  <p className="text-[10px] font-bold text-yellow-600 italic">Cada pago se registra en el historial local automáticamente.</p>
                               </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </motion.div>
          ) : currentView === 'salidas' ? (
            <motion.div
              key="salidas-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full bg-white rounded-[2.5rem] shadow-2xl border-4 border-red-500 overflow-hidden min-h-[500px] sm:min-h-[700px] flex flex-col"
            >
              <div className="bg-gradient-to-r from-red-600 to-red-800 p-8 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                    <ArrowUpCircle size={40} /> Salidas de Dinero
                  </h2>
                  <p className="font-bold opacity-80 uppercase tracking-widest text-sm">Registro de gastos y pagos externos</p>
                </div>
                <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-sm border border-white/30 text-right">
                  <p className="text-[10px] font-black uppercase mb-1">Total Salidas Hoy</p>
                  <p className="text-3xl font-black">
                    ${cashOutsList
                      .filter(c => c.date.startsWith(new Date().toISOString().split('T')[0]))
                      .reduce((sum, c) => sum + c.amount, 0)
                      .toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="p-8 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">
                {/* Formulario de Salida */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-red-50 p-8 rounded-[2rem] border-2 border-red-100 shadow-inner">
                    <h3 className="text-xl font-black text-red-900 uppercase mb-6 flex items-center gap-2">
                       <Plus size={20} /> Nueva Salida
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-red-700 tracking-widest pl-1">Monto de Salida</label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400" size={24} />
                          <input 
                            type="number"
                            value={cashOutForm.amount || ''}
                            onChange={(e) => setCashOutForm({...cashOutForm, amount: e.target.value})}
                            placeholder="0.00"
                            className="w-full bg-white border-2 border-red-200 rounded-2xl p-4 pl-12 text-2xl font-black text-gray-800 focus:border-red-500 outline-none transition-all shadow-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-red-700 tracking-widest pl-1">Concepto / Descripción</label>
                        <input 
                          type="text"
                          value={cashOutForm.description || ''}
                          onChange={(e) => setCashOutForm({...cashOutForm, description: e.target.value})}
                          placeholder="Ej: Pago de Luz local..."
                          className="w-full bg-white border-2 border-red-200 rounded-2xl p-4 font-bold text-gray-800 focus:border-red-500 outline-none transition-all shadow-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-red-700 tracking-widest pl-1">Categoría</label>
                        <select 
                          value={cashOutForm.category}
                          onChange={(e) => setCashOutForm({...cashOutForm, category: e.target.value})}
                          className="w-full bg-white border-2 border-red-200 rounded-2xl p-4 font-bold text-gray-800 focus:border-red-500 outline-none transition-all shadow-sm appearance-none cursor-pointer"
                        >
                          {cashOutCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <button 
                        onClick={handleSaveCashOut}
                        className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-xl uppercase tracking-widest shadow-[0_8px_0_0_rgba(185,28,28,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 mt-4"
                      >
                        <Save size={24} /> Registrar Salida
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-[2rem] border-2 border-blue-100">
                    <div className="flex items-center gap-3 text-blue-800 mb-2">
                       <Info size={20} />
                       <span className="font-black text-sm uppercase">Nota Importante</span>
                    </div>
                    <p className="text-xs font-bold text-blue-600 opacity-80 leading-relaxed">
                      Todas las salidas de dinero quedan registradas con la fecha, hora y cajero responsable. Este monto será restado automáticamente del balance esperado en el corte de caja.
                    </p>
                  </div>
                </div>

                {/* Lista de Salidas Recientes */}
                <div className="lg:col-span-2 flex flex-col min-h-0 bg-gray-50 rounded-[2.5rem] border-2 border-gray-100 overflow-hidden shadow-inner">
                  <div className="p-8 border-b-2 border-gray-100 flex justify-between items-center bg-white">
                    <h3 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter">Historial de Salidas</h3>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                       <button className="px-4 py-1.5 rounded-lg bg-white shadow-sm font-black text-xs uppercase text-red-600">Recientes</button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {cashOutsList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
                         <ArrowUpCircle size={100} strokeWidth={1} />
                         <p className="text-3xl font-black uppercase mt-4">Sin salidas registradas</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cashOutsList.map((co, idx) => (
                          <motion.div 
                            key={co.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white p-6 rounded-3xl border-2 border-gray-100 flex items-center justify-between group hover:border-red-300 transition-all shadow-sm"
                          >
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-inner group-hover:bg-red-100 transition-colors">
                                <ArrowUpCircle size={28} />
                              </div>
                              <div>
                                <div className="text-xs font-black uppercase text-red-600 tracking-widest mb-1">{co.category}</div>
                                <div className="text-lg font-black text-gray-800 uppercase tracking-tight leading-tight">{co.description}</div>
                                <div className="flex items-center gap-3 mt-1">
                                  <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                    <Calendar size={10} /> {new Date(co.date).toLocaleString()}
                                  </div>
                                  <div className="w-1 h-1 bg-gray-300 rounded-full" />
                                  <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                    <User size={10} /> {co.cashier}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                              <div>
                                <div className="text-2xl font-black text-red-600">-${co.amount.toFixed(2)}</div>
                                <div className="text-[9px] font-black uppercase text-gray-300 tracking-widest">Efectivo Pagado</div>
                              </div>
                              <button 
                                onClick={() => handlePrintCashOut(co)}
                                className="bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 p-2 rounded-xl transition-all flex items-center gap-2 group/print"
                                title="Imprimir Recibo"
                              >
                                <span className="text-[9px] font-black uppercase opacity-0 group-hover/print:opacity-100 transition-opacity">Imprimir</span>
                                <Printer size={16} />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : currentView === 'inventario' ? (
            <motion.div
              key="inventario-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full bg-white rounded-[2.5rem] shadow-2xl border-4 border-yellow-400 overflow-hidden flex flex-col min-h-[500px] sm:min-h-[700px]"
            >
              {/* Header Técnico */}
              <div className="bg-red-700 p-6 flex flex-col md:flex-row justify-between items-center gap-4 text-white">
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-400 p-3 rounded-2xl shadow-lg rotate-3 text-red-700">
                    <ClipboardList size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Control de Inventario</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-200 mt-1">Gestión Centralizada de Existencias</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400" size={20} />
                    <input 
                      type="text"
                      placeholder="BUSCAR POR NOMBRE O CÓDIGO..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-red-800 border-2 border-red-600 rounded-2xl py-3 pl-12 pr-4 font-black uppercase text-xs text-white placeholder:text-red-400 outline-none focus:border-yellow-400 transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 border-b-4 border-gray-100 bg-gray-50">
                {[
                  { label: 'Productos Totales', value: productsList.length, icon: Package, color: 'text-blue-600' },
                  { label: 'En Inventario', value: productsList.reduce((acc, p) => acc + (p.stock || 0), 0), icon: Barcode, color: 'text-indigo-600' },
                  { label: 'Inversión Total', value: productsList.reduce((acc, p) => acc + (p.stock * (p.costPrice || 0)), 0), icon: DollarSign, color: 'text-emerald-600', prefix: '$' },
                  { label: 'Stock Crítico', value: lowStockProducts.length, icon: AlertTriangle, color: 'text-red-600' },
                ].map((stat, i) => (
                  <div key={i} className={`p-6 flex flex-col items-center justify-center text-center min-w-0 ${i < 3 ? 'border-r-2 border-gray-100' : ''}`}>
                    <stat.icon size={20} className={`${stat.color} mb-2 flex-shrink-0`} />
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1 truncate w-full">{stat.label}</p>
                    <p className={`text-xl md:text-2xl font-black ${stat.color} truncate w-full`} title={`${stat.prefix || ''}${stat.value}`}>
                      {stat.prefix}{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Data Grid */}
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-white z-10 shadow-sm">
                    <tr className="border-b-2 border-gray-100">
                      <th className="p-4 text-left font-serif italic text-[11px] uppercase text-gray-300 tracking-[0.1em]">Cód./Ref</th>
                      <th className="p-4 text-left font-serif italic text-[11px] uppercase text-gray-300 tracking-[0.1em]">Descripción del Producto</th>
                      <th className="p-4 text-center font-serif italic text-[11px] uppercase text-gray-300 tracking-[0.1em]">Depto.</th>
                      <th className="p-4 text-right font-serif italic text-[11px] uppercase text-gray-300 tracking-[0.1em]">Costo (DOP)</th>
                      <th className="p-4 text-right font-serif italic text-[11px] uppercase text-gray-300 tracking-[0.1em]">Venta (DOP)</th>
                      <th className="p-4 text-center font-serif italic text-[11px] uppercase text-gray-300 tracking-[0.1em]">Existencia</th>
                      <th className="p-4 text-right font-serif italic text-[11px] uppercase text-gray-300 tracking-[0.1em]">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsList
                      .filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toString().includes(searchTerm))
                      .map((product) => (
                      <tr 
                        key={product.id}
                        className="border-b border-gray-50 hover:bg-yellow-50 transition-colors group cursor-pointer"
                        onClick={() => {
                          setProductForm({
                            barcode: product.barcode || product.id.toString(),
                            description: product.description || product.name,
                            sellType: product.sellType || 'unit',
                            costPrice: product.costPrice || 0,
                            sellPrice: product.sellPrice || product.price,
                            wholesalePrice: product.wholesalePrice || 0,
                            department: product.department || product.category,
                            useInventory: product.useInventory !== undefined ? product.useInventory : true,
                            currentStock: product.currentStock !== undefined ? product.currentStock : product.stock,
                            minStock: product.minStock || 5,
                            image: product.image || null
                          });
                          setEditingProductId(product.id);
                          setProductMode('modificar');
                          setCurrentView('productos');
                        }}
                      >
                        <td className="p-4 font-mono text-[10px] text-gray-400">#{product.barcode || product.id}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300 overflow-hidden shrink-0">
                               {product.image ? (
                                 <img src={product.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                               ) : <Package size={20} />}
                            </div>
                            <span className="font-black text-xs text-gray-700 uppercase tracking-tight truncate" title={product.name || product.description}>{product.name || product.description}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-[9px] font-black bg-gray-100 px-3 py-1 rounded-full text-gray-500 uppercase">{product.category || product.department || 'General'}</span>
                        </td>
                        <td className="p-4 text-right font-mono text-xs text-gray-500">${(product.costPrice || 0).toFixed(2)}</td>
                        <td className="p-4 text-right font-black text-xs text-green-600">${(product.price || 0).toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-black text-xs ${
                            (product.stock || 0) <= (product.minStock || 0) 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-green-100 text-green-600'
                          }`}>
                            {product.stock || 0}
                            {(product.stock || 0) <= (product.minStock || 0) && <AlertTriangle size={12} className="animate-pulse" />}
                          </div>
                        </td>
                        <td className="p-4 text-right font-black text-gray-800 text-sm">
                          ${((product.stock || 0) * (product.price || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer Acciones */}
              <div className="p-6 bg-gray-50 flex justify-between items-center border-t-2 border-gray-100">
                <div className="hidden md:block">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">
                    Haga clic en un producto para modificar o ajustar stock
                  </p>
                </div>
                <div className="flex gap-4">
                   <button 
                     onClick={() => window.print()}
                     className="bg-white border-2 border-gray-200 p-4 rounded-2xl hover:bg-gray-100 transition-all font-black text-gray-600 flex items-center gap-2 text-xs uppercase"
                   >
                     <Printer size={20} /> Imprimir Reporte
                   </button>
                   <button 
                     onClick={() => setCurrentView('productos')}
                     className="bg-yellow-400 text-red-700 px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-[0_4px_0_0_rgba(185,28,28,1)] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
                   >
                     <Plus size={20} /> Agregar Mercancía
                   </button>
                </div>
              </div>
            </motion.div>
          ) : currentView === 'usuarios' ? (
            <motion.div
              key="usuarios-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full bg-white rounded-[2.5rem] shadow-2xl border-4 border-yellow-400 p-8 min-h-[500px] sm:min-h-[600px] flex flex-col"
            >
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-4xl font-black text-red-700 uppercase italic tracking-tighter">Gestión de Usuarios</h2>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1 italic">Control de acceso y permisos granulares para el personal</p>
                </div>
                <button 
                  onClick={() => {
                    setUserMode('nuevo');
                    setUserForm({
                      id: 0,
                      name: '',
                      username: '',
                      pin: '',
                      role: 'cajero',
                      active: true,
                      permissions: {
                        canManageProducts: false,
                        canManageInventory: false,
                        canManageCustomers: true,
                        canViewSales: false,
                        canDeleteSales: false,
                        canViewFinances: false,
                        canPerformCorte: false,
                        canManageSettings: false,
                        canManageUsers: false,
                        canManageSalidas: true,
                        canEditPrices: false,
                      }
                    });
                    setShowUserDialog(true);
                  }}
                  className="bg-red-600 text-white px-8 py-5 rounded-[2rem] font-black hover:bg-red-700 transition-all shadow-[0_8px_0_0_rgba(185,28,28,1)] active:translate-y-1 active:shadow-none flex items-center gap-3"
                >
                  <Plus size={24} /> NUEVO USUARIO
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {usersList.map(user => (
                  <div key={user.id} className="bg-gray-50 border-4 border-gray-100 rounded-[2.5rem] p-8 flex flex-col justify-between group hover:border-yellow-400 transition-all relative overflow-hidden">
                    {user.role === 'admin' && (
                       <div className="absolute top-0 right-0 p-3 bg-red-100 text-red-600 rounded-bl-3xl">
                          <Shield size={16} />
                       </div>
                    )}
                    
                    <div className="mb-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-white p-4 rounded-3xl shadow-sm border-2 border-gray-100 text-red-600">
                          <User size={32} />
                        </div>
                        <div>
                          <h4 className="font-black text-xl text-gray-800 uppercase italic tracking-tighter truncate w-40">{user.name}</h4>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <Key size={10} /> @{user.username}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${user.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                          {user.role}
                        </span>
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${user.active ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                          {user.active ? 'Activo' : 'Suspendido'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white rounded-2xl p-4 border-2 border-gray-100">
                        <h5 className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 italic">Permisos Activos:</h5>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(user.permissions).filter(([_, val]) => val).slice(0, 4).map(([key]) => (
                             <span key={key} className="bg-gray-100 px-2 py-0.5 rounded text-[8px] font-bold text-gray-500 uppercase">
                               {key.replace('can', '').replace(/([A-Z])/g, ' $1')}
                             </span>
                          ))}
                          {Object.values(user.permissions).filter(v => v).length > 4 && (
                             <span className="text-[8px] font-black text-red-400 ml-1">+{Object.values(user.permissions).filter(v => v).length - 4} más</span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                           onClick={() => {
                             setUserMode('editar');
                             setUserForm(user);
                             setShowUserDialog(true);
                           }}
                           className="flex-1 bg-white border-2 border-gray-200 py-4 rounded-2xl font-black text-xs uppercase text-gray-700 hover:bg-yellow-400 hover:border-yellow-500 hover:text-red-700 transition-all flex items-center justify-center gap-2"
                         >
                           <Shield size={16} /> Configurar Acceso
                         </button>
                         {(currentUser?.role === 'admin' || currentUser?.permissions.canManageUsers) && user.role !== 'admin' && (
                           <button 
                             onClick={() => deleteUser(user.id)}
                             className="w-14 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white hover:border-red-700 transition-all shadow-sm"
                             title="Eliminar Usuario"
                           >
                             <Trash2 size={20} />
                           </button>
                         )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Card Vacía / Invitar */}
                <div 
                  onClick={() => {
                    setUserMode('nuevo');
                    setShowUserDialog(true);
                  }}
                  className="bg-white border-4 border-dashed border-gray-200 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-red-300 hover:bg-red-50 transition-all group"
                >
                   <div className="bg-gray-50 p-6 rounded-full text-gray-300 group-hover:scale-110 group-hover:text-red-300 transition-all mb-4">
                      <Plus size={48} />
                   </div>
                   <p className="font-black text-gray-300 uppercase tracking-widest text-xs group-hover:text-red-400">Añadir otro cajero</p>
                </div>
              </div>

              <div className="mt-auto pt-10 text-center">
                 <button 
                  onClick={() => setCurrentView('ventas')}
                  className="bg-green-500 text-white px-12 py-5 rounded-3xl font-black text-xl shadow-[0_8px_0_0_rgba(21,128,61,1)] active:translate-y-1 active:shadow-none transition-all"
                >
                  VOLVER A VENTAS
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full bg-white rounded-[2.5rem] shadow-2xl border-4 border-yellow-400 p-20 flex flex-col items-center justify-center text-center min-h-[600px]"
            >
              <div className="bg-yellow-100 p-10 rounded-full mb-8 text-yellow-600">
                {currentView === 'clientes' && <Users size={120} />}
                {currentView === 'config' && <Settings size={120} />}
              </div>
              <h2 className="text-5xl font-black text-red-700 uppercase mb-4">Módulo de {currentView}</h2>
              <p className="text-xl font-bold text-gray-400 max-w-md">
                Esta sección está en desarrollo para <span className="text-green-600">Y.G Facturación</span>. 
                Pronto podrás gestionar tus {currentView} aquí.
              </p>
              {currentView === 'config' && (
                <div className="mt-8 space-y-6 w-full max-w-md">
                  {isSuperAdmin && (
                    <div className="bg-red-600 p-6 rounded-3xl border-4 border-red-200 shadow-xl text-left scale-105 mb-10 overflow-hidden relative">
                       {/* Efecho de brillo Master */}
                       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse" />
                       
                       <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-4 flex items-center gap-4">
                           <div className="bg-yellow-400 p-2 rounded-xl text-red-700 shadow-lg">
                              <Shield size={24} />
                           </div>
                           PANEL MAESTRO (SOPORTE)
                       </h3>
                       
                       <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {allBusinesses.length === 0 ? (
                             <p className="text-red-200 font-bold text-center py-4 italic text-xs">No hay negocios registrados aún</p>
                          ) : (
                            allBusinesses.map((bus) => (
                               <div key={bus.id} className="bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-sm group hover:bg-white/20 transition-all">
                                  <div className="flex justify-between items-start mb-2">
                                     <div className="min-w-0">
                                        <p className="font-black text-white truncate text-sm uppercase italic tracking-tighter">{bus.name || 'Sin Nombre'}</p>
                                        <p className="text-[9px] font-bold text-red-200 truncate">{bus.email}</p>
                                     </div>
                                     <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${new Date(bus.subscriptionEndDate) > new Date() ? 'bg-green-400 text-green-900 border border-green-300' : 'bg-red-400 text-red-900 border border-red-300'}`}>
                                        {new Date(bus.subscriptionEndDate) > new Date() ? 'Activo' : 'Vencido'}
                                     </div>
                                  </div>
                                  <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-white/10">
                                     <div className="min-w-0">
                                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Expira:</p>
                                        <p className="text-xs font-black text-white">{new Date(bus.subscriptionEndDate).toLocaleDateString()}</p>
                                     </div>
                                     <div className="flex gap-1">
                                        <button 
                                          onClick={() => updateSubscription(bus.id, 30)}
                                          className="bg-green-500 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-green-400 shadow-lg shadow-green-900/20 active:translate-y-1 transition-all"
                                        >
                                          +30 Días
                                        </button>
                                        <button 
                                          onClick={() => updateSubscription(bus.id, 365)}
                                          className="bg-yellow-400 text-red-700 px-3 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-yellow-300 shadow-lg shadow-yellow-900/20 active:translate-y-1 transition-all"
                                        >
                                          +1 Año
                                        </button>
                                     </div>
                                  </div>
                               </div>
                            ))
                          )}
                       </div>
                       
                       <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
                          <p className="text-[9px] font-black text-red-200 uppercase tracking-widest">Total Clientes: {allBusinesses.length}</p>
                          <div className="flex items-center gap-1 text-yellow-400 font-bold italic text-[9px]">
                             <Zap size={10} /> Soporte Técnico VIP
                          </div>
                       </div>
                    </div>
                  )}

                  <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm text-left">
                    <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter mb-4 flex items-center gap-2">
                        <Lock size={20} className="text-blue-500" /> Sincronización de Datos
                    </h3>
                    {!fbUser ? (
                        <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-100 flex flex-col items-center text-center">
                            <CloudOff size={48} className="text-blue-300 mb-4" />
                            <p className="text-sm font-bold text-blue-700 leading-tight mb-4">
                                Conecte su cuenta para sincronizar sus datos de forma segura.
                            </p>
                            <button 
                                onClick={() => { setShowLogin(true); setShowEmailForm(true); }}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-black shadow-lg shadow-blue-200 active:translate-y-1 transition-all"
                            >
                                ACTIVAR SINCRONIZACIÓN
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-green-50 p-4 rounded-2xl border-2 border-green-100">
                                <div className="bg-green-500 p-3 rounded-full text-white">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Sincronización Activada</p>
                                    <p className="font-bold text-gray-800 truncate">{fbUser.email}</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={migrateToCloud}
                                disabled={isSyncing}
                                className="w-full bg-white border-2 border-blue-200 text-blue-600 py-4 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-blue-50 transition-all disabled:opacity-50"
                            >
                                {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : <Upload size={18} />}
                                SINCRONIZAR DATOS AHORA
                            </button>
                            
                            <button 
                                onClick={handleLogoutCloud}
                                className="w-full text-red-500 text-[10px] font-black uppercase tracking-widest py-2 hover:bg-red-50 rounded-lg transition-all"
                            >
                                Cerrar sesión administrativa
                            </button>
                            
                            <p className="text-[10px] text-gray-400 font-bold italic">
                                * Esto vinculará sus datos con su cuenta de Google.
                            </p>
                        </div>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm text-left">
                    <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter mb-4 flex items-center gap-2">
                       <DollarSign size={20} className="text-green-500" /> Tasa de Cambio (Dólares)
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Precio Compra USD</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-gray-400">$</span>
                          <input 
                            type="number"
                            value={usdRate}
                            onChange={(e) => setUsdRate(parseFloat(e.target.value) || 0)}
                            className="w-full pl-8 bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-black text-xl text-gray-800 outline-none focus:border-green-500 transition-all"
                          />
                        </div>
                      </div>
                      <div className="bg-green-100 p-4 rounded-2xl text-green-700 flex flex-col items-center justify-center min-w-[100px]">
                         <span className="text-[10px] font-black uppercase text-green-600">Actual:</span>
                         <span className="text-xl font-black">{usdRate.toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 mt-3 italic">
                      * Esta tasa se aplicará automáticamente en el modo de cobro "Dólares". Se recomienda actualizarla diariamente.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm text-left">
                    <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter mb-4 flex items-center gap-2">
                       <Printer size={20} className="text-blue-500" /> Configuración de Ticket
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nombre del Negocio</label>
                        <input 
                          type="text"
                          value={ticketConfig.storeName || ''}
                          onChange={(e) => setTicketConfig({...ticketConfig, storeName: e.target.value})}
                          className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-gray-800 outline-none focus:border-blue-500 transition-all text-sm"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Dirección</label>
                          <input 
                            type="text"
                            value={ticketConfig.address || ''}
                            onChange={(e) => setTicketConfig({...ticketConfig, address: e.target.value})}
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-gray-800 outline-none focus:border-blue-500 transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Teléfono</label>
                          <input 
                            type="text"
                            value={ticketConfig.phone || ''}
                            onChange={(e) => setTicketConfig({...ticketConfig, phone: e.target.value})}
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-gray-800 outline-none focus:border-blue-500 transition-all text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">RNC (Opcional)</label>
                          <input 
                            type="text"
                            value={ticketConfig.rnc || ''}
                            onChange={(e) => setTicketConfig({...ticketConfig, rnc: e.target.value})}
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-gray-800 outline-none focus:border-blue-500 transition-all text-sm"
                          />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Cargar Logo (JPG/PNG)</label>
                           <div 
                             onClick={() => document.getElementById('ticket-logo-input')?.click()}
                             className="w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                           >
                              {ticketConfig.logo ? (
                                <div className="relative group w-full flex justify-center">
                                  <img src={ticketConfig.logo} alt="Logo Preview" className="h-10 object-contain" referrerPolicy="no-referrer" />
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                                    <Camera size={16} className="text-white" />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center text-gray-400">
                                  <Upload size={16} />
                                  <span className="text-[8px] font-black uppercase">Subir Logo</span>
                                </div>
                              )}
                              <input 
                                id="ticket-logo-input"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleLogoUpload}
                              />
                           </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Logo URL (Alternativo)</label>
                        <input 
                          type="text"
                          value={ticketConfig.logo || ''}
                          onChange={(e) => setTicketConfig({...ticketConfig, logo: e.target.value})}
                          placeholder="https://su-logo.png o base64"
                          className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-gray-800 outline-none focus:border-blue-500 transition-all text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Mensaje de Despedida</label>
                          <input 
                            type="text"
                            value={ticketConfig.message || ''}
                            onChange={(e) => setTicketConfig({...ticketConfig, message: e.target.value})}
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-gray-800 outline-none focus:border-blue-500 transition-all text-sm"
                          />
                        </div>
                        <div className="w-full">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Tamaño de Impresión</label>
                          <select 
                            value={ticketConfig.printSize || '80mm'}
                            onChange={(e) => setTicketConfig({...ticketConfig, printSize: e.target.value})}
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-gray-800 outline-none focus:border-blue-500 transition-all text-sm"
                          >
                            <option value="58mm">POS 58mm (Pequeña)</option>
                            <option value="80mm">POS 80mm (Estándar)</option>
                            <option value="office">Oficina (A4/Carta)</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-100">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Tipografía del Ticket</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {AVAILABLE_FONTS.map((font) => (
                            <button
                              key={font.value}
                              onClick={() => setTicketConfig({...ticketConfig, fontFamily: font.value})}
                              className={`p-3 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                                ticketConfig.fontFamily === font.value 
                                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                                : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-blue-200'
                              }`}
                              style={{ fontFamily: font.value }}
                            >
                              <div className={`p-2 rounded-lg ${ticketConfig.fontFamily === font.value ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-400'}`}>
                                <Type size={14} />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-tighter truncate">{font.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            id="is-bold"
                            checked={ticketConfig.isBold}
                            onChange={(e) => setTicketConfig({...ticketConfig, isBold: e.target.checked})}
                            className="w-4 h-4 rounded-md border-2 border-blue-400 text-blue-500"
                          />
                          <label htmlFor="is-bold" className="text-[10px] font-black uppercase text-gray-600 cursor-pointer flex items-center gap-1">
                            <Bold size={12} className="text-blue-500" /> Texto en Negritas
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            id="show-logo"
                            checked={ticketConfig.showLogo}
                            onChange={(e) => setTicketConfig({...ticketConfig, showLogo: e.target.checked})}
                            className="w-4 h-4 rounded-md border-2 border-blue-400 text-blue-500"
                          />
                          <label htmlFor="show-logo" className="text-[10px] font-black uppercase text-gray-600 cursor-pointer">Mostrar logo en ticket</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            id="open-drawer"
                            checked={ticketConfig.openDrawerOnPrint}
                            onChange={(e) => setTicketConfig({...ticketConfig, openDrawerOnPrint: e.target.checked})}
                            className="w-4 h-4 rounded-md border-2 border-green-400 text-green-500"
                          />
                          <label htmlFor="open-drawer" className="text-[10px] font-black uppercase text-gray-600 cursor-pointer">Abrir gaveta al imprimir ticket</label>
                        </div>
                        <p className="text-[8px] text-gray-400 italic">
                          * Nota: Asegúrese de configurar su impresora térmica en Windows/Mac para que "abra el cajón después de imprimir".
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm text-left">
                    <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter mb-4 flex items-center gap-2">
                       <Monitor size={20} className="text-orange-500" /> Dispositivos Externos
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 mb-6 italic">
                      Configure la conexión con periféricos adicionales para su punto de venta.
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                      <button 
                        onClick={handleConnectScale}
                        className={`flex items-center justify-between p-6 border-2 rounded-2xl transition-all group ${
                          isScaleConnected 
                          ? 'bg-green-50 border-green-200 text-green-700' 
                          : 'bg-orange-50 border-orange-100 text-orange-700 hover:bg-orange-100'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${isScaleConnected ? 'bg-green-200' : 'bg-orange-200'}`}>
                            <Scale size={24} />
                          </div>
                          <div className="text-left">
                            <span className="text-xs font-black uppercase tracking-widest block">Báscula Automática</span>
                            <span className="text-[10px] font-bold opacity-60">
                              {isScaleConnected ? 'DISPOSITIVO CONECTADO' : 'NO CONECTADA (Hacer clic para buscar)'}
                            </span>
                          </div>
                        </div>
                        {isScaleConnected ? <CheckCircle2 size={24} /> : <ArrowRightLeft size={24} className="opacity-30 group-hover:opacity-100" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm text-left">
                    <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter mb-4 flex items-center gap-2">
                       <Archive size={20} className="text-purple-500" /> Seguridad y Datos Locales
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 mb-6 italic">
                      Proteja su información exportando una copia o restaure información previa.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => {
                          handleExportBackup();
                          handleAutoBackup();
                        }}
                        className="flex flex-col items-center justify-center gap-2 p-6 bg-purple-50 border-2 border-purple-100 rounded-2xl hover:bg-purple-100 transition-all group"
                      >
                        <Download size={32} className="text-purple-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-black uppercase text-purple-700 tracking-widest text-center">Exportar Datos</span>
                      </button>
                      <label className="flex flex-col items-center justify-center gap-2 p-6 bg-cyan-50 border-2 border-cyan-100 rounded-2xl hover:bg-cyan-100 transition-all group cursor-pointer">
                        <Upload size={32} className="text-cyan-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-black uppercase text-cyan-700 tracking-widest text-center">Importar Datos</span>
                        <input 
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={handleImportBackup}
                        />
                      </label>
                    </div>

                    <div className="mt-6 flex flex-col gap-4 border-t border-purple-100 pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            id="auto-backup"
                            checked={backupConfig.autoBackup}
                            onChange={(e) => setBackupConfig({...backupConfig, autoBackup: e.target.checked})}
                            className="w-4 h-4 rounded-md border-2 border-purple-400 text-purple-500"
                          />
                          <label htmlFor="auto-backup" className="text-[10px] font-black uppercase text-gray-600 cursor-pointer">Habilitar Guardado Automático</label>
                        </div>
                      </div>

                      {backupConfig.autoBackup && (
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase text-gray-400">Intervalo (Minutos)</label>
                          <select 
                            value={backupConfig.backupInterval}
                            onChange={(e) => setBackupConfig({...backupConfig, backupInterval: parseInt(e.target.value)})}
                            className="bg-gray-50 border-2 border-gray-100 rounded-lg p-1 font-bold text-xs outline-none"
                          >
                            <option value="5">5 Minutos</option>
                            <option value="15">15 Minutos</option>
                            <option value="30">30 Minutos</option>
                            <option value="60">1 Hora</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {(currentUser?.role === 'admin' || currentUser?.permissions.canManageUsers) && (
                    <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm text-left">
                      <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter mb-4 flex items-center gap-2">
                        <Shield size={20} className="text-red-500" /> Control de Acceso y Usuarios
                      </h3>
                      <p className="text-[10px] font-bold text-gray-400 mb-6 italic">
                        Administre el personal autorizado, sus contraseñas y permisos de acceso.
                      </p>
                      <button 
                        onClick={() => setCurrentView('usuarios')}
                        className="w-full flex items-center justify-between p-6 bg-red-50 border-2 border-red-100 rounded-2xl hover:bg-red-100 transition-all group text-red-700"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-red-200 rounded-xl">
                            <Users size={24} />
                          </div>
                          <div className="text-left">
                            <span className="text-xs font-black uppercase tracking-widest block">Abrir Panel de Usuarios</span>
                            <span className="text-[10px] font-bold opacity-60">
                              Gestionar cajeros y administradores
                            </span>
                          </div>
                        </div>
                        <ArrowRight size={24} className="opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </button>
                    </div>
                  )}

                  {(currentUser?.role === 'admin' || currentUser?.permissions.canManageSalidas) && (
                    <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm text-left">
                      <h3 className="text-xl font-black text-gray-800 uppercase italic tracking-tighter mb-4 flex items-center gap-2">
                        <ArrowUpCircle size={20} className="text-blue-500" /> Salidas de Efectivo
                      </h3>
                      <p className="text-[10px] font-bold text-gray-400 mb-6 italic">
                        Registre y consulte los retiros de efectivo, pagos a proveedores y otros gastos.
                      </p>
                      <button 
                        onClick={() => setCurrentView('salidas')}
                        className="w-full flex items-center justify-between p-6 bg-blue-50 border-2 border-blue-100 rounded-2xl hover:bg-blue-100 transition-all group text-blue-700"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-200 rounded-xl">
                            <ArrowUpCircle size={24} />
                          </div>
                          <div className="text-left">
                            <span className="text-xs font-black uppercase tracking-widest block">Gestionar Salidas</span>
                            <span className="text-[10px] font-bold opacity-60">
                              Control de flujo de caja externo
                            </span>
                          </div>
                        </div>
                        <ArrowRight size={24} className="opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      setConfirmDialog({
                        text: '¿Estás seguro de que deseas borrar todos los datos locales? Esta acción no se puede deshacer.',
                        onConfirm: () => {
                          localStorage.clear();
                          window.location.reload();
                        }
                      });
                    }}
                    className="w-full bg-red-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-3"
                  >
                    <Trash2 size={24} /> BORRAR TODOS LOS DATOS (RESET)
                  </button>
                </div>
              )}
              <button 
                onClick={() => setCurrentView('ventas')}
                className="mt-12 bg-green-500 text-white px-10 py-4 rounded-2xl font-black text-xl shadow-[0_8px_0_0_rgba(21,128,61,1)] active:translate-y-1 active:shadow-none transition-all"
              >
                VOLVER A VENTAS
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modal de Edición de Venta (Global) */}
      <AnimatePresence>
        {editingSale && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl border-4 border-yellow-400 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <Edit2 size={24} />
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">Editar Venta #{editingSale.id.toString().slice(-6)}</h3>
                </div>
                <button onClick={() => setEditingSale(null)} className="hover:rotate-90 transition-transform">
                  <X size={28} />
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="font-black text-gray-700 uppercase text-xs tracking-widest block">Método de Pago</label>
                    <div className="grid grid-cols-1 gap-2">
                      {['efectivo', 'tarjeta', 'transferencia', 'credito'].map((method) => (
                        <button 
                          key={method}
                          onClick={() => setSaleEditForm({...saleEditForm, paymentMethod: method})}
                          className={`p-3 rounded-xl border-2 font-black uppercase text-xs transition-all flex items-center justify-between ${
                            saleEditForm.paymentMethod === method 
                            ? 'border-yellow-500 bg-yellow-50 text-yellow-700' 
                            : 'border-gray-100 text-gray-400 hover:border-gray-200'
                          }`}
                        >
                          {method}
                          {saleEditForm.paymentMethod === method && <CheckCircle2 size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="font-black text-gray-700 uppercase text-xs tracking-widest block">Notas / Observaciones</label>
                    <textarea 
                      value={saleEditForm.notes || ''}
                      onChange={(e) => setSaleEditForm({...saleEditForm, notes: e.target.value})}
                      className="w-full h-full min-h-[160px] bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-700 outline-none focus:border-yellow-400 transition-colors resize-none"
                      placeholder="Agrega notas internas sobre esta venta..."
                    />
                  </div>
                </div>

                {editingSale.auditLog && editingSale.auditLog.length > 0 && (
                  <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-100">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                      <History size={12} /> Historial de Auditoría
                    </h4>
                    <div className="space-y-2 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar">
                      {editingSale.auditLog.map((log: any, idx: number) => (
                        <div key={idx} className="text-[10px] text-gray-500 flex justify-between items-start border-l-2 border-yellow-200 pl-2">
                          <span>{log.change}</span>
                          <span className="font-mono text-gray-300 shrink-0 ml-4">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button 
                    onClick={() => setEditingSale(null)}
                    className="flex-1 bg-gray-100 text-gray-400 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => {
                      const timestamp = new Date().toISOString();
                      const logs = editingSale.auditLog || [];
                      const changes = [];
                      
                      const oldMethod = editingSale.paymentMethod || editingSale.method;
                      if (oldMethod !== saleEditForm.paymentMethod) {
                        changes.push(`Método: ${oldMethod} -> ${saleEditForm.paymentMethod}`);
                      }
                      if (editingSale.notes !== saleEditForm.notes) {
                        changes.push(`Nota modificada`);
                      }

                      if (changes.length === 0) {
                        setEditingSale(null);
                        return;
                      }

                      const updatedSale = {
                        ...editingSale,
                        paymentMethod: saleEditForm.paymentMethod,
                        method: saleEditForm.paymentMethod, // Ensure sync
                        notes: saleEditForm.notes,
                        auditLog: [
                          ...logs,
                          {
                            timestamp,
                            change: changes.join(' | '),
                            user: 'Admin'
                          }
                        ]
                      };

                      setSalesHistory(prev => prev.map(s => s.id === editingSale.id ? updatedSale : s));
                      setEditingSale(null);
                      showMessage('Venta actualizada con éxito', 'success');
                    }}
                    className="flex-[2] bg-yellow-500 text-white py-4 rounded-2xl font-black text-xl shadow-[0_8px_0_0_rgba(202,138,4,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={20} /> GUARDAR CAMBIOS
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Gestión de Usuarios */}
      <AnimatePresence>
        {showUserDialog && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-blue-950/80 backdrop-blur-sm"
              onClick={() => setShowUserDialog(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[3rem] border-4 border-red-500 w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden"
            >
              <div className="bg-red-600 p-6 flex justify-between items-center text-white">
                <div className="flex items-center gap-3">
                  <Shield size={24} />
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    {userMode === 'nuevo' ? 'Crear Nuevo Usuario' : `Editar Usuario: ${userForm.name}`}
                  </h3>
                </div>
                <button onClick={() => setShowUserDialog(false)}>
                  <X size={28} />
                </button>
              </div>

              <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Nombre Completo</label>
                    <input 
                      type="text" 
                      value={userForm.name}
                      onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-gray-800 outline-none focus:border-red-500 transition-all uppercase"
                      placeholder="Ej: Juan Perez"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Nombre de Usuario (Login)</label>
                    <input 
                      type="text" 
                      value={userForm.username}
                      onChange={(e) => setUserForm({...userForm, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-gray-800 outline-none focus:border-red-500 transition-all"
                      placeholder="ej: juanp"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">PIN de Seguridad (4+ dígitos)</label>
                    <input 
                      type="password" 
                      value={userForm.pin}
                      onChange={(e) => setUserForm({...userForm, pin: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-black text-xl text-red-700 outline-none focus:border-red-500 transition-all tracking-[0.5em]"
                      placeholder="****"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Rol del Sistema</label>
                    <select 
                      value={userForm.role}
                      onChange={(e) => {
                        const role = e.target.value as any;
                        if (role === 'admin') {
                          const allOn = Object.keys(userForm.permissions).reduce((acc, k) => ({ ...acc, [k]: true }), {});
                          setUserForm({...userForm, role, permissions: allOn as any});
                        } else {
                          setUserForm({...userForm, role});
                        }
                      }}
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-gray-800 outline-none focus:border-red-500 transition-all"
                    >
                      <option value="cajero">Cajero (Limitado)</option>
                      <option value="admin">Administrador (Total)</option>
                    </select>
                  </div>
                </div>

                <div className="border-t-2 border-gray-100 pt-6">
                  <h4 className="text-sm font-black text-gray-800 uppercase italic tracking-tighter mb-4 flex items-center gap-2">
                    <Lock size={16} className="text-red-500" /> Permisos Específicos
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'canViewSales', label: 'Ver Historial de Ventas' },
                      { key: 'canDeleteSales', label: 'Eliminar/Anular Ventas' },
                      { key: 'canManageProducts', label: 'Gestionar Productos' },
                      { key: 'canManageInventory', label: 'Ajustar Inventario' },
                      { key: 'canManageCustomers', label: 'Gestionar Clientes' },
                      { key: 'canViewFinances', label: 'Ver Módulo de Finanzas' },
                      { key: 'canManageSalidas', label: 'Registrar Gastos/Salidas' },
                      { key: 'canManageSettings', label: 'Modificar Configuración' },
                      { key: 'canPerformCorte', label: 'Realizar Corte de Caja' },
                      { key: 'canManageUsers', label: 'Gestionar Otros Usuarios' },
                      { key: 'canEditPrices', label: 'Editar Precios en Carrito' },
                    ].map((perm) => (
                      <label 
                        key={perm.key}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          (userForm.role === 'admin' || (userForm.permissions as any)[perm.key])
                          ? 'border-green-400 bg-green-50 text-green-700'
                          : 'border-gray-100 text-gray-400 shadow-inner'
                        } ${userForm.role === 'admin' ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <span className="text-[11px] font-black uppercase tracking-tight">{perm.label}</span>
                        <input 
                          type="checkbox"
                          checked={userForm.role === 'admin' || (userForm.permissions as any)[perm.key]}
                          onChange={(e) => {
                            const newPerms = { ...userForm.permissions, [perm.key]: e.target.checked };
                            setUserForm({ ...userForm, permissions: newPerms });
                          }}
                          className="w-4 h-4 rounded text-green-600 focus:ring-green-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-2 bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
                   <input 
                     type="checkbox" 
                     id="user-active"
                     checked={userForm.active}
                     onChange={(e) => setUserForm({...userForm, active: e.target.checked})}
                     className="w-5 h-5 rounded border-gray-300 text-red-600"
                   />
                   <label htmlFor="user-active" className="text-xs font-black uppercase text-gray-700 cursor-pointer italic">Cuenta de usuario habilitada para el ingreso</label>
                </div>
              </div>

              <div className="p-8 bg-gray-50 flex gap-4">
                <button 
                  onClick={() => setShowUserDialog(false)}
                  className="flex-1 py-4 bg-white border-2 border-gray-200 rounded-2xl font-black text-gray-400 uppercase tracking-widest hover:bg-gray-100 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={saveUser}
                  className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-black text-xl shadow-[0_8px_0_0_rgba(185,28,28,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  <Save size={24} /> {userMode === 'nuevo' ? 'CREAR USUARIO' : 'GUARDAR CAMBIOS'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. MODAL DE COBRO (ESTILO IMAGEN) */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row border-2 border-gray-200"
            >
              {/* Área Principal */}
              <div className="flex-1 flex flex-col bg-gray-50">
                {/* Header Azul */}
                <div className="bg-blue-600 p-3 flex justify-between items-center text-white font-black italic">
                  <span className="text-xl tracking-wider">COBRAR</span>
                  <button onClick={() => setIsCheckoutOpen(false)} className="hover:bg-blue-700 p-1 rounded">
                    <X size={24} />
                  </button>
                </div>

                <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
                  <h3 className="text-2xl font-bold text-gray-600 mb-2">Total a Cobrar</h3>
                  <div className="text-8xl font-black text-blue-700 mb-12">
                    ${total.toFixed(2)}
                  </div>

                  {/* Métodos de Pago */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 w-full max-w-4xl mb-12">
                    {[
                      { id: 'efectivo', label: 'Efectivo', icon: Banknote, color: 'bg-blue-500' },
                      { id: 'financiamiento', label: 'Financiar', icon: CreditCard, color: 'bg-yellow-500' },
                      { id: 'transferencia', label: 'Transferencia', icon: ArrowRightLeft, color: 'bg-purple-500' },
                      { id: 'dolares', label: 'Dólares', icon: DollarSign, color: 'bg-green-500' },
                      { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard, color: 'bg-cyan-500' },
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex flex-col items-center gap-2 group transition-all ${paymentMethod === method.id ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
                      >
                        <div className={`p-4 rounded-xl shadow-lg text-white transition-transform ${method.color} ${paymentMethod === method.id ? 'ring-4 ring-blue-200' : ''}`}>
                          <method.icon size={32} />
                        </div>
                        <span className={`text-xs font-black uppercase ${paymentMethod === method.id ? 'text-blue-700' : 'text-gray-500'}`}>
                          {method.label}
                        </span>
                        {paymentMethod === method.id && (
                          <motion.div layoutId="active-arrow" className="text-blue-600">
                            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-current" />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Inputs de Pago */}
                  <div className="space-y-6 w-full max-w-md">
                    {paymentMethod === 'financiamiento' ? (
                      <div className="space-y-4">
                        <label className="text-2xl font-bold text-gray-700 block">Plan de Financiamiento:</label>
                        <CustomerSearchSelect 
                          customers={customersList}
                          value={selectedCustomerId}
                          onChange={setSelectedCustomerId}
                          placeholder="-- Seleccione Cliente --"
                          colorScheme="yellow"
                          className="mb-4"
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-black uppercase text-gray-400">Enganche (Inicial)</label>
                            <input 
                              type="number"
                              value={financingForm.downPayment !== undefined ? financingForm.downPayment : ''}
                              onChange={(e) => setFinancingForm({...financingForm, downPayment: parseFloat(e.target.value) || 0})}
                              className="w-full bg-white border-2 border-gray-200 rounded-lg p-2 font-black text-gray-700"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-black uppercase text-gray-400">Cuotas</label>
                            <input 
                              type="number"
                              value={financingForm.installments !== undefined ? financingForm.installments : ''}
                              onChange={(e) => setFinancingForm({...financingForm, installments: parseInt(e.target.value) || 1})}
                              className="w-full bg-white border-2 border-gray-200 rounded-lg p-2 font-black text-gray-700"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase text-gray-400">Monto de cada Cuota ($)</label>
                          <input 
                            type="number"
                            value={financingForm.installmentAmount !== undefined ? financingForm.installmentAmount : ''}
                            onChange={(e) => setFinancingForm({...financingForm, installmentAmount: parseFloat(e.target.value) || 0})}
                            placeholder="Ej: 500"
                            className="w-full bg-white border-2 border-gray-200 rounded-lg p-2 font-black text-gray-700"
                          />
                        </div>

                        <div className="bg-yellow-100 p-3 rounded-xl border border-yellow-200">
                          <div className="flex justify-between text-[10px] font-black uppercase text-yellow-700">
                            <span>Suma Enganche + Cuotas:</span>
                            <span>${(financingForm.downPayment + (financingForm.installments * (financingForm.installmentAmount || 0))).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-[10px] font-black uppercase text-gray-500 mt-1">
                            <span>Total de Venta:</span>
                            <span>${total.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase text-gray-400">Frecuencia de Pago</label>
                          <div className="flex gap-2">
                            {['semanal', 'quincenal', 'mensual'].map(f => (
                              <button 
                                key={f}
                                onClick={() => setFinancingForm({...financingForm, frequency: f as any})}
                                className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition-all ${
                                  financingForm.frequency === f 
                                  ? 'bg-yellow-500 text-white shadow-lg' 
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                        </div>

                        {selectedCustomerId && (
                          <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-100 text-left">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold text-gray-500">Monto Restante:</span>
                              <span className="text-lg font-black text-yellow-700">${(total - financingForm.downPayment).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-gray-500">Monto por Cuota:</span>
                              <span className="text-lg font-black text-yellow-700">${((total - financingForm.downPayment) / financingForm.installments).toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : paymentMethod === 'tarjeta' ? (
                      <div className="space-y-6">
                        <label className="text-2xl font-bold text-gray-700 block">Pago con Tarjeta:</label>
                        <div className="bg-cyan-50 p-6 rounded-3xl border-2 border-cyan-100 space-y-6">
                           <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border-2 border-cyan-100 mb-4">
                             <div className="bg-cyan-500 p-3 rounded-xl text-white">
                               <CreditCard size={32} />
                             </div>
                             <div className="text-left">
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Método Seguro</p>
                               <p className="text-lg font-black text-cyan-700 italic">VOUCHER BANCARIO</p>
                             </div>
                           </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-cyan-700 tracking-widest pl-1 font-mono">Número de Referencia (Voucher)</label>
                            <input 
                              type="text"
                              value={cardForm.reference || ''}
                              onChange={(e) => setCardForm({ reference: e.target.value })}
                              placeholder="Ej: 000123456"
                              className="w-full bg-white border-2 border-cyan-200 rounded-2xl p-4 text-3xl font-black text-gray-800 focus:border-cyan-500 outline-none transition-all shadow-sm font-mono"
                              autoFocus
                            />
                          </div>
                          <p className="text-[10px] text-gray-400 font-bold text-center italic">Ingrese solo el número de aprobación o referencia impreso en el recibo del banco.</p>
                        </div>
                      </div>
                    ) : paymentMethod === 'transferencia' ? (
                      <div className="space-y-6">
                        <label className="text-2xl font-bold text-gray-700 block">Detalles de Transferencia:</label>
                        <div className="bg-purple-50 p-6 rounded-3xl border-2 border-purple-100 space-y-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-purple-700 tracking-widest pl-1">Banco de Destino</label>
                            <select 
                              value={transferForm.bank}
                              onChange={(e) => setTransferForm({...transferForm, bank: e.target.value})}
                              className="w-full bg-white border-2 border-purple-200 rounded-2xl p-4 font-bold text-gray-800 focus:border-purple-500 outline-none transition-all shadow-sm appearance-none cursor-pointer"
                            >
                              <option value="">-- Seleccione Banco --</option>
                              {BANKS.map(bank => (
                                <option key={bank} value={bank}>{bank}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-purple-700 tracking-widest pl-1">Número de Referencia / Comprobante</label>
                            <input 
                              type="text"
                              value={transferForm.reference || ''}
                              onChange={(e) => setTransferForm({...transferForm, reference: e.target.value})}
                              placeholder="Ej: 98213872"
                              className="w-full bg-white border-2 border-purple-200 rounded-2xl p-4 font-bold text-gray-800 focus:border-purple-500 outline-none transition-all shadow-sm"
                            />
                          </div>
                        </div>
                        <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-2xl text-left">
                          <p className="text-xs font-bold text-yellow-700">Verifique que la transferencia se haya realizado correctamente antes de confirmar esta venta.</p>
                        </div>
                      </div>
                    ) : paymentMethod === 'dolares' ? (
                      <div className="space-y-6">
                        <label className="text-2xl font-bold text-gray-700 block">Cobro en Dólares (USD):</label>
                        <div className="bg-green-50 p-8 rounded-[2rem] border-2 border-green-200 shadow-inner space-y-6">
                          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border-2 border-green-100">
                             <div className="text-left">
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tasa de Cambio</p>
                               <div className="flex items-center gap-2">
                                 <span className="font-black text-green-600">1 USD =</span>
                                 <input 
                                   type="number"
                                   value={usdRate}
                                   onChange={(e) => setUsdRate(parseFloat(e.target.value) || 0)}
                                   className="w-16 bg-green-50 border-b-2 border-green-200 font-black text-green-700 outline-none text-center"
                                 />
                                 <span className="font-black text-green-600">DOP</span>
                               </div>
                             </div>
                             <div className="text-right">
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total en USD</p>
                               <p className="text-2xl font-black text-gray-800">${(total / usdRate).toFixed(2)}</p>
                             </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-green-700 tracking-widest pl-1">Efectivo Recibido (USD)</label>
                            <div className="relative">
                              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400" size={24} />
                              <input 
                                type="number"
                                value={usdPaidAmount || ''}
                                onChange={(e) => setUsdPaidAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-white border-2 border-green-200 rounded-2xl p-4 pl-12 text-3xl font-black text-gray-800 focus:border-green-500 outline-none transition-all shadow-sm"
                                autoFocus
                              />
                            </div>
                          </div>

                          {parseFloat(usdPaidAmount) > (total / usdRate) && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white p-6 rounded-2xl border-2 border-yellow-400 shadow-lg text-center"
                            >
                              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Devuelta en Pesos (DOP)</p>
                              <p className="text-4xl font-black text-red-600">
                                ${(parseFloat(usdPaidAmount) * usdRate - total).toFixed(2)}
                              </p>
                              <p className="text-[10px] font-bold text-yellow-600 mt-2 italic">Calculado a tasa de {usdRate} DOP/USD</p>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl text-left">
                          <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Nombre Facturado a:</div>
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-black text-gray-800 uppercase italic">
                              {selectedCustomerId 
                                ? customersList.find(c => c.id === selectedCustomerId)?.name 
                                : 'CLIENTE GENÉRICO'}
                            </span>
                            <button 
                              onClick={() => {
                                setIsCheckoutOpen(false);
                                ventasSearchRef.current?.focus();
                              }}
                              className="text-xs font-bold text-blue-600 hover:underline"
                            >
                              Cambiar
                            </button>
                          </div>
                          {selectedCustomerId && customersList.find(c => c.id === selectedCustomerId)?.rnc && (
                            <div className="text-xs font-bold text-gray-400">RNC: {customersList.find(c => c.id === selectedCustomerId)?.rnc}</div>
                          )}
                          {selectedCustomerId && customersList.find(c => c.id === selectedCustomerId)?.discountPercentage ? (
                            <div className="text-xs font-black text-green-600 uppercase mt-1">
                              Descuento Aplicado: {customersList.find(c => c.id === selectedCustomerId)?.discountPercentage}%
                            </div>
                          ) : null}
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <label className="text-2xl font-bold text-gray-700 whitespace-nowrap">Pagó Con:</label>
                          <div className="relative flex-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-700 font-black text-2xl">$</span>
                            <input 
                              type="number"
                              value={paidAmount || ''}
                              onChange={(e) => setPaidAmount(e.target.value)}
                              className="w-full bg-white border-2 border-green-600 rounded-lg p-4 pl-10 text-3xl font-black text-green-700 outline-none focus:ring-4 focus:ring-green-100 transition-all"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <label className="text-2xl font-bold text-gray-700 whitespace-nowrap">Su Cambio:</label>
                          <div className="flex-1 text-left">
                            <span className="text-4xl font-black text-green-600">
                              ${change.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar de Acciones */}
              <div className="w-full md:w-[320px] bg-blue-50 p-6 border-l-2 border-gray-200 flex flex-col gap-4">
                <button 
                  onClick={() => confirmSale('print')}
                  className="w-full bg-white border-2 border-gray-300 p-4 rounded-lg flex items-center gap-3 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all group"
                >
                  <div className="bg-gray-100 p-2 rounded group-hover:bg-blue-500">
                    <Printer size={20} className="text-gray-600 group-hover:text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-black opacity-60">F1</div>
                    <div className="font-bold leading-tight">Cobrar e Imprimir Ticket</div>
                  </div>
                </button>

                <button 
                  onClick={() => confirmSale('whatsapp')}
                  className="w-full bg-white border-2 border-gray-300 p-4 rounded-lg flex items-center gap-3 hover:bg-green-600 hover:text-white hover:border-green-600 transition-all group"
                >
                  <div className="bg-gray-100 p-2 rounded group-hover:bg-green-500">
                    <MessageCircle size={20} className="text-green-600 group-hover:text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-black opacity-60">F3</div>
                    <div className="font-bold leading-tight">Cobrar y Enviar WhatsApp</div>
                  </div>
                </button>

                <button 
                  onClick={() => confirmSale('none')}
                  className="w-full bg-white border-2 border-gray-300 p-4 rounded-lg flex items-center gap-3 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all group"
                >
                  <div className="bg-gray-100 p-2 rounded group-hover:bg-blue-500">
                    <Save size={20} className="text-gray-600 group-hover:text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-black opacity-60">F2</div>
                    <div className="font-bold leading-tight">Cobrar solo registrando la venta</div>
                  </div>
                </button>

                <button 
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-full bg-white border-2 border-gray-300 p-4 rounded-lg flex items-center gap-3 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all group"
                >
                  <div className="bg-gray-100 p-2 rounded group-hover:bg-red-500">
                    <X size={20} className="text-red-600 group-hover:text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-black opacity-60">ESC</div>
                    <div className="font-bold leading-tight">Cancelar</div>
                  </div>
                </button>

                <div className="mt-auto pt-8 border-t-2 border-blue-100">
                  <button 
                    onClick={() => setShowNoteDialog(true)}
                    className={`w-full border-2 p-4 rounded-lg flex items-center gap-3 transition-all mb-8 ${
                      saleNote ? 'bg-yellow-50 border-yellow-400 text-yellow-700' : 'bg-white border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <FileText size={20} className={saleNote ? 'text-yellow-600' : 'text-gray-400'} />
                    <div className="text-left">
                      <div className="text-[10px] font-black opacity-60">F4</div>
                      <div className="font-bold leading-tight">{saleNote ? 'Editar Nota' : 'Ingresar notas'}</div>
                    </div>
                    {saleNote && <div className="ml-auto w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />}
                  </button>

                  <div className="text-center">
                    <h4 className="text-blue-900 font-black uppercase text-sm mb-1">Total de Artículos:</h4>
                    <div className="text-6xl font-black text-blue-700">{totalItems}</div>
                  </div>
                </div>
              </div>

              {/* Modal de Notas */}
              <AnimatePresence>
                {showNoteDialog && (
                  <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowNoteDialog(false)}
                      className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm"
                    />
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-white rounded-3xl p-8 w-full max-w-md relative z-10 shadow-2xl border-4 border-blue-600"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3 text-blue-600">
                          <FileText size={24} />
                          <h3 className="text-2xl font-black uppercase tracking-tighter italic">Nota del Ticket</h3>
                        </div>
                        <button onClick={() => setShowNoteDialog(false)} className="text-gray-400">
                          <X size={24} />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Escriba una nota especial para imprimir en el ticket:</p>
                        <textarea 
                          autoFocus
                          value={saleNote || ''}
                          onChange={(e) => setSaleNote(e.target.value)}
                          placeholder="Ej: Regalo para Juan, Frágil, Entregar en portería..."
                          rows={6}
                          className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold text-gray-800 outline-none focus:border-blue-500 transition-all resize-none"
                        />
                      </div>

                      <button 
                        onClick={() => setShowNoteDialog(false)}
                        className="w-full mt-8 bg-blue-600 text-white py-4 rounded-2xl font-black text-xl shadow-[0_6px_0_0_rgba(29,78,216,1)] active:translate-y-1 active:shadow-none transition-all"
                      >
                        GUARDAR NOTA
                      </button>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Success Overlay Interno */}
              <AnimatePresence>
                {showSuccess && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-green-500 z-[110] flex flex-col items-center justify-center p-8 text-center text-white"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 12 }}
                    >
                      <CheckCircle size={120} className="mb-6" />
                    </motion.div>
                    <h2 className="text-5xl font-black mb-2 italic">¡VENTA EXITOSA!</h2>
                    <p className="text-green-100 font-bold text-xl">Procesando transacción...</p>
                    {saleNote && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-white/20 rounded-2xl border border-white/30 max-w-sm"
                      >
                        <p className="text-[10px] font-black uppercase tracking-widest text-yellow-300 mb-1">Nota en Ticket:</p>
                        <p className="font-bold text-sm italic">"{saleNote}"</p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Vista Previa de Cotización */}
      <AnimatePresence>
        {viewingQuotation && (
          <div className="fixed inset-0 z-[350] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingQuotation(null)}
              className="absolute inset-0 bg-orange-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 40, opacity: 0 }}
              className="bg-white rounded-[3rem] w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden flex flex-col border-4 border-orange-400"
            >
              <div className="bg-orange-600 p-8 text-white flex justify-between items-center h-48 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 flex flex-wrap gap-8 items-center justify-center pointer-events-none">
                  <FileText size={120} />
                  <FileText size={120} />
                  <FileText size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-white/20 p-2 rounded-xl">
                      <FileText size={24} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-orange-200">Cotización Formal</span>
                  </div>
                  <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none">PRESUPUESTO</h2>
                  <p className="text-orange-200 font-bold opacity-80 mt-1">ID: #{viewingQuotation.id.toString().slice(-8)}</p>
                </div>
                <button onClick={() => setViewingQuotation(null)} className="relative z-10 bg-white/20 hover:bg-white/30 p-3 rounded-full transition-colors">
                  <X size={28} />
                </button>
              </div>

              <div className="p-8 flex-1 overflow-y-auto custom-scrollbar bg-orange-50/30">
                <div className="grid grid-cols-2 gap-8 mb-8 bg-white p-6 rounded-[2rem] border-2 border-orange-100 shadow-sm">
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Vendedor</span>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="text-orange-400" size={16} />
                        <span className="font-bold text-gray-800 uppercase">{ticketConfig.storeName}</span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Emisión</span>
                      <div className="flex items-center gap-2 mt-1 text-gray-600 font-bold">
                        <Calendar size={16} />
                        <span>{new Date(viewingQuotation.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Cliente</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Users className="text-orange-400" size={16} />
                        <span className="font-bold text-gray-800 uppercase">{viewingQuotation.customerName}</span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-red-400 tracking-widest pl-1">Vencimiento</span>
                      <div className="flex items-center gap-2 mt-1 text-red-600 font-bold">
                        <Clock size={16} />
                        <span>{new Date(viewingQuotation.validUntil).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] border-2 border-orange-100 shadow-sm overflow-hidden mb-8">
                  <div className="bg-orange-50 px-6 py-4 border-b-2 border-orange-100 flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-orange-600">Detalle de Productos</span>
                    <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {viewingQuotation.items.length} Refs
                    </span>
                  </div>
                  <div className="p-6 space-y-4">
                    {viewingQuotation.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center gap-4 group">
                        <div className="flex-1">
                          <h5 className="font-black text-gray-800 uppercase text-sm leading-tight group-hover:text-orange-600 transition-colors">{item.name}</h5>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cant: {item.quantity} x ${item.price.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 p-6 border-t-2 border-orange-100 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span className="text-gray-800 font-black">${(viewingQuotation.total / (viewingQuotation.itbis > 0 ? 1.18 : 1)).toFixed(2)}</span>
                    </div>
                    {viewingQuotation.itbis > 0 && (
                      <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <span>ITBIS (18%)</span>
                        <span className="text-gray-800 font-black">${viewingQuotation.itbis.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 text-3xl font-black text-orange-600 tracking-tighter uppercase italic">
                      <span>Total Garantizado</span>
                      <span>${viewingQuotation.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-100/50 p-6 rounded-[2rem] border-2 border-orange-200 border-dashed text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-orange-700 italic mb-1">Nota Legal</p>
                  <p className="text-[10px] font-bold text-orange-600 leading-tight">
                    Precios sujetos a cambio sin previo aviso. Esta cotización es informativa y no garantiza disponibilidad de stock hasta el momento de la facturación formal. Válido por 15 días calendario.
                  </p>
                </div>
              </div>

              <div className="p-8 bg-white border-t-4 border-orange-400 grid grid-cols-3 gap-4">
                <button 
                  onClick={() => handlePrintQuotation(viewingQuotation)}
                  className="flex items-center justify-center gap-3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-5 rounded-2xl font-black uppercase tracking-widest transition-all"
                >
                  <Printer size={24} /> Imprimir
                </button>
                <button 
                  onClick={() => handleShareQuotationWhatsApp(viewingQuotation)}
                  className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-400 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-[0_6px_0_0_rgba(21,128,61,1)] active:translate-y-1 active:shadow-none transition-all"
                >
                  <MessageCircle size={24} /> WhatsApp
                </button>
                <button 
                  onClick={() => convertQuotationToCart(viewingQuotation)}
                  className="flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-[0_6px_0_0_rgba(154,52,18,1)] active:translate-y-1 active:shadow-none transition-all"
                >
                  <ShoppingCart size={24} /> Facturar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Poner en Espera */}
      <AnimatePresence>
        {showHoldDialog && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHoldDialog(false)}
              className="absolute inset-0 bg-red-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] border-4 border-yellow-400 p-8 w-full max-w-md relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-red-600 p-3 rounded-2xl text-white">
                    <Clock size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tighter uppercase italic">Nueva Cuenta en Espera</h3>
                </div>
                <button 
                  onClick={() => setShowHoldDialog(false)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Identificador de la Cuenta:</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <Tag size={20} />
                    </div>
                    <input 
                      autoFocus
                      type="text"
                      value={holdAccountName}
                      onChange={(e) => setHoldAccountName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmHoldCart();
                        if (e.key === 'Escape') setShowHoldDialog(false);
                      }}
                      placeholder="Ej: Mesa 1, Juan Pérez..."
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-800 outline-none focus:border-red-600 transition-all text-lg"
                    />
                  </div>
                  <p className="mt-2 text-[10px] font-bold text-gray-400 italic">Este nombre te ayudará a encontrar la cuenta más tarde.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <button 
                  onClick={() => setShowHoldDialog(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 py-4 rounded-2xl font-black text-lg transition-all"
                >
                  CANCELAR
                </button>
                <button 
                  onClick={confirmHoldCart}
                  className="bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black text-lg shadow-[0_6px_0_0_rgba(185,28,28,1)] active:translate-y-1 active:shadow-none transition-all"
                >
                  GUARDAR
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Modal de Historial de Pagos de Financiamiento */}
      <AnimatePresence>
        {viewingHistoryId !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[120] flex items-center justify-center p-4"
            onClick={() => setViewingHistoryId(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-4 border-yellow-400"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-8 text-white relative">
                <button 
                  onClick={() => setViewingHistoryId(null)}
                  className="absolute right-6 top-6 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center text-3xl font-black backdrop-blur-sm border border-white/30">
                    {(() => {
                      const f = financingsList.find(x => x.id === viewingHistoryId);
                      return f ? f.customerName.charAt(0) : '?';
                    })()}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter">Historial de Pagos</h3>
                    <p className="font-bold opacity-80">
                      {financingsList.find(x => x.id === viewingHistoryId)?.customerName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 flex-1 overflow-y-auto custom-scrollbar max-h-[60vh]">
                <div className="space-y-4">
                  {(() => {
                    const f = financingsList.find(x => x.id === viewingHistoryId);
                    if (!f) return null;
                    
                    const allPayments = [...f.payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    
                    if (allPayments.length === 0) {
                      return (
                        <div className="text-center py-20 opacity-20">
                          <History size={80} className="mx-auto mb-4" />
                          <p className="text-2xl font-black uppercase tracking-widest">Sin pagos registrados</p>
                        </div>
                      );
                    }

                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="bg-yellow-50 p-4 rounded-2xl border-2 border-yellow-100 text-center">
                            <span className="text-[10px] font-black uppercase text-yellow-600 block mb-1">Monto de Venta</span>
                            <span className="text-xl font-black text-gray-800">${f.totalAmount.toFixed(2)}</span>
                          </div>
                          <div className="bg-red-50 p-4 rounded-2xl border-2 border-red-100 text-center">
                            <span className="text-[10px] font-black uppercase text-red-600 block mb-1">Saldo Pendiente</span>
                            <span className="text-xl font-black text-red-600">${f.remainingAmount.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {allPayments.map((p, idx) => (
                            <motion.div 
                              key={p.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="bg-gray-50 p-5 rounded-3xl border-2 border-gray-100 flex justify-between items-center group hover:border-green-300 transition-all shadow-sm"
                            >
                              <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 shadow-inner">
                                  <Check size={20} />
                                </div>
                                <div className="text-left">
                                  <div className="text-sm font-black text-gray-800 uppercase tracking-tight line-clamp-1">{p.note}</div>
                                  <div className="text-[10px] font-bold text-gray-400 mt-0.5">{new Date(p.date).toLocaleString()}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-black text-green-600">+ ${p.amount.toFixed(2)}</div>
                                <div className="text-[9px] font-black uppercase text-gray-300 tracking-widest">Confirmado</div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="p-8 bg-gray-50 border-t-2 border-gray-100 flex justify-center">
                <button 
                  onClick={() => setViewingHistoryId(null)}
                  className="bg-yellow-500 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_5px_0_0_rgba(202,138,4,1)] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
                >
                  Cerrar Historial
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="max-w-[1800px] mx-auto px-4 lg:px-6 pb-12 flex flex-col sm:flex-row justify-between items-center gap-4 text-gray-400 font-bold text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <User size={16} /> Cajero: <span className="text-red-600">Izar Salas</span>
          </div>
          <div className="h-4 w-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <Package size={16} /> Terminal: <span className="text-red-600">POS-01</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          Estado del Sistema: <span className="flex items-center gap-1 text-green-600"><CheckCircle size={14} /> En Línea</span>
        </div>
      </footer>

      <style>{`
        html {
          scrollbar-gutter: stable;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
