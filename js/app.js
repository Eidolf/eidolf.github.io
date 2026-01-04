document.addEventListener('DOMContentLoaded', async () => {
    const projectsGrid = document.getElementById('projects-grid');

    try {
        const response = await fetch('projects.json');
        if (!response.ok) throw new Error('Failed to load project list');

        const projectUrls = await response.json();

        // Clear loading state
        projectsGrid.innerHTML = '';

        if (projectUrls.length === 0) {
            projectsGrid.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">Keine Projekte gefunden.</p>';
            return;
        }

        // Fetch metadata for all projects in parallel
        const projectPromises = projectUrls.map(url => fetchProjectMetadata(url));
        const projects = await Promise.all(projectPromises);

        projects.forEach(project => {
            if (project) {
                const card = createProjectCard(project);
                projectsGrid.appendChild(card);
            }
        });

    } catch (error) {
        console.error('Error:', error);
        projectsGrid.innerHTML = `
            <div class="glass-panel text-center" style="grid-column: 1/-1; border-color: #ff5f5f;">
                <h3>Hoppla!</h3>
                <p>Konnte Projekte nicht laden. (${error.message})</p>
            </div>
        `;
    }
});

async function fetchProjectMetadata(url) {
    try {
        // Since we are on the same domain (github.io), we can try to fetch the HTML
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Helper to get meta content
        const getMeta = (name) => {
            const tag = doc.querySelector(`meta[property="${name}"]`) ||
                doc.querySelector(`meta[name="${name}"]`);
            return tag ? tag.getAttribute('content') : null;
        };

        // Extract data
        const title = getMeta('og:title') || doc.title || 'Unbenanntes Projekt';
        const description = getMeta('og:description') ||
            getMeta('description') ||
            'Keine Beschreibung verfügbar.';

        // Try to find an image
        let image = getMeta('og:image') || getMeta('twitter:image');

        // If relative URL, make it absolute
        if (image && !image.startsWith('http')) {
            const urlObj = new URL(url);
            image = new URL(image, urlObj.origin + urlObj.pathname).href;
        }

        // Fallback or specific fix for common issues
        if (!image) {
            // Look for first img tag as fallback? Or just use a default placeholder
            // Let's use a nice gradient placeholder if no image found
            image = null;
        }

        return {
            url,
            title,
            description,
            image
        };

    } catch (error) {
        console.warn(`Could not fetch details for ${url}:`, error);
        // Return a basic object so the link still works
        return {
            url,
            title: url,
            description: 'Details konnten nicht geladen werden.',
            image: null
        };
    }
}

function createProjectCard(project) {
    const card = document.createElement('a');
    card.href = project.url;
    card.className = 'glass-card fade-in';
    card.target = '_blank';
    card.rel = 'noopener noreferrer';

    // Image handling
    let imageHtml = '';
    if (project.image) {
        imageHtml = `<img src="${project.image}" alt="${project.title}" class="card-image" onerror="this.onerror=null; this.parentElement.style.display='none';">`;
    } else {
        // Generate a deterministic gradient based on the title
        const hash = project.title.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
        const hue = Math.abs(hash % 360);
        const gradient = `linear-gradient(135deg, hsl(${hue}, 70%, 20%), hsl(${(hue + 40) % 360}, 70%, 10%))`;

        imageHtml = `<div style="width:100%; height:100%; background: ${gradient}; display:flex; align-items:center; justify-content:center;">
                        <span style="font-size: 3rem; opacity: 0.3;">🚀</span>
                     </div>`;
    }

    card.innerHTML = `
        <div class="card-image-container">
            ${imageHtml}
        </div>
        <div class="card-content">
            <h3 class="card-title">${project.title}</h3>
            <p class="card-description">${project.description}</p>
            <span class="card-link-text">Ansehen</span>
        </div>
    `;

    return card;
}
