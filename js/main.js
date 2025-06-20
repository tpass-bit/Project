import { db, ref, get, child } from './firebase.js';

// Reference to the database
const dbRef = ref(db);

// Load apps from Firebase
function loadApps() {
    get(child(dbRef, 'apps')).then((snapshot) => {
        if (snapshot.exists()) {
            const apps = snapshot.val();
            const featuredAppsContainer = document.getElementById('featured-apps');
            const newAppsContainer = document.getElementById('new-apps');
            
            // Clear existing content
            featuredAppsContainer.innerHTML = '';
            newAppsContainer.innerHTML = '';
            
            // Separate featured and new apps
            const featuredApps = [];
            const newApps = [];
            
            for (const appId in apps) {
                const app = apps[appId];
                if (app.featured) {
                    featuredApps.push(app);
                }
                if (app.newRelease) {
                    newApps.push(app);
                }
            }
            
            // Display featured apps
            featuredApps.forEach(app => {
                const appCard = createAppCard(app);
                featuredAppsContainer.appendChild(appCard);
            });
            
            // Display new releases
            newApps.forEach(app => {
                const appCard = createAppCard(app);
                newAppsContainer.appendChild(appCard);
            });
            
            // Add click event to all app cards
            document.querySelectorAll('.app-card').forEach(card => {
                card.addEventListener('click', () => {
                    const appId = card.getAttribute('data-app-id');
                    window.location.href = `download.html?id=${appId}`;
                });
            });
        } else {
            console.log("No data available");
        }
    }).catch((error) => {
        console.error(error);
    });
}

// Create app card HTML
function createAppCard(app) {
    const appCard = document.createElement('div');
    appCard.className = 'app-card';
    appCard.setAttribute('data-app-id', app.id);
    
    appCard.innerHTML = `
        <img src="${app.icon}" alt="${app.name}" class="app-image">
        <div class="app-info">
            <h3 class="app-title">${app.name}</h3>
            <p class="app-developer">${app.developer}</p>
            <div class="app-rating">
                <i class="fas fa-star"></i>
                <span>${app.rating}</span>
            </div>
        </div>
    `;
    
    return appCard;
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadApps();
});
