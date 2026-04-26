import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Student, Fee, Expense, Attendance, Test, TestResult, StudyMaterial, Notice, User, UserRole } from '../types';

// Fallback for crypto.randomUUID
const uuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const shortId = () => {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
};

interface StorageContextType {
  students: Student[];
  fees: Fee[];
  expenses: Expense[];
  attendance: Attendance[];
  tests: Test[];
  testResults: TestResult[];
  materials: StudyMaterial[];
  notices: Notice[];
  users: User[];
  currentUser: User | null;
  
  login: (username: string, password: string, role: UserRole) => Promise<boolean>;
  signup: (user: Omit<User, 'id'>) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: User) => void;
  addLog: (action: string, details: string) => void;
  
  addStudent: (student: Omit<Student, 'id' | 'admissionDate' | 'status'>) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  removeStudentPermanently: (id: string) => void;
  approveStudent: (id: string) => void;
  rejectStudent: (id: string) => void;
  
  addFee: (fee: Omit<Fee, 'id'>) => void;
  updateFee: (fee: Fee) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  
  markAttendance: (date: string, studentId: string, status: 'present' | 'absent') => void;
  
  addTest: (test: Omit<Test, 'id'>) => void;
  submitTestResult: (result: Omit<TestResult, 'id'>) => void;
  
  addMaterial: (material: Omit<StudyMaterial, 'id' | 'uploadDate'>) => void;
  deleteMaterial: (id: string) => void;
  addNotice: (notice: Omit<Notice, 'id' | 'date'>) => void;
  deleteNotice: (id: string) => void;
  deleteTest: (id: string) => void;
  deleteFee: (id: string) => void;
  clearAllData: () => void;
  scriptUrl: string;
  refreshCloudData: () => Promise<void>;
  syncError: string | null;
  isInitialSyncing: boolean;
}

// -------------------------------------------------------------------------
// CLOUD SYNC CONFIGURATION
// 1. Deploy your Google Apps Script as a Web App.
// 2. Paste the Web App URL here.
// -------------------------------------------------------------------------
const SCRIPT_URL: string = 'https://script.google.com/macros/s/AKfycbwB0AYIxBHhyJswPNZJyEorTvNE-h8PnwetVlrIt3KJACEwjXvNZ_-0Jsw59HBy0FAJaw/exec';
// -------------------------------------------------------------------------

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('utc_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isInitialSyncing, setIsInitialSyncing] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => localStorage.getItem('utc_last_sync'));
  
  const scriptUrl = SCRIPT_URL;

  const syncToCloud = async () => {
    if (!scriptUrl || scriptUrl === 'YOUR_APPS_SCRIPT_URL_HERE') return;
    try {
      setSyncError(null);
      
      // Enrich data for sheets as requested
      const enrichedFees = fees.map(f => ({
        ...f,
        studentName: students.find(s => s.id === f.studentId)?.name || 'Unknown'
      }));

      const enrichedAttendance = attendance.map(a => ({
        ...a,
        studentName: students.find(s => s.id === a.studentId)?.name || 'Unknown'
      }));

      const enrichedTestResults = testResults.map(tr => ({
        ...tr,
        studentName: students.find(s => s.id === tr.studentId)?.name || 'Unknown'
      }));

      const payload = {
        type: 'BACKUP',
        action: 'SYNC_ALL',
        data: {
          students, 
          approvedStudents: students.filter(s => s.status === 'approved'),
          pendingAdmissions: students.filter(s => s.status === 'pending'),
          deletedStudents: students.filter(s => s.status === 'deleted'),
          fees: enrichedFees, 
          expenses, 
          attendance: enrichedAttendance, 
          tests, 
          testResults: enrichedTestResults, 
          materials, 
          notices, 
          users,
          logs: JSON.parse(localStorage.getItem('utc_activity_logs') || '[]')
        }
      };

      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload)
      });
      console.log('Cloud Sync Triggered');
      setLastSyncTime(new Date().toISOString());
      localStorage.setItem('utc_last_sync', new Date().toISOString());
    } catch (e: any) {
      console.error('Cloud Sync Failed:', e);
      setSyncError(e.message || 'Sync failed');
    }
  };

  // Sync to cloud when data changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only sync if we have data and we're not in the middle of an initial load
      if (!isInitialSyncing && (students.length > 0 || users.length > 0)) {
        syncToCloud();
      }
    }, 2000); // 2 second debounce
    return () => clearTimeout(timer);
  }, [students, fees, expenses, attendance, tests, testResults, materials, notices, users]);

  const refreshCloudData = useCallback(async () => {
    if (!scriptUrl || scriptUrl === 'YOUR_APPS_SCRIPT_URL_HERE') {
      setIsInitialSyncing(false);
      return;
    }
    setIsInitialSyncing(true);
    try {
      setSyncError(null);
      const url = new URL(scriptUrl);
      url.searchParams.set('_t', Date.now().toString());

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (data) {
          if (data.students) setStudents(data.students);
          if (data.fees) setFees(data.fees);
          if (data.expenses) setExpenses(data.expenses);
          if (data.users) setUsers(data.users);
          if (data.notices) setNotices(data.notices);
          if (data.materials) setMaterials(data.materials);
          if (data.tests) setTests(data.tests);
          if (data.testResults) setTestResults(data.testResults);
          if (data.attendance) setAttendance(data.attendance);
          
          setLastSyncTime(new Date().toISOString());
          localStorage.setItem('utc_last_sync', new Date().toISOString());
        }
      } catch (parseError) {
        console.error('Cloud response was not valid JSON. Response start:', text.substring(0, 50));
        setSyncError('Invalid cloud response format');
        if (text.includes("Online") || text.includes("UTC Backend")) {
          throw new Error("RE-DEPLOYMENT REQUIRED: You updated the Apps Script code but didn't create a 'New Version'. Go to Deploy > Manage Deployments > Edit > Version: New Version > Deploy.");
        }
        throw new Error("Invalid Cloud Response: The script is returning plain text instead of data.");
      }
    } catch (e: any) {
      console.error('Failed to fetch from cloud:', e);
      setSyncError(e.message || 'Cloud fetch failed');
      // Don't re-throw here to avoid app crashing if initial fetch fails
    } finally {
      setIsInitialSyncing(false);
    }
  }, [scriptUrl]);

  // Initial data load from cloud
  useEffect(() => {
    if (scriptUrl) {
      refreshCloudData().catch(e => console.error("Initial sync error:", e));
    } else {
      setIsInitialSyncing(false);
    }
  }, [scriptUrl, refreshCloudData]);

  // Auth logic
  const login = async (username: string, password: string, role: UserRole) => {
    try {
      const cleanUsername = username.trim();
      const cleanPassword = password.trim();

      if (!cleanUsername || !cleanPassword) return false;

      // 0. Emergency Fallback: Default admin (always available if users list is problematic)
      if (role === 'admin' && cleanUsername === 'admin' && (cleanPassword === 'admin123' || cleanPassword === '123')) {
        const fallbackAdmin: User = { id: 'sys-admin', username: 'admin', name: 'System Administrator', role: 'admin' };
        setCurrentUser(fallbackAdmin);
        localStorage.setItem('utc_current_user', JSON.stringify(fallbackAdmin));
        return true;
      }

      // 1. Try matching a registered account
      const user = users.find(u => 
        u && 
        u.username && 
        u.username.trim() === cleanUsername && 
        u.password === cleanPassword && 
        u.role === role
      );
      
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('utc_current_user', JSON.stringify(user));
        return true;
      }

      // 2. Fallback for Students: Login via Roll Number
      if (role === 'student') {
        const student = students.find(s => s.status === 'approved' && s.rollNumber?.trim() === cleanUsername);
        if (student && cleanPassword === cleanUsername) {
          const studentUser: User = { 
            id: student.id, 
            username: student.rollNumber!, 
            name: student.name, 
            role: 'student' 
          };
          setCurrentUser(studentUser);
          localStorage.setItem('utc_current_user', JSON.stringify(studentUser));
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error("Login logic error:", e);
      throw new Error("Local security check failed. Please refresh.");
    }
  };

  const signup = async (u: Omit<User, 'id'>) => {
    const newUser: User = { ...u, id: uuid() };
    setUsers([...users, newUser]);
    // syncToCloud is triggered by useEffect on users change
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('utc_current_user');
  };

  const updateUser = (u: User) => {
    setUsers(users.map(user => user.id === u.id ? u : user));
    if (currentUser?.id === u.id) {
       setCurrentUser(u);
       localStorage.setItem('utc_current_user', JSON.stringify(u));
    }
    addLog('USER_UPDATE', `Updated user credentials for ${u.username}`);
  };

  const addLog = (action: string, details: string) => {
    const newLog = {
      timestamp: new Date().toISOString(),
      user: currentUser ? `${currentUser.name} (${currentUser.role})` : 'System',
      action,
      details
    };
    const currentLogs = JSON.parse(localStorage.getItem('utc_activity_logs') || '[]');
    const updatedLogs = [newLog, ...currentLogs].slice(0, 100); // Keep last 100
    localStorage.setItem('utc_activity_logs', JSON.stringify(updatedLogs));
  };

  // Load from localStorage for initial offline access
  useEffect(() => {
    const load = (key: string, setter: any) => {
      const data = localStorage.getItem(key);
      if (data) setter(JSON.parse(data));
    };

    load('utc_students', setStudents);
    load('utc_fees', setFees);
    load('utc_expenses', setExpenses);
    load('utc_attendance', setAttendance);
    load('utc_tests', setTests);
    load('utc_testResults', setTestResults);
    load('utc_materials', setMaterials);
    load('utc_notices', setNotices);
    load('utc_users', setUsers);
  }, []);

  // Persistence
  useEffect(() => { localStorage.setItem('utc_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('utc_fees', JSON.stringify(fees)); }, [fees]);
  useEffect(() => { localStorage.setItem('utc_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('utc_attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('utc_tests', JSON.stringify(tests)); }, [tests]);
  useEffect(() => { localStorage.setItem('utc_testResults', JSON.stringify(testResults)); }, [testResults]);
  useEffect(() => { localStorage.setItem('utc_materials', JSON.stringify(materials)); }, [materials]);
  useEffect(() => { localStorage.setItem('utc_notices', JSON.stringify(notices)); }, [notices]);
  useEffect(() => { localStorage.setItem('utc_users', JSON.stringify(users)); }, [users]);

  const clearAllData = () => {
    const keys = ['students', 'fees', 'expenses', 'attendance', 'tests', 'testResults', 'materials', 'notices', 'users'];
    keys.forEach(k => localStorage.removeItem(`utc_${k}`));
    setStudents([]); setFees([]); setExpenses([]); setAttendance([]); setTests([]); setTestResults([]); setMaterials([]); setNotices([]); setUsers([]);
  };

  const addStudent = (s: Omit<Student, 'id' | 'admissionDate' | 'status'>) => {
    const newStudent: Student = { 
      ...s, 
      id: shortId(), 
      admissionDate: new Date().toISOString(), 
      status: 'pending',
      rollNumber: 'N/A'
    };
    setStudents([...students, newStudent]);
    addLog('ADMISSION_REQUEST', `New admission request from ${s.name} for class ${s.class}`);
  };

  const updateStudent = (s: Student) => {
    setStudents(prev => prev.map(st => st.id === s.id ? s : st));
    addLog('STUDENT_UPDATE', `Updated profile/roll number for student: ${s.name}`);
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.map(st => st.id === id ? { ...st, status: 'deleted' } : st));
    addLog('STUDENT_TRASH', `Moved student record ${id} to trash`);
  };

  const removeStudentPermanently = (id: string) => {
    setStudents(prev => prev.filter(st => st.id !== id));
    addLog('STUDENT_DELETE', `Permanently deleted student record ${id}`);
  };
  
  const approveStudent = (id: string) => {
    setStudents(prev => prev.map(student => {
      if (student.id === id) {
        const rollNumber = `UTC-${Math.floor(1000 + Math.random() * 9000)}`;
        addLog('ADMISSION_APPROVED', `Approved ${student.name}. Assigned Roll No: ${rollNumber}`);
        return { ...student, status: 'approved' as const, rollNumber };
      }
      return student;
    }));
  };
  
  const rejectStudent = (id: string) => {
    setStudents(prev => prev.map(student => {
      if (student.id === id) {
        addLog('ADMISSION_REJECTED', `Rejected admission for ${student.name}`);
        return { ...student, status: 'rejected' as const };
      }
      return student;
    }));
  };

  const addFee = (f: Omit<Fee, 'id'>) => {
    const newFee = { ...f, id: uuid() };
    setFees([...fees, newFee]);
    const studentName = students.find(s => s.id === f.studentId)?.name || 'Unknown';
    addLog('FEE_COLLECTION', `Collected ₹${f.amount} from ${studentName} for ${f.month}`);
  };

  const addExpense = (e: Omit<Expense, 'id'>) => {
    const newExpense = { ...e, id: uuid() };
    setExpenses([...expenses, newExpense]);
  };

  const deleteFee = (id: string) => {
    setFees(fees.filter(f => f.id !== id));
  };

  const updateFee = (f: Fee) => {
    setFees(fees.map(fe => fe.id === f.id ? f : fe));
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(ex => ex.id !== id));
  };

  const updateExpense = (e: Expense) => {
    setExpenses(expenses.map(ex => ex.id === e.id ? e : ex));
  };

  const markAttendance = (date: string, studentId: string, status: 'present' | 'absent') => {
    const existing = attendance.find(a => a.date === date && a.studentId === studentId);
    if (existing) {
      const updated = { ...existing, status };
      setAttendance(attendance.map(a => a.id === existing.id ? updated : a));
    } else {
      const newItem = { id: uuid(), date, studentId, status };
      setAttendance([...attendance, newItem]);
    }
  };

  const addTest = (t: Omit<Test, 'id'>) => {
    const newTest = { ...t, id: uuid() };
    setTests([...tests, newTest]);
  };
  
  const submitTestResult = (r: Omit<TestResult, 'id'>) => {
    const newResult = { ...r, id: uuid() };
    setTestResults([...testResults, newResult]);
  };

  const addMaterial = (m: Omit<StudyMaterial, 'id' | 'uploadDate'>) => {
    const newItem = { ...m, id: uuid(), uploadDate: new Date().toISOString() };
    setMaterials([...materials, newItem]);
  };

  const deleteMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const deleteNotice = (id: string) => {
    setNotices(notices.filter(n => n.id !== id));
  };

  const deleteTest = (id: string) => {
    setTests(tests.filter(t => t.id !== id));
  };

  const addNotice = (n: Omit<Notice, 'id' | 'date'>) => {
    const newNotice = { ...n, id: uuid(), date: new Date().toISOString() };
    setNotices([...notices, newNotice]);
  };

  return (
    <StorageContext.Provider value={{
      students, fees, expenses, attendance, tests, testResults, materials, notices, users, currentUser,
      login, signup, logout, refreshCloudData, updateUser,
      scriptUrl, syncError, isInitialSyncing,
      addStudent, updateStudent, deleteStudent, removeStudentPermanently, approveStudent, rejectStudent,
      addFee, updateFee, deleteFee, addExpense, updateExpense, deleteExpense, markAttendance,
      addTest, deleteTest, submitTestResult, addMaterial, deleteMaterial, addNotice, deleteNotice, clearAllData, addLog
    }}>
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (!context) throw new Error('useStorage must be used within StorageProvider');
  return context;
};
