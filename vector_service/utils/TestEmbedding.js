const fastembed = await import('fastembed');
const { EmbeddingModel, FlagEmbedding } = fastembed;


import { logger } from './logger.js';

let embedder = null;
let isInitializing = false;

/**
 * Initialize the FastEmbed embedding model (singleton pattern).
 * Uses the BGE-small-en model optimized for query embedding.
 * This function should be called once before using the embedder.
 */
export async function initEmbedder() {
    if (embedder) return;

    if (isInitializing) {
        throw new Error('Embedding model is already initializing. Please wait.');
    }

    isInitializing = true;
    try {
        // Initialize the embedder with the specified model
        embedder = await FlagEmbedding.init({
            model: EmbeddingModel.BGESmallEN, // Lightweight English model
            // Optional config: cacheDir, threads, etc.
        });
        logger.info('[Embedding] Model initialized successfully');
    } catch (error) {
        logger.error('[Embedding] Failed to initialize model:', error);
        throw new Error(`Failed to initialize embedding model: ${error.message}`);
    } finally {
        isInitializing = false;
    }
}

/**
 * Compute the embedding vector for a single text input.
 * Automatically adds "query:" prefix for better semantic search results.
 *
 * @param {string} text - Input text to be embedded.
 * @returns {Promise<number[]>} - A 384-dimension embedding vector.
 */
export async function computeEmbedding(text) {
    if (!embedder) {
        throw new Error('Embedder not initialized. Please call initEmbedder() first.');
    }

    try {
        const vector = await embedder.queryEmbed(text);

        // Normalize output: convert Float32Array to number[]
        const normalized = vector instanceof Float32Array ? Array.from(vector) : vector;
        logger.debug(`[Embedding] Computed embedding for text length ${text.length}`);
        return normalized;
    } catch (error) {
        logger.error('[Embedding] Failed to compute embedding:', error);
        throw new Error(`Embedding failed: ${error.message}`);
    }
}
