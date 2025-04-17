const { EmbeddingModel, FlagEmbedding } = require("fastembed");
const fs = require('fs/promises');
const path = require('path');

let embedder = null;
/**
 * Returns current timestamp in 'YYYY-MM-DD HH:MM:SS' format (EST/EDT).
 * Fast and lightweight version using Intl.DateTimeFormat.
 */
function getEstTimestamp() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    // Format result like: "2024-04-10 15:42:30"
    return formatter.format(now).replace('T', ' ');
}

/**
 * Custom log function that prepends an EST timestamp.
 * @param {...any} args - Arguments to pass to console.log.
 */
function log(...args) {
    const timestamp = getEstTimestamp();
    console.log(`[${timestamp} EST]`, ...args);
}

/**
 * Custom error function that prepends an EST timestamp.
 * @param {...any} args - Arguments to pass to console.error.
 */
function error(...args) {
    const timestamp = getEstTimestamp();
    console.error(`[${timestamp} EST]`, ...args);
}

// Initialize FlagEmbedding embedder
async function initEmbedder() {
    if (!embedder) {
        // Create cache directory if it doesn't exist
        const cacheDir = path.resolve('local_cache');
        // BGE models are usually under BAAI subdirectory in cache
        const modelDir = path.join(cacheDir, 'BAAI', 'bge-base-en'); // More specific path often needed

        try {
            // Ensure full path exists
            await fs.mkdir(modelDir, { recursive: true });
            log(`[Embedding] Ensured cache directory exists: ${modelDir}`); // Log directory creation

            embedder = await FlagEmbedding.init({
                model: EmbeddingModel.BGEBaseEN,
                cacheDir: cacheDir, // fastembed manages subdirs based on model name usually
            });
            log('[Embedding] Model initialized successfully.'); // Use custom log
        } catch (err) { // Changed variable name for clarity
            error('[Embedding] Error initializing model:', err); // Use custom error
            throw err; // Re-throw original error
        }
    }
    return embedder;
}

/**
 * Compute the embedding vector for a single text input.
 * Automatically adds "query:" prefix for better semantic search results.
 *
 * @param {string} text - Input text to be embedded.
 * @returns {Promise<number[]>} - A 768-dimension embedding vector (for BGEBaseEN).
 */
async function computeEmbedding(text) {
    if (!embedder) {
        // Throwing an error here is better than logging and proceeding
        throw new Error('Embedder not initialized. Please call initEmbedder() first.');
    }

    try {
        const vector = await embedder.queryEmbed(text);

        // Normalize output: convert Float32Array to number[] if necessary
        const normalized = Array.from(vector); // Directly use Array.from for conversion

        // Vector Dimension for BGEBaseEN is 768, not 384
        if (normalized.length !== 768) {
            // Log a warning if the dimension is unexpected
            log(`[Embedding] Warning: Expected embedding dimension 768, but got ${normalized.length}`);
        }
        log(`[Embedding] Computed embedding. Array Length: ${normalized.length}`); // Use custom log
        return normalized;
    } catch (err) { // Changed variable name for clarity
        error('[Embedding] Failed to compute embedding:', err); // Use custom error
        // Provide a more informative error message
        throw new Error(`Embedding computation failed: ${err.message}`);
    }
}

module.exports = {
    initEmbedder,
    computeEmbedding
}