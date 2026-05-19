// Auth Helpers and Global Guards
const API_URL = ''; // Serve from the same host to prevent CORS issues

// Global Toast Message Helper
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : '❌'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto remove toast
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s reverse cubic-bezier(0.4, 0, 0.2, 1)';
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 4000);
}

// Get standard auth headers for API requests
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

// Helper to format salary values
function formatSalary(min, max) {
  return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
}

// Check auth state and update navbar
function updateNavbar() {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const navContainer = document.getElementById('navbar-links');
  
  if (!navContainer) return;

  let navHTML = '';

  if (token && userString) {
    const user = JSON.parse(userString);
    navHTML = `
      <li class="user-profile-nav">
        <div class="nav-avatar" title="${user.name}">${user.name.charAt(0).toUpperCase()}</div>
        <button id="logout-btn" class="nav-btn-secondary" style="padding: 0.4rem 1rem; border-radius: 30px; cursor: pointer;">Logout</button>
      </li>
    `;
  } else {
    navHTML = `
      <li><a href="/index.html" class="nav-link ${window.location.pathname === '/index.html' || window.location.pathname === '/' ? 'active' : ''}">Home</a></li>
      <li><a href="/jobs.html" class="nav-link ${window.location.pathname === '/jobs.html' ? 'active' : ''}">Browse Jobs</a></li>
      <li><a href="/login.html" class="nav-btn-secondary">Login</a></li>
      <li><a href="/register.html" class="nav-btn">Register</a></li>
    `;
  }

  navContainer.innerHTML = navHTML;

  // Add click listener to logout button if rendered
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

// Global page route protection
function guardProtectedPages() {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const path = window.location.pathname;

  const protectedPaths = [
    '/seeker-dashboard.html',
    '/employer-dashboard.html',
    '/profile.html',
    '/post-job.html'
  ];

  const isProtected = protectedPaths.some((p) => path.includes(p));

  if (isProtected) {
    if (!token || !userString) {
      showToast('Please sign in to access this page', 'error');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1000);
      return;
    }

    const user = JSON.parse(userString);

    // Seeker trying to access employer actions
    if (user.role === 'seeker' && (path.includes('employer-dashboard') || path.includes('post-job'))) {
      window.location.href = '/seeker-dashboard.html';
    }

    // Employer trying to access seeker dashboard
    if (user.role === 'employer' && path.includes('seeker-dashboard')) {
      window.location.href = '/employer-dashboard.html';
    }
  }

  // Redirect logged in users away from auth pages
  if (token && userString && (path.includes('login') || path.includes('register'))) {
    const user = JSON.parse(userString);
    window.location.href = user.role === 'employer' ? '/employer-dashboard.html' : '/seeker-dashboard.html';
  }
}

// Logout handler
function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('lastActivity');
  showToast('Logged out successfully');
  setTimeout(() => {
    window.location.href = '/index.html';
  }, 1000);
}

// Inactivity Auto-Logout Logic (5 minutes)
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

function initInactivityTimer() {
  const token = localStorage.getItem('token');
  if (!token) return; // Only track if user is logged in
  if (localStorage.getItem('rememberMe') === 'true') return; // Skip if 'Remember Me' is checked

  // Initialize/reset last activity on page load
  localStorage.setItem('lastActivity', Date.now());

  // Function to update last activity timestamp
  function resetActivityTimer() {
    localStorage.setItem('lastActivity', Date.now());
  }

  // Monitor these events for user activity
  const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
  
  activityEvents.forEach(event => {
    document.addEventListener(event, resetActivityTimer, { passive: true });
  });

  // Periodically check if threshold exceeded (every 5 seconds)
  const inactivityInterval = setInterval(() => {
    const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0', 10);
    const currentToken = localStorage.getItem('token');

    // If logged out manually in another tab, stop the interval
    if (!currentToken) {
      clearInterval(inactivityInterval);
      return;
    }

    if (Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
      clearInterval(inactivityInterval);
      
      // Remove event listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetActivityTimer);
      });

      // Clear local storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('lastActivity');
      
      showToast('Logged out due to 5 minutes of inactivity', 'error');
      
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 1500);
    }
  }, 5000);
}

// Password Visibility Toggle Logic
function initPasswordVisibilityToggles() {
  const toggleButtons = document.querySelectorAll('.toggle-password-btn');
  
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      // Update SVG icon
      if (isPassword) {
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" style="width: 1.25rem; height: 1.25rem;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
          </svg>
        `;
      } else {
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" style="width: 1.25rem; height: 1.25rem;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        `;
      }
    });
  });
}

// Handle Form Submissions (Login / Register)
document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
  guardProtectedPages();
  initInactivityTimer();
  initPasswordVisibilityToggles();

  // Register Role Selection Toggle
  const roleOptions = document.querySelectorAll('.role-option');
  const hiddenRoleInput = document.getElementById('register-role');

  if (roleOptions && hiddenRoleInput) {
    roleOptions.forEach((option) => {
      option.addEventListener('click', () => {
        roleOptions.forEach((o) => o.classList.remove('active'));
        option.classList.add('active');
        hiddenRoleInput.value = option.getAttribute('data-role');
      });
    });
  }

  // Register Form Handler
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('reg-name').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;
      const confirmPassword = document.getElementById('reg-confirm-password').value;
      const role = hiddenRoleInput.value;
      const errEl = document.getElementById('error-message');

      if (errEl) errEl.style.display = 'none';

      if (password !== confirmPassword) {
        if (errEl) {
          errEl.innerText = 'Passwords do not match';
          errEl.style.display = 'block';
        }
        return;
      }

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showToast('Account created successfully!');
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify({
            id: data._id,
            name: data.name,
            email: data.email,
            role: data.role
          }));
          
          setTimeout(() => {
            window.location.href = data.role === 'employer' ? '/employer-dashboard.html' : '/seeker-dashboard.html';
          }, 1500);
        } else {
          if (errEl) {
            errEl.innerText = data.message || 'Registration failed. Try again.';
            errEl.style.display = 'block';
          }
        }
      } catch (error) {
        console.error(error);
        if (errEl) {
          errEl.innerText = 'Server error connection failed';
          errEl.style.display = 'block';
        }
      }
    });
  }

  // Login Form Handler
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const errEl = document.getElementById('error-message');

      if (errEl) errEl.style.display = 'none';

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showToast('Signed in successfully!');
          localStorage.setItem('token', data.token);
          
          const rememberMe = document.getElementById('login-remember');
          if (rememberMe && rememberMe.checked) {
            localStorage.setItem('rememberMe', 'true');
          } else {
            localStorage.removeItem('rememberMe');
          }
          localStorage.setItem('user', JSON.stringify({
            id: data._id,
            name: data.name,
            email: data.email,
            role: data.role
          }));

          setTimeout(() => {
            window.location.href = data.role === 'employer' ? '/employer-dashboard.html' : '/seeker-dashboard.html';
          }, 1500);
        } else {
          if (errEl) {
            errEl.innerText = data.message || 'Invalid email or password';
            errEl.style.display = 'block';
          }
        }
      } catch (error) {
        console.error(error);
        if (errEl) {
          errEl.innerText = 'Server error connection failed';
          errEl.style.display = 'block';
        }
      }
    });
  }
});
