// Dashboard and Posting Logic
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  // Initialize notifications on all logged-in pages
  if (
    path.includes('seeker-dashboard') ||
    path.includes('employer-dashboard') ||
    path.includes('profile') ||
    path.includes('post-job')
  ) {
    loadNotifications();
    setupNotificationMarkAllRead();
  }

  // Route specific loads
  if (path.includes('seeker-dashboard')) {
    initSeekerDashboard();
  } else if (path.includes('employer-dashboard')) {
    initEmployerDashboard();
  } else if (path.includes('post-job.html')) {
    initPostJobPage();
  }
});

// -----------------------------------------------------------------
// NOTIFICATION HUBS METHODS
// -----------------------------------------------------------------
async function loadNotifications() {
  const container = document.getElementById('notifications-list-container');
  if (!container) return;

  try {
    const response = await fetch('/api/notifications', {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (response.ok && data.success) {
      if (data.data.length === 0) {
        container.innerHTML = `
          <p style="color: var(--text-muted); text-align: center; font-size: 0.85rem; padding: 1rem 0;">No new alerts.</p>
        `;
        return;
      }

      let alertsHTML = '';
      data.data.forEach((note) => {
        alertsHTML += `
          <div class="notification-item ${note.isRead ? '' : 'unread'}">
            <div class="notification-content">
              <div>${note.message}</div>
              <div class="notification-time">🕒 ${new Date(note.createdAt).toLocaleString()}</div>
            </div>
          </div>
        `;
      });
      container.innerHTML = alertsHTML;
    }
  } catch (error) {
    console.error(error);
  }
}

function setupNotificationMarkAllRead() {
  const btn = document.getElementById('mark-notifications-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (response.ok && data.success) {
        showToast('All alerts marked read');
        loadNotifications();
      }
    } catch (error) {
      console.error(error);
    }
  });
}

// -----------------------------------------------------------------
// JOB SEEKER DASHBOARD PANEL
// -----------------------------------------------------------------
async function initSeekerDashboard() {
  const userString = localStorage.getItem('user');
  if (userString) {
    try {
      const user = JSON.parse(userString);
      if (user && user.name) {
        document.getElementById('welcome-seeker-title').innerText = `Welcome, ${user.name}`;
      }
    } catch (e) {
      console.error('Failed to parse user string in seeker dashboard:', e);
    }
  }

  const container = document.getElementById('applications-list-container');
  if (!container) return;

  try {
    const response = await fetch('/api/applications', {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (response.ok && data.success) {
      const applications = data.data;

      // Update Seeker metrics
      document.getElementById('stat-total-apps').innerText = applications.length;
      
      const pendingCount = applications.filter((a) => a.status === 'Pending').length;
      const shortlistCount = applications.filter((a) => a.status === 'Shortlisted').length;

      document.getElementById('stat-pending-apps').innerText = pendingCount;
      document.getElementById('stat-shortlist-apps').innerText = shortlistCount;

      if (applications.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 2rem 0;">
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">You haven't submitted any job applications yet.</p>
            <a href="/jobs.html" class="btn btn-primary" style="padding: 0.5rem 1rem; border-radius: 8px;">Browse Active Jobs</a>
          </div>
        `;
        return;
      }

      let listHTML = '';
      applications.forEach((app) => {
        const job = app.jobId;
        if (!job) return;

        let badgeClass = 'badge-pending';
        if (app.status === 'Shortlisted') badgeClass = 'badge-shortlisted';
        if (app.status === 'Rejected') badgeClass = 'badge-rejected';

        listHTML += `
          <div class="job-card" data-status="${app.status.toLowerCase()}" style="padding: 1.25rem; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <h4 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; cursor: pointer;" onclick="window.location.href='/job-details.html?id=${job._id}'">${job.title}</h4>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">🏢 ${job.employerId ? job.employerId.name : 'Recruiter'} • 📍 ${job.location}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Submitted on: ${new Date(app.appliedAt).toLocaleDateString()}</div>
              </div>
              <div>
                <span class="badge ${badgeClass}">${app.status}</span>
              </div>
            </div>
          </div>
        `;
      });
      container.innerHTML = listHTML;
    }
  } catch (error) {
    console.error(error);
    container.innerHTML = '<p style="color: var(--accent-color);">Failed to retrieve applications.</p>';
  }
}

// -----------------------------------------------------------------
// EMPLOYER DASHBOARD PANEL
// -----------------------------------------------------------------
async function initEmployerDashboard() {
  const userString = localStorage.getItem('user');
  let employerId = '';
  if (userString) {
    try {
      const user = JSON.parse(userString);
      if (user) {
        employerId = user.id || '';
        if (user.name) {
          document.getElementById('welcome-employer-title').innerText = `Recruiter Panel: ${user.name}`;
        }
      }
    } catch (e) {
      console.error('Failed to parse user string in employer dashboard:', e);
    }
  }

  // Setup tabs toggling
  const tabs = document.querySelectorAll('.tab-nav button');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach((tc) => tc.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(tab.getAttribute('data-tab')).classList.add('active');
    });
  });

  // Load Job listings and applications
  loadEmployerJobs(employerId);
  loadEmployerApplicants();
}

async function loadEmployerJobs(employerId) {
  const container = document.getElementById('listings-container');
  if (!container) return;

  try {
    const response = await fetch('/api/jobs');
    const data = await response.json();

    if (response.ok && data.success) {
      // Filter jobs created by this employer
      const myJobs = data.data.filter((j) => j.employerId && j.employerId._id === employerId);
      
      document.getElementById('stat-total-jobs').innerText = myJobs.length;

      if (myJobs.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 2rem 0;">
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">You haven't posted any job vacancies yet.</p>
            <a href="/post-job.html" class="btn btn-primary" style="padding: 0.5rem 1rem; border-radius: 8px;">➕ Create First Post</a>
          </div>
        `;
        return;
      }

      let listingsHTML = '';
      myJobs.forEach((job) => {
        listingsHTML += `
          <div class="job-card" style="padding: 1.25rem; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <h4 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; cursor: pointer;" onclick="window.location.href='/job-details.html?id=${job._id}'">${job.title}</h4>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">📍 ${job.location} • 💼 ${job.jobType} • 💰 ${formatSalary(job.salaryMin, job.salaryMax)}</div>
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <a href="/post-job.html?id=${job._id}" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 6px;">✏️ Edit</a>
                <button onclick="deleteJobListing('${job._id}')" class="btn btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 6px;">🗑️ Delete</button>
              </div>
            </div>
          </div>
        `;
      });
      container.innerHTML = listingsHTML;
    }
  } catch (error) {
    console.error(error);
    container.innerHTML = '<p style="color: var(--accent-color);">Failed to retrieve listings.</p>';
  }
}

async function deleteJobListing(jobId) {
  if (!confirm('Are you absolutely sure you want to delete this job listing? All applicant histories for it will be affected.')) {
    return;
  }

  try {
    const response = await fetch(`/api/jobs/${jobId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (response.ok && data.success) {
      showToast('Listing deleted successfully!');
      // Re-trigger reload
      const userString = localStorage.getItem('user');
      if (userString) {
        try {
          const user = JSON.parse(userString);
          if (user && user.id) {
            loadEmployerJobs(user.id);
          }
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      showToast(data.message || 'Failed to delete listing', 'error');
    }
  } catch (error) {
    console.error(error);
    showToast('Connection error failed', 'error');
  }
}

async function loadEmployerApplicants() {
  const container = document.getElementById('applicants-container');
  if (!container) return;

  try {
    const response = await fetch('/api/applications', {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (response.ok && data.success) {
      const applicants = data.data;

      document.getElementById('stat-total-applicants').innerText = applicants.length;
      document.getElementById('stat-shortlisted-candidates').innerText = applicants.filter((a) => a.status === 'Shortlisted').length;

      if (applicants.length === 0) {
        container.innerHTML = `
          <p style="color: var(--text-secondary); text-align: center; padding: 2rem 0;">No candidates have applied to your active listings yet.</p>
        `;
        return;
      }

      let applicantsHTML = '';
      applicants.forEach((app) => {
        const profile = app.applicantProfile;
        const skillsTags = profile && profile.skills ? profile.skills.map((s) => `<span class="skill-tag">${s}</span>`).join(' ') : 'None';
        
        let badgeClass = 'badge-pending';
        if (app.status === 'Shortlisted') badgeClass = 'badge-shortlisted';
        if (app.status === 'Rejected') badgeClass = 'badge-rejected';

        // Render Action buttons if Pending
        let actionsHTML = `<span class="badge ${badgeClass}" style="padding:0.5rem 1rem;">${app.status}</span>`;
        if (app.status === 'Pending') {
          actionsHTML = `
            <div class="applicant-actions">
              <button onclick="updateStatus('${app._id}', 'Shortlisted')" class="btn btn-primary" style="padding:0.4rem 0.8rem; font-size:0.8rem; border-radius:6px; background:linear-gradient(135deg, #10b981, #059669);">Shortlist</button>
              <button onclick="updateStatus('${app._id}', 'Rejected')" class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.8rem; border-radius:6px;">Reject</button>
            </div>
          `;
        }

        applicantsHTML += `
          <div class="applicant-card">
            <div class="applicant-details">
              <h3 style="font-size:1.15rem;">${app.applicantId ? app.applicantId.name : 'Unknown Applicant'}</h3>
              <div style="font-size: 0.8rem; color: var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:0.5rem;">For Role: ${app.jobId ? app.jobId.title : 'Deleted Job'}</div>
              
              <div class="applicant-meta">
                <span>📧 ${app.applicantId ? app.applicantId.email : 'N/A'}</span>
                <span>📞 ${profile ? profile.phone || 'N/A' : 'N/A'}</span>
              </div>
              
              <div style="font-size:0.85rem; margin-bottom:0.5rem;">
                <span style="color:var(--text-muted);">Education:</span> <strong>${profile ? profile.education || 'N/A' : 'N/A'}</strong>
              </div>
              
              <div style="font-size:0.85rem; margin-bottom:0.5rem;">
                <span style="color:var(--text-muted);">Experience:</span> <span style="color:var(--text-secondary);">${profile ? profile.experience || 'N/A' : 'N/A'}</span>
              </div>
              
              <div style="font-size:0.85rem; margin-bottom:0.75rem; display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                <span style="color:var(--text-muted);">Skills:</span> ${skillsTags}
              </div>

              <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
                <a href="${app.resumeUrl}" target="_blank" class="btn btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; border-radius: 4px; display:inline-flex; align-items:center; gap:0.25rem;">📄 Download CV</a>
                <button onclick="contactSeeker('${app.applicantId ? app.applicantId._id : ''}', '${app.applicantId ? app.applicantId.email : ''}', '${app.applicantId ? app.applicantId.name : 'Candidate'}', '${app.jobId ? app.jobId.title : 'the role'}')" class="btn" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; border-radius: 4px; background: linear-gradient(135deg, #6366f1, #a855f7); color:#fff; display:inline-flex; align-items:center; gap:0.25rem;">💬 Contact Seeker</button>
              </div>
            </div>

            <div>
              ${actionsHTML}
            </div>
          </div>
        `;
      });
      container.innerHTML = applicantsHTML;
    }
  } catch (error) {
    console.error(error);
    container.innerHTML = '<p style="color: var(--accent-color);">Failed to retrieve candidate entries.</p>';
  }
}

async function updateStatus(applicationId, newStatus) {
  try {
    const response = await fetch(`/api/applications/${applicationId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: newStatus })
    });
    const data = await response.json();

    if (response.ok && data.success) {
      showToast(`Applicant status successfully updated to ${newStatus}`);
      loadEmployerApplicants();
      loadNotifications();
    } else {
      showToast(data.message || 'Failed to update status', 'error');
    }
  } catch (error) {
    console.error(error);
    showToast('Connection error failed', 'error');
  }
}

// -----------------------------------------------------------------
// POST & EDIT JOB FORM LOGIC
// -----------------------------------------------------------------
let formEditJobId = null;

async function initPostJobPage() {
  const urlParams = new URLSearchParams(window.location.search);
  formEditJobId = urlParams.get('id');

  const mainTitle = document.getElementById('form-main-title');
  const submitBtn = document.getElementById('submit-post-btn');
  const sidebarItem = document.getElementById('sidebar-post-item');

  if (formEditJobId) {
    // Edit Mode active
    if (mainTitle) mainTitle.innerText = 'Edit Job Listing Details';
    if (submitBtn) submitBtn.innerText = 'Update Listing Details';
    if (sidebarItem) {
      sidebarItem.innerHTML = `<a href="#">✏️ Editing Job Listing</a>`;
    }

    // Fetch details to pre-populate fields
    try {
      const response = await fetch(`/api/jobs/${formEditJobId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        const job = data.data;
        document.getElementById('job-post-title').value = job.title;
        document.getElementById('job-post-location').value = job.location;
        document.getElementById('job-post-type').value = job.jobType;
        document.getElementById('job-post-salmin').value = job.salaryMin;
        document.getElementById('job-post-salmax').value = job.salaryMax;
        document.getElementById('job-post-experience').value = job.experienceLevel;
        document.getElementById('job-post-desc').value = job.description;
        document.getElementById('job-post-qual').value = job.qualifications;
        document.getElementById('job-post-resp').value = job.responsibilities;
      } else {
        showToast('Error pre-populating fields', 'error');
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Handle Form submittals
  const postForm = document.getElementById('job-post-form');
  if (postForm) {
    postForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const jobData = {
        title: document.getElementById('job-post-title').value,
        location: document.getElementById('job-post-location').value,
        jobType: document.getElementById('job-post-type').value,
        salaryMin: Number(document.getElementById('job-post-salmin').value),
        salaryMax: Number(document.getElementById('job-post-salmax').value),
        experienceLevel: document.getElementById('job-post-experience').value,
        description: document.getElementById('job-post-desc').value,
        qualifications: document.getElementById('job-post-qual').value,
        responsibilities: document.getElementById('job-post-resp').value
      };

      try {
        const url = formEditJobId ? `/api/jobs/${formEditJobId}` : '/api/jobs';
        const method = formEditJobId ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method: method,
          headers: getAuthHeaders(),
          body: JSON.stringify(jobData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showToast(formEditJobId ? 'Job listing updated successfully!' : 'Job vacancy posted successfully!');
          setTimeout(() => {
            window.location.href = '/employer-dashboard.html';
          }, 1500);
        } else {
          showToast(data.message || 'Failed to submit job listing data', 'error');
        }
      } catch (error) {
        console.error(error);
        showToast('Connection error failed', 'error');
      }
    });
  }
}
