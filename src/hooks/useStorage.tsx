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
  
  addStudent: (student: Omit<Student, 'id' | 'admissionDate' | 'status'>) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
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
  addNotice: (notice: Omit<Notice, 'id' | 'date'>) => void;
  clearAllData: () => void;
  scriptUrl: string;
  refreshCloudData: () => Promise<void>;
  syncError: string | null;
}

// DIRECT GOOGLE SHEETS CONNECTION
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz-S3P0Mn-OD9aWcUdfTr92PW15PnMMDO3fNmIhs6dnTy3WEQTQZTS4KGMHaz0j51we/exec';

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
  
  const scriptUrl = SCRIPT_URL;

  const syncToCloud = async (action: string, data: any) => {
    if (!scriptUrl) return;
    try {
      setSyncError(null);
      await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action, data })
      });
    } catch (e: any) {
      console.error('Cloud Sync Failed:', e);
      setSyncError(e.message || 'Sync failed');
    }
  };

  const refreshCloudData = useCallback(async () => {
    if (!scriptUrl) return;
    try {
      setSyncError(null);
      // Add a timestamp to bypass any potential browser caching
      const url = new URL(scriptUrl);
      url.searchParams.set('_t', Date.now().toString());

      const response = await fetch(url.toString());
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
      throw e;
    }
  }, [scriptUrl]);

  // Initial data load from cloud
  useEffect(() => {
    if (scriptUrl) {
      refreshCloudData();
    }
  }, [scriptUrl, refreshCloudData]);

  // Auth logic
  const login = async (username: string, password: string, role: UserRole) => {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    // 0. Emergency Fallback: If no users exist, allow a default admin
    if (role === 'admin' && users.length === 0) {
       if (cleanUsername === 'admin' && cleanPassword === 'admin123') {
          const fallbackAdmin: User = { id: 'fallback-admin', username: 'admin', name: 'System Administrator', role: 'admin' };
          setCurrentUser(fallbackAdmin);
          localStorage.setItem('utc_current_user', JSON.stringify(fallbackAdmin));
          return true;
       }
    }

    // 1. Try matching a registered account
    const user = users.find(u => 
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
  };

  const signup = async (u: Omit<User, 'id'>) => {
    const newUser: User = { ...u, id: uuid() };
    setUsers([...users, newUser]);
    await syncToCloud('ADD_USER', newUser);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('utc_current_user');
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
      id: uuid(), 
      admissionDate: new Date().toISOString(), 
      status: 'pending',
      rollNumber: 'N/A'
    };
    setStudents([...students, newStudent]);
    syncToCloud('ADD_STUDENT', newStudent);
  };

  const updateStudent = (s: Student) => {
    setStudents(students.map(st => st.id === s.id ? s : st));
    syncToCloud('UPDATE_STUDENT', s);
  };

  const deleteStudent = (id: string) => {
    setStudents(students.filter(st => st.id !== id));
    syncToCloud('DELETE_STUDENT', { id }); // Note: Need ADD_STUDENT/UPDATE_STUDENT usually suffices but DELETE can be added
  };
  
  const approveStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    if (student) {
      const updated = { ...student, status: 'approved' as const, rollNumber: `UTC-${Math.floor(1000 + Math.random() * 9000)}` };
      updateStudent(updated);
    }
  };
  
  const rejectStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    if (student) {
      const updated = { ...student, status: 'rejected' as const };
      updateStudent(updated);
    }
  };

  const addFee = (f: Omit<Fee, 'id'>) => {
    const newFee = { ...f, id: uuid() };
    setFees([...fees, newFee]);
    syncToCloud('ADD_FEE', newFee);
  };

  const addExpense = (e: Omit<Expense, 'id'>) => {
    const newExpense = { ...e, id: uuid() };
    setExpenses([...expenses, newExpense]);
    syncToCloud('ADD_EXPENSE', newExpense);
  };

  const deleteFee = (id: string) => {
    setFees(fees.filter(f => f.id !== id));
    syncToCloud('DELETE_FEE', { id });
  };

  const updateFee = (f: Fee) => {
    setFees(fees.map(fe => fe.id === f.id ? f : fe));
    syncToCloud('UPDATE_FEE', f);
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(ex => ex.id !== id));
    syncToCloud('DELETE_EXPENSE', { id });
  };

  const updateExpense = (e: Expense) => {
    setExpenses(expenses.map(ex => ex.id === e.id ? e : ex));
    syncToCloud('UPDATE_EXPENSE', e);
  };

  const markAttendance = (date: string, studentId: string, status: 'present' | 'absent') => {
    const existing = attendance.find(a => a.date === date && a.studentId === studentId);
    if (existing) {
      const updated = { ...existing, status };
      setAttendance(attendance.map(a => a.id === existing.id ? updated : a));
    } else {
      const newItem = { id: uuid(), date, studentId, status };
      setAttendance([...attendance, newItem]);
      syncToCloud('MARK_ATTENDANCE', newItem);
    }
  };

  const addTest = (t: Omit<Test, 'id'>) => {
    const newTest = { ...t, id: uuid() };
    setTests([...tests, newTest]);
    syncToCloud('ADD_TEST', newTest);
  };
  
  const submitTestResult = (r: Omit<TestResult, 'id'>) => {
    const newResult = { ...r, id: uuid() };
    setTestResults([...testResults, newResult]);
    syncToCloud('ADD_TEST_RESULT', newResult);
  };

  const addMaterial = (m: Omit<StudyMaterial, 'id' | 'uploadDate'>) => {
    const newItem = { ...m, id: uuid(), uploadDate: new Date().toISOString() };
    setMaterials([...materials, newItem]);
    syncToCloud('ADD_MATERIAL', newItem);
  };

  const deleteMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
    syncToCloud('DELETE_MATERIAL', { id });
  };

  const deleteNotice = (id: string) => {
    setNotices(notices.filter(n => n.id !== id));
    syncToCloud('DELETE_NOTICE', { id });
  };

  const deleteTest = (id: string) => {
    setTests(tests.filter(t => t.id !== id));
    syncToCloud('DELETE_TEST', { id });
  };

  const addNotice = (n: Omit<Notice, 'id' | 'date'>) => {
    const newNotice = { ...n, id: uuid(), date: new Date().toISOString() };
    setNotices([...notices, newNotice]);
    syncToCloud('ADD_NOTICE', newNotice);
  };

  return (
    <StorageContext.Provider value={{
      students, fees, expenses, attendance, tests, testResults, materials, notices, users, currentUser,
      login, signup, logout, refreshCloudData, 
      scriptUrl, syncError,
      addStudent, updateStudent, deleteStudent, approveStudent, rejectStudent,
      addFee, updateFee, addExpense, updateExpense, deleteExpense, markAttendance,
      addTest, submitTestResult, addMaterial, addNotice, clearAllData
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
