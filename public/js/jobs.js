// Job listings and details handler
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path.includes('jobs.html')) {
    initJobsPage();
  } else if (path.includes('job-details.html')) {
    initJobDetailsPage();
  }
});


// -----------------------------------------------------------------
// JOBS LISTINGS PAGE INTERACTIVE METHODS
// -----------------------------------------------------------------
function initJobsPage() {
  const filterForm = document.getElementById('filters-form');
  const listingsContainer = document.getElementById('job-listings-container');
  const resetBtn = document.getElementById('reset-filters');

  // Load all jobs on first load
  fetchAndRenderJobs();

  if (filterForm) {
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const keyword = document.getElementById('filter-keyword').value;
      const location = document.getElementById('filter-location').value;
      const jobType = document.getElementById('filter-jobtype').value;
      const experienceLevel = document.getElementById('filter-experience').value;
      const salaryMin = document.getElementById('filter-salary').value;

      // Build query string
      let params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (location) params.append('location', location);
      if (jobType) params.append('jobType', jobType);
      if (experienceLevel) params.append('experienceLevel', experienceLevel);
      if (salaryMin) params.append('salaryMin', salaryMin);

      fetchAndRenderJobs(params.toString());
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      filterForm.reset();
      fetchAndRenderJobs();
    });
  }
}

async function fetchAndRenderJobs(queryString = '') {
  const container = document.getElementById('job-listings-container');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 4rem 1rem;">
      <div style="font-size: 1.5rem; margin-bottom: 1rem; animation: spin 1s infinite linear;">⏳</div>
      <p style="color: var(--text-secondary);">Loading premier opportunities...</p>
    </div>
  `;

  try {
    const url = queryString ? `/api/jobs?${queryString}` : '/api/jobs';
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok && data.success) {
      if (data.data.length === 0) {
        container.innerHTML = `
          <div class="glass-card" style="text-align: center; padding: 4rem 1rem;">
            <div style="font-size: 2.5rem; margin-bottom: 1rem;">🔍</div>
            <h3 style="font-family: var(--font-heading); font-size: 1.25rem; margin-bottom: 0.5rem;">No Opportunities Found</h3>
            <p style="color: var(--text-secondary); max-width: 400px; margin: 0 auto;">We couldn't find any job posts matching your filter queries. Try adjusting your parameters or clear active filters.</p>
          </div>
        `;
        return;
      }

      let cardsHTML = '';
      data.data.forEach((job) => {
        cardsHTML += `
          <div class="job-card">
            <div class="job-card-header">
              <div>
                <h3 class="job-card-title" onclick="window.location.href='/job-details.html?id=${job._id}'">${job.title}</h3>
                <div class="job-card-company">🏢 ${job.employerId ? job.employerId.name : 'Independent Recruiter'}</div>
              </div>
              <span class="badge badge-pending" style="color: #fff; background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.4);">${job.jobType}</span>
            </div>
            
            <div class="job-card-meta">
              <span class="job-meta-item">📍 ${job.location}</span>
              <span class="job-meta-item">📈 ${job.experienceLevel}</span>
              <span class="job-meta-item">📅 ${new Date(job.createdAt).toLocaleDateString()}</span>
            </div>

            <p class="job-card-desc">${job.description}</p>

            <div class="job-card-actions">
              <span class="job-card-salary">${formatSalary(job.salaryMin, job.salaryMax)}</span>
              <a href="/job-details.html?id=${job._id}" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem; border-radius: 8px;">View Details</a>
            </div>
          </div>
        `;
      });
      container.innerHTML = cardsHTML;
    } else {
      container.innerHTML = `
        <div class="glass-card" style="text-align: center; color: var(--accent-color); padding: 3rem;">
          Error retrieving jobs: ${data.message}
        </div>
      `;
    }
  } catch (error) {
    console.error(error);
    container.innerHTML = `
      <div class="glass-card" style="text-align: center; color: var(--accent-color); padding: 3rem;">
        Connection error. Failed to communicate with server.
      </div>
    `;
  }
}

// -----------------------------------------------------------------
// SINGLE JOB DETAILS PAGE INTERACTIVE METHODS
// -----------------------------------------------------------------
let currentJob = null;

async function initJobDetailsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id');

  if (!jobId) {
    window.location.href = '/jobs.html';
    return;
  }

  const loadingEl = document.getElementById('job-details-loading');
  const contentGrid = document.getElementById('job-details-content');

  try {
    const response = await fetch(`/api/jobs/${jobId}`);
    const data = await response.json();

    if (response.ok && data.success) {
      currentJob = data.data;
      const employerProfile = data.employer;

      // Populate core details
      document.getElementById('job-title').innerText = currentJob.title;
      document.getElementById('job-company').innerText = `🏢 ${currentJob.employerId ? currentJob.employerId.name : 'Recruiter'}`;
      document.getElementById('job-description').innerText = currentJob.description;
      
      // Multi-line items mapping
      document.getElementById('job-qualifications').innerHTML = currentJob.qualifications
        .split('\n')
        .map((q) => `• ${q.trim()}`)
        .join('<br>');
      document.getElementById('job-responsibilities').innerHTML = currentJob.responsibilities
        .split('\n')
        .map((r) => `• ${r.trim()}`)
        .join('<br>');

      // Badges
      document.getElementById('job-badges').innerHTML = `
        <span class="badge badge-pending" style="color: #fff; background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.4);">${currentJob.jobType}</span>
        <span class="badge badge-pending" style="color: #fff; background: rgba(168, 85, 247, 0.2); border-color: rgba(168, 85, 247, 0.4);">${currentJob.experienceLevel}</span>
      `;

      // Meta & Summaries
      document.getElementById('job-metadata').innerHTML = `
        <span class="job-meta-item">📍 Location: ${currentJob.location}</span>
        <span class="job-meta-item">💰 Salary: ${formatSalary(currentJob.salaryMin, currentJob.salaryMax)}</span>
        <span class="job-meta-item">📅 Posted: ${new Date(currentJob.createdAt).toLocaleDateString()}</span>
      `;

      document.getElementById('summary-location').innerText = currentJob.location;
      document.getElementById('summary-type').innerText = currentJob.jobType;
      document.getElementById('summary-experience').innerText = currentJob.experienceLevel;
      document.getElementById('summary-salary').innerText = formatSalary(currentJob.salaryMin, currentJob.salaryMax);

      // Employer details
      if (employerProfile && employerProfile.companyName) {
        document.getElementById('company-sidebar-card').style.display = 'block';
        document.getElementById('company-industry').innerText = employerProfile.industry || 'N/A';
        
        if (employerProfile.website) {
          const webLink = document.getElementById('company-website');
          webLink.href = employerProfile.website;
          webLink.innerText = employerProfile.website.replace('https://', '').replace('http://', '');
        } else {
          document.getElementById('company-website').innerText = 'N/A';
        }
        document.getElementById('company-desc').innerText = employerProfile.companyDesc || '';
      } else {
        document.getElementById('company-sidebar-card').style.display = 'none';
      }

      // Check Application state to adjust buttons
      setupApplyButton(jobId);

      loadingEl.style.display = 'none';
      contentGrid.style.display = 'grid';
    } else {
      loadingEl.innerHTML = `
        <div style="text-align: center; color: var(--accent-color);">
          <h3>Failed to retrieve job details</h3>
          <p>${data.message}</p>
          <a href="/jobs.html" class="btn btn-secondary" style="margin-top: 1rem;">Back to Browse</a>
        </div>
      `;
    }
  } catch (error) {
    console.error(error);
    loadingEl.innerHTML = `
      <div style="text-align: center; color: var(--accent-color);">
        <h3>Connection Failure</h3>
        <p>Failed to connect to the backend server.</p>
        <a href="/jobs.html" class="btn btn-secondary" style="margin-top: 1rem;">Back to Browse</a>
      </div>
    `;
  }
}

async function setupApplyButton(jobId) {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const actionContainer = document.getElementById('application-action-container');

  if (!token || !userString) {
    actionContainer.innerHTML = `
      <button onclick="window.location.href='/login.html'" class="btn btn-primary" style="width: 100%;">Sign in to Apply</button>
    `;
    return;
  }

  const user = JSON.parse(userString);

  // If Employer
  if (user.role === 'employer') {
    // Check if the current employer posted this job
    if (currentJob.employerId && currentJob.employerId._id === user.id) {
      actionContainer.innerHTML = `
        <button onclick="window.location.href='/post-job.html?id=${jobId}'" class="btn btn-primary" style="width: 100%;">✏️ Edit Job Posting</button>
      `;
    } else {
      actionContainer.innerHTML = `
        <p style="color: var(--text-muted); font-size: 0.85rem; text-align: center;">Recruiters cannot apply for listings.</p>
      `;
    }
    return;
  }

  // If Job Seeker, check if already applied
  try {
    const response = await fetch('/api/applications', {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (response.ok && data.success) {
      const alreadyApplied = data.data.find((app) => app.jobId && app.jobId._id === jobId);

      if (alreadyApplied) {
        let statusBadgeClass = 'badge-pending';
        if (alreadyApplied.status === 'Shortlisted') statusBadgeClass = 'badge-shortlisted';
        if (alreadyApplied.status === 'Rejected') statusBadgeClass = 'badge-rejected';

        actionContainer.innerHTML = `
          <div style="text-align: center;">
            <div class="badge ${statusBadgeClass}" style="width: 100%; padding: 0.6rem; font-size: 0.9rem; text-align: center; margin-bottom: 0.5rem;">
              Application Submitted (${alreadyApplied.status})
            </div>
            <p style="color: var(--text-muted); font-size: 0.8rem;">You applied on ${new Date(alreadyApplied.appliedAt).toLocaleDateString()}</p>
          </div>
        `;
      } else {
        // Prepare Modal interaction trigger
        actionContainer.innerHTML = `
          <button id="apply-trigger-btn" class="btn btn-primary" style="width: 100%;">Apply For Job</button>
        `;

        document.getElementById('apply-trigger-btn').addEventListener('click', () => {
          openApplyModal(jobId);
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function openApplyModal(jobId) {
  const modal = document.getElementById('apply-modal');
  const closeBtn = document.getElementById('close-apply-modal');
  const form = document.getElementById('apply-form');
  const useProfileCheckbox = document.getElementById('use-profile-resume');
  const resumeUploadGroup = document.getElementById('custom-resume-upload');
  const resumeStatusText = document.getElementById('profile-resume-status');

  document.getElementById('apply-job-id').value = jobId;
  modal.style.display = 'flex';

  // Fetch seeker profile to see if saved resume exists
  try {
    resumeStatusText.innerText = 'Checking profile...';
    const response = await fetch('/api/profile', {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (response.ok && data.success && data.data.resumeUrl) {
      resumeStatusText.innerHTML = `📄 Resume found: <a href="${data.data.resumeUrl}" target="_blank" style="color: var(--primary-color); font-weight:600;">View Profile Resume</a>`;
      useProfileCheckbox.checked = true;
      resumeUploadGroup.style.display = 'none';
    } else {
      resumeStatusText.innerText = 'No resume found on profile. Please upload one below.';
      useProfileCheckbox.checked = false;
      useProfileCheckbox.disabled = true; // force upload
      document.getElementById('profile-resume-option').style.borderBottom = 'none';
      resumeUploadGroup.style.display = 'block';
    }
  } catch (error) {
    console.error(error);
    resumeStatusText.innerText = 'Unable to verify profile details';
  }

  // Toggle resume upload group on checkbox change
  useProfileCheckbox.addEventListener('change', () => {
    if (useProfileCheckbox.checked) {
      resumeUploadGroup.style.display = 'none';
    } else {
      resumeUploadGroup.style.display = 'block';
    }
  });

  // Handle selected file details display
  const fileInput = document.getElementById('apply-resume');
  const fileNameDisplay = document.getElementById('apply-file-name');
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

  // Modal closers
  const closeModalFunc = () => {
    modal.style.display = 'none';
  };
  closeBtn.addEventListener('click', closeModalFunc);
  window.addEventListener('click', (e) => {
    if (e.target === modal) closeModalFunc();
  });

  // Handle modal submit
  form.onsubmit = async (e) => {
    e.preventDefault();

    const jobId = document.getElementById('apply-job-id').value;
    const useProfile = useProfileCheckbox.checked;
    const resumeFile = fileInput.files[0];

    const formData = new FormData();
    formData.append('jobId', jobId);

    if (!useProfile) {
      if (!resumeFile) {
        showToast('Please upload a resume file first', 'error');
        return;
      }
      formData.append('resume', resumeFile);
    }

    try {
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.innerText = 'Submitting Application...';
      submitBtn.disabled = true;

      // Note: For multipart/form-data, we let the browser set the boundary automatically,
      // but we STILL need the Bearer token in the headers!
      const headers = { ...getAuthHeaders() };
      delete headers['Content-Type']; // Let browser set boundary

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: headers,
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('Application submitted successfully!');
        closeModalFunc();
        // Refresh detail screen
        setupApplyButton(jobId);
      } else {
        showToast(data.message || 'Failed to submit application', 'error');
        submitBtn.innerText = 'Submit Secure Application';
        submitBtn.disabled = false;
      }
    } catch (error) {
      console.error(error);
      showToast('Connection error failed', 'error');
    }
  };
}
