import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Student, Fee, Expense, Attendance, Test, TestResult, StudyMaterial, Notice, User, UserRole, DueFee, ExternalTest, ResultLink, StudentRemark } from '../types';
import { getISTISOString, getISTDateString } from '../lib/dateUtils';

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

const sanitizeFee = (f: any): Fee => {
  if (!f) return f;
  return {
    id: String(f.id || ''),
    studentId: String(f.studentId || ''),
    studentName: f.studentName !== undefined ? String(f.studentName) : undefined,
    amount: typeof f.amount === 'number' ? f.amount : (Number(f.amount) || 0),
    date: String(f.date || ''),
    status: f.status === 'unpaid' ? 'unpaid' : 'paid',
    month: String(f.month || '')
  };
};

const sanitizeExpense = (e: any): Expense => {
  if (!e) return e;
  return {
    id: String(e.id || ''),
    title: String(e.title || ''),
    amount: typeof e.amount === 'number' ? e.amount : (Number(e.amount) || 0),
    date: String(e.date || ''),
    category: e.category || 'Others',
    description: e.description !== undefined ? String(e.description) : undefined
  };
};

const sanitizeDueFee = (df: any): DueFee => {
  if (!df) return df;
  return {
    id: String(df.id || ''),
    studentId: String(df.studentId || ''),
    amount: typeof df.amount === 'number' ? df.amount : (Number(df.amount) || 0),
    remarks: String(df.remarks || ''),
    date: String(df.date || '')
  };
};

const sanitizeRemark = (r: any): StudentRemark => {
  if (!r) return r;
  return {
    id: String(r.id || ''),
    studentId: String(r.studentId || ''),
    studentName: r.studentName !== undefined ? String(r.studentName) : undefined,
    remark: String(r.remark || ''),
    category: r.category || 'General',
    date: String(r.date || getISTISOString()),
    createdBy: r.createdBy !== undefined ? String(r.createdBy) : 'Admin'
  };
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
  dueFees: DueFee[];
  externalTests: ExternalTest[];
  resultLinks: ResultLink[];
  remarks: StudentRemark[];
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
  updateAttendance: (attendanceRecord: Attendance) => void;
  deleteAttendance: (id: string) => void;
  
  addTest: (test: Omit<Test, 'id'>) => void;
  submitTestResult: (result: Omit<TestResult, 'id'>) => void;
  
  addMaterial: (material: Omit<StudyMaterial, 'id' | 'uploadDate'>) => void;
  updateMaterial: (material: StudyMaterial) => void;
  deleteMaterial: (id: string) => void;
  addNotice: (notice: Omit<Notice, 'id' | 'date'>) => void;
  updateNotice: (notice: Notice) => void;
  deleteNotice: (id: string) => void;
  addDueFee: (dueFee: Omit<DueFee, 'id' | 'date'>) => void;
  updateDueFee: (dueFee: DueFee) => void;
  deleteDueFee: (id: string) => void;
  addExternalTest: (test: Omit<ExternalTest, 'id' | 'date'>) => void;
  updateExternalTest: (test: ExternalTest) => void;
  deleteExternalTest: (id: string) => void;
  addResultLink: (result: Omit<ResultLink, 'id' | 'date'>) => void;
  updateResultLink: (result: ResultLink) => void;
  deleteResultLink: (id: string) => void;
  addRemark: (remark: Omit<StudentRemark, 'id' | 'date'>) => void;
  updateRemark: (remark: StudentRemark) => void;
  deleteRemark: (id: string) => void;
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
const SCRIPT_URL: string = 'https://script.google.com/macros/s/AKfycbz6hmunZWBRwUXWbPzSSLoz64IcqH7EcxtI2CMyiwFUlqPPKYxzNqAoHEpJ1nEsFjqH/exec';
// -------------------------------------------------------------------------

const StorageContext = createContext<StorageContextType | undefined>(undefined);

const loadInitial = <T,>(key: string, defaultValue: T, sanitizer?: (item: any) => any): T => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && sanitizer) {
      return parsed.map(sanitizer) as unknown as T;
    }
    return parsed as T;
  } catch {
    return defaultValue;
  }
};

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>(() => loadInitial('utc_students', []));
  const [fees, setFees] = useState<Fee[]>(() => loadInitial('utc_fees', [], sanitizeFee));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadInitial('utc_expenses', [], sanitizeExpense));
  const [attendance, setAttendance] = useState<Attendance[]>(() => loadInitial('utc_attendance', []));
  const [tests, setTests] = useState<Test[]>(() => loadInitial('utc_tests', []));
  const [testResults, setTestResults] = useState<TestResult[]>(() => loadInitial('utc_testResults', []));
  const [materials, setMaterials] = useState<StudyMaterial[]>(() => loadInitial('utc_materials', []));
  const [notices, setNotices] = useState<Notice[]>(() => loadInitial('utc_notices', []));
  const [dueFees, setDueFees] = useState<DueFee[]>(() => loadInitial('utc_due_fees', [], sanitizeDueFee));
  const [externalTests, setExternalTests] = useState<ExternalTest[]>(() => loadInitial('utc_external_tests', []));
  const [resultLinks, setResultLinks] = useState<ResultLink[]>(() => loadInitial('utc_result_links', []));
  const [remarks, setRemarks] = useState<StudentRemark[]>(() => loadInitial('utc_remarks', [], sanitizeRemark));
  const [users, setUsers] = useState<User[]>(() => loadInitial('utc_users', []));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('utc_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isInitialSyncing, setIsInitialSyncing] = useState(true);
  const [isFetchSuccessful, setIsFetchSuccessful] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => localStorage.getItem('utc_last_sync'));
  
  const scriptUrl = SCRIPT_URL;

  const syncToCloud = async () => {
    if (!scriptUrl || scriptUrl === 'YOUR_APPS_SCRIPT_URL_HERE') return;
    const cleanUrl = scriptUrl.trim();
    try {
      setSyncError(null);
      
      const enrichedFees = fees.map(f => ({
        id: f.id,
        studentId: f.studentId,
        studentName: students.find(s => s.id === f.studentId)?.name || 'Unknown',
        amount: Number(f.amount) || 0,
        date: f.date,
        status: f.status,
        month: f.month
      }));

      const enrichedAttendance = attendance.map(a => ({
        id: a.id,
        date: a.date,
        studentId: a.studentId,
        studentName: students.find(s => s.id === a.studentId)?.name || 'Unknown',
        status: a.status
      }));

      const enrichedTestResults = testResults.map(tr => ({
        id: tr.id,
        testId: tr.testId,
        studentId: tr.studentId,
        studentName: students.find(s => s.id === tr.studentId)?.name || 'Unknown',
        score: Number(tr.score) || 0,
        totalQuestions: Number(tr.totalQuestions) || 0,
        date: tr.date
      }));

      const enrichedRemarks = remarks.map(r => ({
        id: r.id,
        studentId: r.studentId,
        studentName: students.find(s => s.id === r.studentId)?.name || r.studentName || 'Unknown',
        remark: r.remark,
        category: r.category || 'General',
        date: r.date,
        createdBy: r.createdBy || 'Admin'
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
          dueFees,
          externalTests,
          resultLinks,
          remarks: enrichedRemarks,
          users,
          logs: JSON.parse(localStorage.getItem('utc_activity_logs') || '[]')
        }
      };

      let pushDone = false;
      // Try local proxy route first (completely bypasses browser CORS/iframe limitations)
      try {
        const proxyRes = await fetch('/api/cloud-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
        if (proxyRes.ok) {
          pushDone = true;
        }
      } catch {
        // Fallback to direct fetch
      }

      if (!pushDone) {
        await fetch(cleanUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(payload)
        });
      }

      console.log('Cloud Sync Triggered');
      setLastSyncTime(getISTISOString());
      localStorage.setItem('utc_last_sync', getISTISOString());
    } catch (e: any) {
      console.warn('Cloud Sync Notice:', e?.message || e);
      let errorMsg = e?.message || 'Sync offline';
      if (errorMsg === 'Failed to fetch') {
        errorMsg = 'CLOUD UPDATE BLOCKED: Ensure "Who has access" is set to "Anyone" in Apps Script.';
      }
      setSyncError(errorMsg);
    }
  };

  // Sync to cloud when data changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only sync if we have successfully connected/loaded from the cloud and we're not in the middle of an initial load
      if (!isInitialSyncing && isFetchSuccessful) {
        syncToCloud();
      }
    }, 2000); // 2 second debounce
    return () => clearTimeout(timer);
  }, [students, fees, expenses, attendance, tests, testResults, materials, notices, dueFees, externalTests, resultLinks, remarks, users, isInitialSyncing, isFetchSuccessful]);

  const refreshCloudData = useCallback(async () => {
    const cleanUrl = scriptUrl.trim();
    if (!cleanUrl || cleanUrl.includes('YOUR_APPS_SCRIPT_URL_HERE')) {
      setIsInitialSyncing(false);
      return;
    }

    setIsInitialSyncing(true);
    try {
      setSyncError(null);
      let text = '';
      let fetchSuccessful = false;

      // 1. Try local server-side proxy route first (avoids browser iframe CORS/redirect limitations)
      try {
        const proxyController = new AbortController();
        const proxyTimeout = setTimeout(() => proxyController.abort(), 18000);
        const proxyResponse = await fetch(`/api/cloud-sync?action=get_all&_t=${Date.now()}`, {
          signal: proxyController.signal
        });
        clearTimeout(proxyTimeout);

        if (proxyResponse.ok) {
          const proxyText = await proxyResponse.text();
          if (proxyText && proxyText.trim().length > 0 && !proxyText.includes('<!DOCTYPE html>') && !proxyText.includes('<html')) {
            text = proxyText;
            fetchSuccessful = true;
          }
        }
      } catch (proxyErr: any) {
        console.warn('Local cloud proxy bypassed, trying direct handshake:', proxyErr?.message || proxyErr);
      }

      // 2. Direct browser handshake fallback if proxy wasn't successful
      if (!fetchSuccessful) {
        if (!cleanUrl.startsWith('https://script.google.com')) {
          throw new Error('INVALID SCRIPT URL: Ensure you are using the Web App URL from Apps Script.');
        }

        const url = new URL(cleanUrl);
        url.searchParams.set('action', 'get_all');
        url.searchParams.set('_t', Date.now().toString());

        console.log('Attempting Cloud Handshake:', url.toString());
        
        const directController = new AbortController();
        const directTimeout = setTimeout(() => directController.abort(), 15000);

        const response = await fetch(url.toString(), {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          redirect: 'follow',
          signal: directController.signal
        });
        clearTimeout(directTimeout);
        
        if (!response.ok) {
          throw new Error(`Cloud Connection Error: ${response.status} ${response.statusText}`);
        }
        
        text = await response.text();
      }

      if (!text || text.trim().length === 0) {
        throw new Error('Cloud response was empty. Check if your script logic is correct.');
      }
      
      try {
        const data = JSON.parse(text);
        if (data) {
          if (data.students) setStudents(data.students);
          if (data.fees) setFees(Array.isArray(data.fees) ? data.fees.map(sanitizeFee) : []);
          if (data.expenses) setExpenses(Array.isArray(data.expenses) ? data.expenses.map(sanitizeExpense) : []);
          if (data.users) setUsers(data.users);
          if (data.notices) setNotices(data.notices);
          if (data.dueFees) setDueFees(Array.isArray(data.dueFees) ? data.dueFees.map(sanitizeDueFee) : []);
          if (data.externalTests) setExternalTests(data.externalTests);
          if (data.resultLinks) setResultLinks(data.resultLinks);
          if (data.remarks) setRemarks(Array.isArray(data.remarks) ? data.remarks.map(sanitizeRemark) : []);
          if (data.materials) setMaterials(data.materials);
          if (data.tests) setTests(data.tests);
          if (data.testResults) setTestResults(data.testResults);
          if (data.attendance) setAttendance(data.attendance);
          
          if (data.logs) {
            localStorage.setItem('utc_activity_logs', JSON.stringify(data.logs.slice(0, 100)));
          }
          
          setLastSyncTime(getISTISOString());
          localStorage.setItem('utc_last_sync', getISTISOString());
          setIsFetchSuccessful(true);
          setSyncError(null);
          console.log('✓ Cloud Data Synchronized');
        }
      } catch (parseError) {
        console.warn('Cloud JSON parse notice. Raw response:', text.substring(0, 200));
        if (text.includes("<!DOCTYPE html>") || text.includes("<html")) {
          setSyncError("AUTHENTICATION REQUIRED: The script returned a login page. In Apps Script, set 'Who has access' to 'Anyone'.");
        } else {
          setSyncError('Data format mismatch from cloud');
        }
      }
    } catch (e: any) {
      console.warn('Cloud Sync Diagnostic Notice:', e?.message || e);
      let errorMsg = e?.message || 'Sync offline';
      if (errorMsg === 'Failed to fetch') {
        errorMsg = 'ACCESS RESTRICTED: Browser blocked cross-origin handshake. Operating with local data cache.';
      }
      setSyncError(errorMsg);
    } finally {
      setIsInitialSyncing(false);
    }
  }, [scriptUrl]);

  // Initial data load from cloud
  useEffect(() => {
    if (scriptUrl) {
      refreshCloudData().catch(e => console.warn("Initial sync notice:", e?.message || e));
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

      // 1. Try matching a registered account first
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

      // 2. Emergency Fallback: Only allow if NO admins exist in the registered users list
      const hasRegisteredAdmin = users.some(u => u.role === 'admin');
      if (!hasRegisteredAdmin && role === 'admin' && cleanUsername === 'admin' && (cleanPassword === 'admin123' || cleanPassword === '123')) {
        const fallbackAdmin: User = { 
          id: 'sys-admin', 
          username: 'admin', 
          password: cleanPassword,
          name: 'System Administrator', 
          role: 'admin' 
        };
        setCurrentUser(fallbackAdmin);
        localStorage.setItem('utc_current_user', JSON.stringify(fallbackAdmin));
        return true;
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
    setUsers(prev => {
      const exists = prev.some(user => user.id === u.id);
      if (exists) {
        return prev.map(user => user.id === u.id ? u : user);
      }
      return [...prev, u];
    });
    
    if (currentUser?.id === u.id) {
       setCurrentUser(u);
       localStorage.setItem('utc_current_user', JSON.stringify(u));
    }
    addLog('USER_UPDATE', `Updated user credentials for ${u.username}`);
  };

  const addLog = (action: string, details: string) => {
    const newLog = {
      timestamp: getISTISOString(),
      user: currentUser ? `${currentUser.name} (${currentUser.role})` : 'System',
      action,
      details
    };
    const currentLogs = JSON.parse(localStorage.getItem('utc_activity_logs') || '[]');
    const updatedLogs = [newLog, ...currentLogs].slice(0, 100); // Keep last 100
    localStorage.setItem('utc_activity_logs', JSON.stringify(updatedLogs));
  };

  // Persistence
  useEffect(() => { localStorage.setItem('utc_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('utc_fees', JSON.stringify(fees)); }, [fees]);
  useEffect(() => { localStorage.setItem('utc_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('utc_attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('utc_tests', JSON.stringify(tests)); }, [tests]);
  useEffect(() => { localStorage.setItem('utc_testResults', JSON.stringify(testResults)); }, [testResults]);
  useEffect(() => { localStorage.setItem('utc_materials', JSON.stringify(materials)); }, [materials]);
  useEffect(() => { localStorage.setItem('utc_notices', JSON.stringify(notices)); }, [notices]);
  useEffect(() => { localStorage.setItem('utc_due_fees', JSON.stringify(dueFees)); }, [dueFees]);
  useEffect(() => { localStorage.setItem('utc_external_tests', JSON.stringify(externalTests)); }, [externalTests]);
  useEffect(() => { localStorage.setItem('utc_result_links', JSON.stringify(resultLinks)); }, [resultLinks]);
  useEffect(() => { localStorage.setItem('utc_remarks', JSON.stringify(remarks)); }, [remarks]);
  useEffect(() => { localStorage.setItem('utc_users', JSON.stringify(users)); }, [users]);

  const clearAllData = () => {
    const keys = ['students', 'fees', 'expenses', 'attendance', 'tests', 'testResults', 'materials', 'notices', 'due_fees', 'external_tests', 'result_links', 'remarks', 'users'];
    keys.forEach(k => localStorage.removeItem(`utc_${k}`));
    setStudents([]); setFees([]); setExpenses([]); setAttendance([]); setTests([]); setTestResults([]); setMaterials([]); setNotices([]); setDueFees([]); setExternalTests([]); setResultLinks([]); setRemarks([]); setUsers([]);
  };

  const addStudent = (s: Omit<Student, 'id' | 'admissionDate' | 'status'>) => {
    const newStudent: Student = { 
      ...s, 
      id: shortId(), 
      admissionDate: getISTISOString(), 
      status: 'pending',
      rollNumber: 'N/A'
    };
    setStudents(prev => [...prev, newStudent]);
    addLog('ADMISSION_REQUEST', `New admission request from ${s.name} for class ${s.class}`);
  };

  const updateStudent = (s: Student) => {
    setStudents(prev => prev.map(st => st.id === s.id ? s : st));
    addLog('STUDENT_UPDATE', `Updated profile/roll number for student: ${s.name}`);
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.map(st => st.id === id ? { ...st, status: 'deleted' } : st));
    addLog('STUDENT_TRASH', `Moved student record ${id} to trash and suspended system access`);
  };

  const removeStudentPermanently = (id: string) => {
    setStudents(prev => prev.filter(st => st.id !== id));
    setUsers(prev => prev.filter(u => u.id !== id));
    setFees(prev => prev.filter(f => f.studentId !== id));
    setAttendance(prev => prev.filter(a => a.studentId !== id));
    setTestResults(prev => prev.filter(tr => tr.studentId !== id));
    setDueFees(prev => prev.filter(df => df.studentId !== id));
    setRemarks(prev => prev.filter(r => r.studentId !== id));
    addLog('STUDENT_DELETE', `Permanently deleted student ${id} and all their credentials, fees, attendance, results, due fees, and remarks`);
  };
  
  const approveStudent = (id: string) => {
    setStudents(prev => prev.map(student => {
      if (student.id === id) {
        const rollNumber = `UTC-${Math.floor(1000 + Math.random() * 9000)}`;
        addLog('ADMISSION_APPROVED', `Approved ${student.name}. Assigned Roll No: ${rollNumber}`);
        
        // Create user account for student
        const studentUser: User = {
          id: student.id,
          username: rollNumber,
          password: rollNumber, // Default password same as roll number
          name: student.name,
          role: 'student'
        };
        setUsers(prevUsers => [...prevUsers, studentUser]);
        
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
    const newFee = sanitizeFee({ ...f, id: uuid() });
    setFees(prev => [...prev, newFee]);
    const studentName = students.find(s => s.id === newFee.studentId)?.name || 'Unknown';
    addLog('FEE_COLLECTION', `Collected ₹${newFee.amount} from ${studentName} for ${newFee.month}`);
  };

  const addExpense = (e: Omit<Expense, 'id'>) => {
    const newExpense = sanitizeExpense({ ...e, id: uuid() });
    setExpenses(prev => [...prev, newExpense]);
  };

  const deleteFee = (id: string) => {
    setFees(prev => prev.filter(f => f.id !== id));
    addLog('FEE_DELETE', `Removed fee record ${id}`);
  };

  const updateFee = (f: Fee) => {
    setFees(prev => prev.map(fe => fe.id === f.id ? sanitizeFee(f) : fe));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(ex => ex.id !== id));
    addLog('EXPENSE_DELETE', `Removed expense record ${id}`);
  };

  const updateExpense = (e: Expense) => {
    setExpenses(prev => prev.map(ex => ex.id === e.id ? sanitizeExpense(e) : ex));
  };

  const markAttendance = (date: string, studentId: string, status: 'present' | 'absent') => {
    setAttendance(prev => {
      const existing = prev.find(a => a.date === date && a.studentId === studentId);
      if (existing) {
        return prev.map(a => a.id === existing.id ? { ...existing, status } : a);
      }
      return [...prev, { id: uuid(), date, studentId, status }];
    });
  };

  const updateAttendance = (attendanceRecord: Attendance) => {
    setAttendance(prev => prev.map(a => a.id === attendanceRecord.id ? attendanceRecord : a));
    addLog('ATTENDANCE_UPDATE', `Updated attendance record ${attendanceRecord.id} to ${attendanceRecord.status}`);
  };

  const deleteAttendance = (id: string) => {
    setAttendance(prev => prev.filter(a => a.id !== id));
    addLog('ATTENDANCE_DELETE', `Deleted attendance record ${id}`);
  };

  const addTest = (t: Omit<Test, 'id'>) => {
    const newTest = { ...t, id: uuid() };
    setTests(prev => [...prev, newTest]);
  };
  
  const submitTestResult = (r: Omit<TestResult, 'id'>) => {
    const newResult = { ...r, id: uuid() };
    setTestResults(prev => [...prev, newResult]);
  };

  const addMaterial = (m: Omit<StudyMaterial, 'id' | 'uploadDate'>) => {
    const newItem = { ...m, id: uuid(), uploadDate: getISTISOString() };
    setMaterials(prev => [...prev, newItem]);
    addLog('MATERIAL_ADD', `Added study material: ${m.title}`);
  };

  const updateMaterial = (m: StudyMaterial) => {
    setMaterials(prev => prev.map(item => item.id === m.id ? m : item));
    addLog('MATERIAL_UPDATE', `Updated study material: ${m.title}`);
  };

  const deleteMaterial = (id: string) => {
    const material = materials.find(m => m.id === id);
    setMaterials(prev => prev.filter(m => m.id !== id));
    if (material) {
      addLog('MATERIAL_DELETE', `Deleted study material: ${material.title}`);
    }
  };

  const deleteNotice = (id: string) => {
    const target = notices.find(n => n.id === id);
    setNotices(prev => prev.filter(n => n.id !== id));
    if (target) {
      addLog('NOTICE_DELETE', `Deleted notice: ${target.title}`);
    }
  };

  const deleteTest = (id: string) => {
    setTests(prev => prev.filter(t => t.id !== id));
    setTestResults(prev => prev.filter(tr => tr.testId !== id));
    addLog('TEST_DELETE', `Deleted test ${id} and all related student test results`);
  };

  const addNotice = (n: Omit<Notice, 'id' | 'date'>) => {
    const newNotice = { ...n, id: uuid(), date: getISTISOString() };
    setNotices(prev => [...prev, newNotice]);
    addLog('NOTICE_ADD', `Published notice: ${newNotice.title}`);
  };

  const updateNotice = (notice: Notice) => {
    const updated = { ...notice, updatedAt: getISTISOString() };
    setNotices(prev => prev.map(n => n.id === notice.id ? updated : n));
    addLog('NOTICE_UPDATE', `Updated notice: ${notice.title}`);
  };

  const addDueFee = (df: Omit<DueFee, 'id' | 'date'>) => {
    const newDueFee = sanitizeDueFee({ ...df, id: uuid(), date: getISTISOString() });
    setDueFees(prev => [...prev, newDueFee]);
    const studentName = students.find(s => s.id === newDueFee.studentId)?.name || 'Unknown';
    addLog('DUE_FEE_ADDED', `Added due amount of ₹${newDueFee.amount} for ${studentName}: ${newDueFee.remarks}`);
  };

  const updateDueFee = (df: DueFee) => {
    setDueFees(prev => prev.map(item => item.id === df.id ? sanitizeDueFee(df) : item));
    addLog('DUE_FEE_UPDATE', `Updated due amount for student ${df.id}`);
  };

  const deleteDueFee = (id: string) => {
    setDueFees(prev => prev.filter(item => item.id !== id));
    addLog('DUE_FEE_DELETE', `Removed due record ${id}`);
  };

  const addExternalTest = (t: Omit<ExternalTest, 'id' | 'date'>) => {
    const newTest = { ...t, id: uuid(), date: getISTISOString() };
    setExternalTests(prev => [...prev, newTest]);
    addLog('EXTERNAL_TEST_ADDED', `Added new external test link: ${t.title}`);
  };

  const updateExternalTest = (t: ExternalTest) => {
    setExternalTests(prev => prev.map(item => item.id === t.id ? t : item));
    addLog('EXTERNAL_TEST_UPDATE', `Updated external test link: ${t.title}`);
  };

  const deleteExternalTest = (id: string) => {
    setExternalTests(prev => prev.filter(item => item.id !== id));
    addLog('EXTERNAL_TEST_DELETED', `Deleted external test link ${id}`);
  };

  const addResultLink = (t: Omit<ResultLink, 'id' | 'date'>) => {
    const newResult = { ...t, id: uuid(), date: getISTISOString() };
    setResultLinks(prev => [...prev, newResult]);
    addLog('RESULT_ADDED', `Added new result link: ${t.title}`);
  };

  const updateResultLink = (t: ResultLink) => {
    setResultLinks(prev => prev.map(item => item.id === t.id ? t : item));
    addLog('RESULT_UPDATE', `Updated result link: ${t.title}`);
  };

  const deleteResultLink = (id: string) => {
    setResultLinks(prev => prev.filter(item => item.id !== id));
    addLog('RESULT_DELETED', `Deleted result link ${id}`);
  };

  const addRemark = (r: Omit<StudentRemark, 'id' | 'date'>) => {
    const student = students.find(s => s.id === r.studentId);
    const studentName = student?.name || r.studentName || 'Unknown';
    const newRemark = sanitizeRemark({
      ...r,
      id: uuid(),
      studentName,
      date: getISTISOString()
    });
    setRemarks(prev => [newRemark, ...prev]);
    addLog('REMARK_ADDED', `Added remark for student ${studentName}: "${newRemark.remark.slice(0, 30)}..."`);
  };

  const updateRemark = (r: StudentRemark) => {
    const sanitized = sanitizeRemark(r);
    setRemarks(prev => prev.map(item => item.id === r.id ? sanitized : item));
    addLog('REMARK_UPDATE', `Updated remark ${r.id} for student ${sanitized.studentName || sanitized.studentId}`);
  };

  const deleteRemark = (id: string) => {
    const existing = remarks.find(r => r.id === id);
    setRemarks(prev => prev.filter(item => item.id !== id));
    addLog('REMARK_DELETED', `Deleted remark record ${id}${existing?.studentName ? ` for ${existing.studentName}` : ''}`);
  };

  return (
    <StorageContext.Provider value={{
      students, fees, expenses, attendance, tests, testResults, materials, notices, dueFees, externalTests, resultLinks, remarks, users, currentUser,
      login, signup, logout, refreshCloudData, updateUser,
      scriptUrl, syncError, isInitialSyncing,
      addStudent, updateStudent, deleteStudent, removeStudentPermanently, approveStudent, rejectStudent,
      addFee, updateFee, deleteFee, addExpense, updateExpense, deleteExpense, markAttendance, updateAttendance, deleteAttendance,
      addTest, deleteTest, submitTestResult, addMaterial, updateMaterial, deleteMaterial, addNotice, updateNotice, deleteNotice, 
      addDueFee, updateDueFee, deleteDueFee, addExternalTest, updateExternalTest, deleteExternalTest, addResultLink, updateResultLink, deleteResultLink,
      addRemark, updateRemark, deleteRemark, clearAllData, addLog
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
