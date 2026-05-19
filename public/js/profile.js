// Profile Settings Handler
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('profile.html')) {
    initProfilePage();
  }
});

async function initProfilePage() {
  const form = document.getElementById('profile-form');
  const seekerSection = document.getElementById('seeker-fields-section');
  const employerSection = document.getElementById('employer-fields-section');
  const sidebarDashboardLink = document.getElementById('sidebar-dashboard-link');
  const backBtn = document.getElementById('dashboard-back-btn');

  let userRole = '';

  // Setup file upload indicators
  const fileInput = document.getElementById('prof-resume');
  const fileNameDisplay = document.getElementById('prof-file-name');
  if (fileInput && fileNameDisplay) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        fileNameDisplay.innerText = `Selected file: ${fileInput.files[0].name}`;
        fileNameDisplay.style.display = 'block';
      } else {
        fileNameDisplay.style.display = 'none';
      }
    });
  }

  // 1. Fetch Profile data to populate
  try {
    const response = await fetch('/api/profile', {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (response.ok && data.success) {
      const profile = data.data;
      const user = profile.userId;

      userRole = user.role;

      // Update back button destinations
      const dashboardUrl = userRole === 'employer' ? '/employer-dashboard.html' : '/seeker-dashboard.html';
      if (backBtn) {
        backBtn.href = dashboardUrl;
      }

      // Dynamic Sidebar rendering based on role
      const sidebarMenu = document.querySelector('.db-sidebar-menu');
      if (sidebarMenu) {
        if (userRole === 'employer') {
          sidebarMenu.innerHTML = `
            <li class="db-menu-item"><a href="/employer-dashboard.html">📊 Recruiting Overview</a></li>
            <li class="db-menu-item"><a href="/post-job.html">➕ Post a New Job</a></li>
            <li class="db-menu-item active"><a href="/profile.html">🏢 Company Profile</a></li>
            <li class="db-menu-item"><a href="/index.html">🏡 Home Page</a></li>
          `;
        } else {
          sidebarMenu.innerHTML = `
            <li class="db-menu-item"><a href="/seeker-dashboard.html">📊 Applications Dashboard</a></li>
            <li class="db-menu-item active"><a href="/profile.html">👤 Personal Profile</a></li>
            <li class="db-menu-item"><a href="/jobs.html">🔍 Search Jobs</a></li>
            <li class="db-menu-item"><a href="/index.html">🏡 Home Page</a></li>
          `;
        }
      }

      // Populate base fields
      document.getElementById('prof-name').value = user.name || '';
      document.getElementById('prof-email').value = user.email || '';
      document.getElementById('prof-role').value = userRole;
      document.getElementById('prof-phone').value = profile.phone || '';

      if (userRole === 'seeker') {
        // Toggle Seeker UI segment
        seekerSection.style.display = 'block';
        document.getElementById('profile-section-header').innerText = 'Personal Professional Credentials';

        // Populate seeker inputs
        document.getElementById('prof-skills').value = profile.skills ? profile.skills.join(', ') : '';
        document.getElementById('prof-education').value = profile.education || '';
        document.getElementById('prof-experience').value = profile.experience || '';

        // Current resume download display
        const resumeContainer = document.getElementById('current-resume-display');
        if (profile.resumeUrl) {
          resumeContainer.innerHTML = `📄 <strong>Current Resume:</strong> <a href="${profile.resumeUrl}" target="_blank" style="color: var(--primary-color); font-weight: 700; text-decoration: underline;">View Saved CV File</a>`;
        } else {
          resumeContainer.innerHTML = `<span style="color: var(--text-muted);">No resume uploaded yet.</span>`;
        }

      } else if (userRole === 'employer') {
        // Toggle Employer UI segment
        employerSection.style.display = 'block';
        document.getElementById('profile-section-header').innerText = 'Company Info Details';

        // Populate employer inputs
        document.getElementById('prof-company').value = profile.companyName || '';
        document.getElementById('prof-industry').value = profile.industry || '';
        document.getElementById('prof-website').value = profile.website || '';
        document.getElementById('prof-comp-desc').value = profile.companyDesc || '';
      }

    } else {
      showToast(data.message || 'Failed to load profile details', 'error');
    }
  } catch (error) {
    console.error(error);
    showToast('Failed to connect to the backend server', 'error');
  }

  // 2. Handle Form submissions
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('prof-name').value;
      const phone = document.getElementById('prof-phone').value;

      let submitData;
      let headers = { ...getAuthHeaders() };

      if (userRole === 'seeker') {
        // Form Data is required for file uploads
        submitData = new FormData();
        submitData.append('name', name);
        submitData.append('phone', phone);
        submitData.append('skills', document.getElementById('prof-skills').value);
        submitData.append('education', document.getElementById('prof-education').value);
        submitData.append('experience', document.getElementById('prof-experience').value);

        if (fileInput.files[0]) {
          submitData.append('resume', fileInput.files[0]);
        }
        
        // Remove Content-Type so browser sets boundary automatically
        delete headers['Content-Type'];
      } else {
        // Employer JSON is simple
        submitData = JSON.stringify({
          name,
          phone,
          companyName: document.getElementById('prof-company').value,
          industry: document.getElementById('prof-industry').value,
          website: document.getElementById('prof-website').value,
          companyDesc: document.getElementById('prof-comp-desc').value
        });
      }

      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: headers,
          body: submitData
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showToast('Profile updated successfully!');
          
          // Proactively update cached username in local storage
          const userObj = JSON.parse(localStorage.getItem('user'));
          userObj.name = name;
          localStorage.setItem('user', JSON.stringify(userObj));
          
          // Re-update nav header
          updateNavbar();

          // Refresh details dynamically
          initProfilePage();
          if (fileNameDisplay) fileNameDisplay.style.display = 'none';
        } else {
          showToast(data.message || 'Failed to update profile settings', 'error');
        }
      } catch (error) {
        console.error(error);
        showToast('Connection error failed to complete', 'error');
      }
    });
  }
}
