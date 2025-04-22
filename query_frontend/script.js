document.getElementById('search-form').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission

    const query = document.getElementById('query-input').value.trim();
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = '<p>Searching...</p>'; // Show loading message

    if (!query) {
        resultsContainer.innerHTML = '<p>Please enter a search query.</p>';
        return;
    }

    try {
        // Use the provided endpoint URL
        const response = await fetch(`http://localhost:8080/search?query=${encodeURIComponent(query)}`);

        if (!response.ok) {
            // Handle HTTP errors like 404 or 500
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Clear previous results or loading message
        resultsContainer.innerHTML = '';

        if (data.results && data.results.length > 0) {
            data.results.forEach((item) => {
                const resultEl = document.createElement('div');
                resultEl.classList.add('result-item'); // Use the class for styling

                // Truncate abstract/snippet to a reasonable length
                const truncatedAbstract = item.abstract
                    ? (item.abstract.length > 250 // Slightly longer snippet
                        ? item.abstract.substring(0, 250) + '...'
                        : item.abstract)
                    : 'No abstract available.'; // Fallback text

                // Prepare display URL and domain
                let displayUrl = item.link || '#'; // Default to link or '#'
                let domain = 'source.com'; // Default domain
                let faviconUrl = 'placeholder-favicon.png'; // Default icon

                try {
                    if (item.link && item.link.startsWith('http')) {
                        const urlObject = new URL(item.link);
                        domain = urlObject.hostname;
                        // Construct a cleaner display URL (domain + path)
                        displayUrl = urlObject.hostname + (urlObject.pathname === '/' ? '' : urlObject.pathname);
                        // Limit display URL length
                        if (displayUrl.length > 60) {
                            displayUrl = displayUrl.substring(0, 57) + '...';
                        }
                        // Use Google's favicon service (size 16 is common for results)
                        faviconUrl = `https://www.google.com/s2/favicons?sz=16&domain_url=${domain}`;
                    } else {
                        // Handle cases where the link might be missing or invalid
                        displayUrl = "Invalid or missing link";
                    }
                } catch (e) {
                    console.warn("Could not parse URL:", item.link);
                    // Keep defaults if URL parsing fails
                    displayUrl = item.link || "Invalid link"; // Show original link if parsing fails
                }

                // Construct the HTML for the result item using Google's structure
                resultEl.innerHTML = `
                    <div class="result-header">
                        <div class="result-icon">
                            <img src="${faviconUrl}" alt="" width="16" height="16" style="object-fit: contain;"> ${/* Use empty alt for decorative icons */''}
                        </div>
                        <div class="result-source">
                            <div class="result-breadcrumb">${domain}</div>
                            <div class="result-link"><a href="${item.link || '#'}" target="_blank">${displayUrl}</a></div>
                        </div>
                    </div>
                    <div class="result-title">
                        <a href="${item.link || '#'}" target="_blank">${item.title || 'Untitled Result'}</a>
                    </div>
                    <div class="result-snippet">${truncatedAbstract}</div>
                `;

                resultsContainer.appendChild(resultEl);
            });
        } else {
            // Handle case where search returns no results
            resultsContainer.innerHTML = '<p>No results found.</p>';
        }

    } catch (error) {
        // Handle fetch errors or JSON parsing errors
        console.error('Search failed:', error);
        resultsContainer.innerHTML = `<p>Error occurred while searching. Please try again later. (${error.message})</p>`;
    }
});