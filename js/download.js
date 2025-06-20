import { db, ref, get, child, storage, storageRef, getDownloadURL } from './firebase.js';

// Get app ID from URL
const urlParams = new URLSearchParams(window.location.search);
const appId = urlParams.get('id');

// DOM elements
const appName = document.getElementById('app-name');
const appDeveloper = document.getElementById('app-developer');
const appRating = document.getElementById('app-rating');
const appDownloads = document.getElementById('app-downloads');
const appIcon = document.getElementById('app-icon');
const appDescription = document.getElementById('app-description');
const appVersion = document.getElementById('app-version');
const appSize = document.getElementById('app-size');
const appUpdated = document.getElementById('app-updated');
const appRequirements = document.getElementById('app-requirements');
const screenshotsContainer = document.getElementById('screenshots');
const downloadBtn = document.getElementById('download-btn');
const downloadProgress = document.getElementById('download-progress');
const progressBar = document.getElementById('progress');
const progressPercent = document.getElementById('progress-percent');
const progressDownloaded = document.getElementById('progress-downloaded');
const progressTotal = document.getElementById('progress-total');
const downloadingAppName = document.getElementById('downloading-app-name');

// Load app details from Firebase
function loadAppDetails() {
    if (!appId) {
        window.location.href = 'index.html';
        return;
    }

    const dbRef = ref(db);
    
    get(child(dbRef, `apps/${appId}`)).then((snapshot) => {
        if (snapshot.exists()) {
            const app = snapshot.val();
            
            // Update DOM with app details
            appName.textContent = app.name;
            appDeveloper.textContent = app.developer;
            appRating.textContent = app.rating;
            appDownloads.textContent = `(${app.downloads}+ downloads)`;
            appIcon.src = app.icon;
            appDescription.textContent = app.description;
            appVersion.textContent = app.version;
            appSize.textContent = app.size;
            appUpdated.textContent = new Date(app.updated).toLocaleDateString();
            appRequirements.textContent = app.requirements;
            downloadingAppName.textContent = app.name;
            
            // Load screenshots
            screenshotsContainer.innerHTML = '';
            app.screenshots.forEach(screenshot => {
                const img = document.createElement('img');
                img.src = screenshot;
                img.alt = `${app.name} screenshot`;
                screenshotsContainer.appendChild(img);
            });
            
            // Set up download button
            downloadBtn.addEventListener('click', () => downloadApp(app));
        } else {
            window.location.href = 'index.html';
        }
    }).catch((error) => {
        console.error(error);
        window.location.href = 'index.html';
    });
}

// Download app function
function downloadApp(app) {
    // Show download progress
    downloadProgress.style.display = 'flex';
    
    // Simulate download progress (in a real app, you would use actual download progress)
    let progress = 0;
    const totalSize = parseInt(app.size);
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // After download completes
            setTimeout(() => {
                downloadProgress.style.display = 'none';
                
                // In a real app, you would actually download the file
                // For demo purposes, we'll just show an alert
                alert(`${app.name} has been downloaded successfully!`);
            }, 500);
        }
        
        // Update progress UI
        progressBar.style.width = `${progress}%`;
        progressPercent.textContent = Math.floor(progress);
        progressDownloaded.textContent = (totalSize * progress / 100).toFixed(1);
        progressTotal.textContent = totalSize;
    }, 200);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadAppDetails();
});
