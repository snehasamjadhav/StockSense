// StockSense Mock Authentication Service

const STORAGE_USERS_KEY = 'stocksense_users_v1';
const STORAGE_SESSION_KEY = 'stocksense_auth_session';

export const INITIAL_DEMO_USERS = [
  {
    id: 'user-admin',
    name: 'Elena Rostova',
    loginId: 'admin',
    email: 'admin@stocksense.com',
    password: 'Admin@123',
    role: 'ADMIN',
    avatar: 'ER',
    department: 'Executive Supply Operations'
  },
  {
    id: 'user-manager',
    name: 'Marcus Vance',
    loginId: 'manager',
    email: 'manager@stocksense.com',
    password: 'Manager@123',
    role: 'INVENTORY MANAGER',
    avatar: 'MV',
    department: 'Inventory Control'
  },
  {
    id: 'user-warehouse',
    name: 'Devon Reed',
    loginId: 'warehouse',
    email: 'warehouse@stocksense.com',
    password: 'Warehouse@123',
    role: 'WAREHOUSE STAFF',
    avatar: 'DR',
    department: 'Warehouse Logistics'
  }
];

class AuthService {
  constructor() {
    this.initUsers();
  }

  initUsers() {
    try {
      const stored = localStorage.getItem(STORAGE_USERS_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(INITIAL_DEMO_USERS));
      }
    } catch (e) {
      console.warn('LocalStorage error during initUsers', e);
    }
  }

  getUsers() {
    try {
      const stored = localStorage.getItem(STORAGE_USERS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('LocalStorage read error', e);
    }
    return INITIAL_DEMO_USERS;
  }

  saveUsers(users) {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('LocalStorage write error', e);
    }
  }

  getSession() {
    try {
      const session = localStorage.getItem(STORAGE_SESSION_KEY);
      if (session) {
        return JSON.parse(session);
      }
    } catch (e) {
      console.warn('Session parse error', e);
    }
    return null;
  }

  setSession(user, remember = false) {
    const sessionData = {
      user: {
        id: user.id,
        name: user.name,
        loginId: user.loginId,
        email: user.email,
        role: user.role,
        avatar: user.avatar || user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
        department: user.department || 'Warehouse Operations'
      },
      token: `mock-jwt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      loginTime: new Date().toISOString(),
      remember
    };
    try {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.warn('Session save error', e);
    }
    return sessionData;
  }

  clearSession() {
    try {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    } catch (e) {
      console.warn('Session clear error', e);
    }
  }

  login(identifier, password, remember = false) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = this.getUsers();
        const idLower = (identifier || '').trim().toLowerCase();
        const user = users.find(u => 
          (u.email.toLowerCase() === idLower || (u.loginId && u.loginId.toLowerCase() === idLower)) &&
          u.password === password
        );

        if (!user) {
          reject(new Error('Invalid email or password. Please verify your credentials.'));
          return;
        }

        const session = this.setSession(user, remember);
        resolve(session);
      }, 350);
    });
  }

  signup({ fullName, loginId, email, password, role }) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = this.getUsers();
        const emailLower = email.trim().toLowerCase();
        const loginLower = loginId.trim().toLowerCase();

        if (users.some(u => u.email.toLowerCase() === emailLower)) {
          reject(new Error('An account with this email address already exists.'));
          return;
        }

        if (users.some(u => u.loginId && u.loginId.toLowerCase() === loginLower)) {
          reject(new Error('This Login ID is already taken. Please choose another.'));
          return;
        }

        if (role === 'ADMIN') {
          reject(new Error('Administrator accounts cannot be created via public sign-up.'));
          return;
        }

        const newUser = {
          id: `user-${Date.now()}`,
          name: fullName.trim(),
          loginId: loginId.trim(),
          email: emailLower,
          password: password,
          role: role || 'WAREHOUSE STAFF',
          avatar: fullName.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
          department: role === 'INVENTORY MANAGER' ? 'Inventory Control' : 'Warehouse Logistics'
        };

        users.push(newUser);
        this.saveUsers(users);
        const session = this.setSession(newUser, true);
        resolve({ user: newUser, session });
      }, 400);
    });
  }

  updatePassword(email, newPassword) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.email.toLowerCase() === email.trim().toLowerCase());
        if (userIndex === -1) {
          reject(new Error('No account found with this email address.'));
          return;
        }
        users[userIndex].password = newPassword;
        this.saveUsers(users);
        resolve(true);
      }, 300);
    });
  }
}

export const authService = new AuthService();
