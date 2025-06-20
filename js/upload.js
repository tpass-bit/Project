import { db, ref, set, storage, storageRef, uploadBytesResumable, getDownloadURL } from './firebase.js';

// DOM elements
const uploadForm = document.getElementById('app-upload-form');
const iconPreview = document.getElementById('icon-preview');
const iconUpload = document.getElementById('app-icon');
const screenshotsUpload = document.getElementById('app-screenshots');
const screenshotsGrid = document.getElementById('screenshots-grid');
const uploadProgress = document.getElementById('upload-progress');
const uploadProgressBar = document.getElementById('upload-progress-bar');
const uploadProgressPercent = document.getElementById('upload-progress-percent');
const uploadingAppName = document.getElementById('uploading-app-name');

// Preview icon when selected
iconUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            iconPreview.src = event.target.result;
            iconPreview.style.display = 'block';
            iconPreview.parentElement.querySelector('i').style.display = 'none';
            iconPreview.parentElement.querySelector('span').style.display = 'none';
        }
        reader.readAsDataURL(file);
    }
});

// Preview screenshots when selected
screenshotsUpload.addEventListener('change', function(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
        screenshotsGrid.innerHTML = '';
        
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const screenshotItem = document.createElement('div');
                    screenshotItem.className = 'screenshot-item';
                    
                    screenshotItem.innerHTML = `
                        <img src="${event.target.result}" alt="Screenshot">
                        <div class="remove-screenshot">&times;</div>
                    `;
                    
                    // Add remove functionality
                    const removeBtn = screenshotItem.querySelector('.remove-screenshot');
                    removeBtn.addEventListener('click', () => {
                        screenshotItem.remove();
                    });
                    
                    screenshotsGrid.appendChild(screenshotItem);
                }
                reader.readAsDataURL(file);
            }
        });
    }
});

// Helper function to upload files with progress tracking
function uploadFile(storageRef, file) {
    return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadTask.on('state_changed',
            (snapshot) => {
                // Update progress
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                uploadProgressBar.style.width = `${progress}%`;
                uploadProgressPercent.textContent = Math.floor(progress);
                
                // Make sure progress is visible
                uploadProgress.style.display = 'flex';
            },
            (error) => {
                console.error('Upload error:', error);
                uploadProgress.style.display = 'none';
                reject(error);
            },
            () => {
                resolve(uploadTask.snapshot);
            }
        );
    });
}

// Handle form submission
uploadForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form values
    const appName = document.getElementById('app-name').value;
    const developer = document.getElementById('app-developer').value;
    const description = document.getElementById('app-description').value;
    const version = document.getElementById('app-version').value;
    const requirements = document.getElementById('app-requirements').value;
    const category = document.getElementById('app-category').value;
    const featured = document.getElementById('featured-app').checked;
    const newRelease = document.getElementById('new-release').checked;
    const appFile = document.getElementById('app-file').files[0];
    
    // Validate required fields and files
    if (!appName || !developer || !description || !version || !requirements || !category) {
        alert('Please fill all required fields');
        return;
    }
    
    if (!iconUpload.files[0]) {
        alert('Please select an app icon');
        return;
    }
    
    if (!appFile) {
        alert('Please select an app file (APK)');
        return;
    }
    
    try {
        // Show upload progress
        uploadingAppName.textContent = appName;
        uploadProgress.style.display = 'flex';
        uploadProgressBar.style.width = '0%';
        uploadProgressPercent.textContent = '0';
        
        // Generate unique ID for the app
        const appId = 'app-' + Date.now();
        
        // Upload icon
        const iconPath = `app-icons/${appId}`;
        const iconRef = storageRef(storage, iconPath);
        const iconSnapshot = await uploadFile(iconRef, iconUpload.files[0]);
        const iconUrl = await getDownloadURL(iconSnapshot.ref);
        
        // Upload screenshots
        const screenshotItems = screenshotsGrid.querySelectorAll('.screenshot-item');
        const screenshotUrls = [];
        
        for (let i = 0; i < screenshotItems.length; i++) {
            const img = screenshotItems[i].querySelector('img');
            const blob = await fetch(img.src).then(res => res.blob());
            const screenshotPath = `app-screenshots/${appId}-${i}`;
            const screenshotRef = storageRef(storage, screenshotPath);
            const screenshotSnapshot = await uploadFile(screenshotRef, blob);
            const screenshotUrl = await getDownloadURL(screenshotSnapshot.ref);
            screenshotUrls.push(screenshotUrl);
        }
        
        // Upload APK file
        const appPath = `apps/${appId}.apk`;
        const appRef = storageRef(storage, appPath);
        const appSnapshot = await uploadFile(appRef, appFile);
        const appUrl = await getDownloadURL(appSnapshot.ref);
        
        // Calculate file size in MB
        const fileSizeMB = (appFile.size / (1024 * 1024)).toFixed(1);
        
        // Save app data to database
        const appData = {
            id: appId,
            name: appName,
            developer: developer,
            description: description,
            version: version,
            requirements: requirements,
            category: category,
            featured: featured,
            newRelease: newRelease,
            icon: iconUrl,
            screenshots: screenshotUrls,
            downloadUrl: appPath,
            rating: 0,
            downloads: "0",
            size: `${fileSizeMB} MB`,
            updated: new Date().toISOString()
        };
        
        await set(ref(db, `apps/${appId}`), appData);
        
        // Hide progress and show success
        uploadProgress.style.display = 'none';
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <p>App uploaded successfully!</p>
            <button onclick="this.parentElement.remove()">OK</button>
        `;
        document.body.appendChild(successMsg);
        
        // Reset form (but keep screenshots if you want)
        uploadForm.reset();
        iconPreview.style.display = 'none';
        iconPreview.src = '';
        iconPreview.parentElement.querySelector('i').style.display = 'block';
        iconPreview.parentElement.querySelector('span').style.display = 'block';
        screenshotsGrid.innerHTML = '';
        
    } catch (error) {
        console.error('Upload failed:', error);
        uploadProgress.style.display = 'none';
        
        // Show error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <p>Upload failed: ${error.message}</p>
            <button onclick="this.parentElement.remove()">OK</button>
        `;
        document.body.appendChild(errorMsg);
    }
});
