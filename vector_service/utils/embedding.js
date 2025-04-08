const VECTOR_DIM = 768;

exports.computeEmbedding = (text) => {
    const vector = [];
    for (let i = 0; i < VECTOR_DIM; i++) {
        vector.push(Math.random());
    }
    return vector;
};
