const VECTOR_DIM = 768;

export function computeEmbedding(text) {
    const vector = [];
    for (let i = 0; i < VECTOR_DIM; i++) {
        vector.push(Math.random());
    }
    return vector;
}
// let embedder = null;
//
// // Initialize FastEmbed embedder (using the lightweight BGE-small model)
// export async function initEmbedder() {
//     if (!embedder) {
//         embedder = await embedding.BGE('BAAI/bge-small-en-v1.5');
//         console.log('[Embedding] FastEmbed model initialized.');
//     }
// }
//
// // Compute the embedding vector for a single text input
// export async function computeEmbedding(text) {
//     if (!embedder) {
//         throw new Error('Embedder not initialized. Call initEmbedder() first.');
//     }
//     const result = await embedder.embed([text]);
//     return result[0]; // Return the first vector (for a single text input)
// }