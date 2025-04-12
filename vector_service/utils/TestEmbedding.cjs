const { EmbeddingModel, FlagEmbedding } = require("fastembed")
const fs = require('fs/promises');
const path = require('path');

let embedder = null;

// Initialize FlagEmbedding embedder
async function initEmbedder() {
    if (!embedder) {
        // Create cache directory if it doesn't exist
        const cacheDir = path.resolve('local_cache');
        const modelDir = path.join(cacheDir, 'BAAI');

        try {
            await fs.mkdir(cacheDir, { recursive: true });
            await fs.mkdir(modelDir, { recursive: true });

            embedder = await FlagEmbedding.init({
                model: EmbeddingModel.BGEBaseEN,
                cacheDir: cacheDir,
            });
            console.log('[Embedding] Model initialized successfully.');
        } catch (error) {
            console.error('[Embedding] Error initializing model:', error);
            throw error;
        }
    }
    return embedder;
}

/**
 * Compute the embedding vector for a single text input.
 * Automatically adds "query:" prefix for better semantic search results.
 *
 * @param {string} text - Input text to be embedded.
 * @returns {Promise<number[]>} - A 384-dimension embedding vector.
 */
async function computeEmbedding(text) {
    if (!embedder) {
        throw new Error('Embedder not initialized. Please call initEmbedder() first.');
    }

    try {
        const vector = await embedder.queryEmbed(text);

        // Normalize output: convert Float32Array to number[]
        const normalized = vector instanceof Float32Array ? Array.from(vector) : vector;
        // Vector Dimension: 768
        console.log(`[Embedding] Embedding Array Length${normalized.length}`);
        return normalized;
    } catch (error) {
        console.log('[Embedding] Failed to compute embedding:', error);
        throw new Error(`Embedding failed: ${error.message}`);
    }
}

module.exports = {
    initEmbedder,
    computeEmbedding
}
