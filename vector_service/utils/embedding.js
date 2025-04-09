import { FlagEmbedding } from 'fastembed';
import fs from 'fs/promises';
import path from 'path';

let embedder = null;

// Initialize FlagEmbedding embedder
export async function initEmbedder() {
    if (!embedder) {
        // Create cache directory if it doesn't exist
        const cacheDir = path.resolve('local_cache');
        const modelDir = path.join(cacheDir, 'BAAI');

        try {
            await fs.mkdir(cacheDir, { recursive: true });
            await fs.mkdir(modelDir, { recursive: true });

            embedder = await FlagEmbedding.init({
                model: 'BAAI/bge-small-en-v1.5',
                cacheDir: cacheDir,
                backend: 'node' // Use Node.js implementation instead of Milvus
            });
            console.log('[Embedding] Model initialized successfully.');
        } catch (error) {
            console.error('[Embedding] Error initializing model:', error);
            throw error;
        }
    }
    return embedder;
}

// Compute the embedding vector for a single text input
export async function computeEmbedding(text) {
    if (!embedder) {
        throw new Error('Embedder not initialized. Call initEmbedder() first.');
    }
    const embeddings = await embedder.embed([text]);
    return embeddings[0]; // Return the first vector
}
