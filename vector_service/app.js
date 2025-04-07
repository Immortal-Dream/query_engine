// Import required modules
const express = require('express');
const axios = require('axios');

// Create an instance of Express application
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Base URL for Milvus REST API (adjust if needed)
const MILVUS_BASE_URL = 'http://localhost:9091';

// Dummy function to compute an embedding vector for a given text
// In production, replace this with a call to an actual embedding service/model
function computeEmbedding(text) {
    const dimension = 768; // example dimension, adjust as necessary
    const vector = [];
    for (let i = 0; i < dimension; i++) {
        // Generate random numbers as dummy vector values
        vector.push(Math.random());
    }
    return vector;
}

/**
 * POST /insert endpoint
 * This endpoint receives paper data and inserts it into Milvus.
 * Expected JSON body fields: paper_id, link, title, abstract.
 */
app.post('/insert', async (req, res) => {
    try {
        const { paper_id, link, title, abstract } = req.body;

        // Validate input fields
        if (!paper_id || !link || !title || !abstract) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Compute the vector embedding based on title and abstract
        // (You can adjust the input to your embedding model as needed)
        const textForEmbedding = `${title} ${abstract}`;
        const embedding = computeEmbedding(textForEmbedding);

        // Prepare the payload for Milvus insertion
        // The fields object maps each field name to an array of values.
        const payload = {
            fields: {
                paper_id: [paper_id],
                title: [title],
                link: [link],
                abstract: [abstract],
                vector: [embedding]
            }
        };

        // Define the collection name
        const collectionName = 'papers';
        // Construct the Milvus REST API endpoint URL for inserting entities
        // (Assuming the endpoint follows the pattern below)
        const insertUrl = `${MILVUS_BASE_URL}/v1/collections/${collectionName}/entities`;

        // Send a POST request to Milvus to insert the document
        const response = await axios.post(insertUrl, payload);

        // Return success response
        return res.json({ message: 'Insert successful', data: response.data });
    } catch (error) {
        console.error('Insert error:', error.message);
        return res.status(500).json({ error: 'Insert failed', details: error.message });
    }
});

/**
 * GET /search endpoint
 * This endpoint receives a query string, computes its embedding,
 * and searches Milvus for the top 5 nearest documents.
 * It then returns the title, link, and abstract of the matched papers.
 */
app.get('/search', async (req, res) => {
    try {
        const queryText = req.query.query;

        // Validate that the query parameter is provided
        if (!queryText) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        // Compute the embedding for the query text
        const queryEmbedding = computeEmbedding(queryText);

        // Prepare the search payload for Milvus
        // Adjust the payload format as required by your Milvus REST API version
        const payload = {
            search_params: {
                data: [queryEmbedding],
                anns_field: 'vector',
                limit: 5,
                params: { nprobe: 10 }
            },
            output_fields: ['title', 'link', 'abstract']  // Fields to return in the result
        };

        // Define the collection name and construct the search endpoint URL
        const collectionName = 'papers';
        const searchUrl = `${MILVUS_BASE_URL}/v1/collections/${collectionName}/search`;

        // Send a POST request to Milvus to perform the search
        const response = await axios.post(searchUrl, payload);

        // Extract and return the search results
        // (The structure of response.data depends on your Milvus API version)
        return res.json({ message: 'Search successful', results: response.data.data });
    } catch (error) {
        console.error('Search error:', error.message);
        return res.status(500).json({ error: 'Search failed', details: error.message });
    }
});

// Start the server on the specified port (default 10086  )
const PORT = process.env.PORT || 10086 ;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


// Function to check if the collection exists, and create it if not
async function ensureCollectionExists(collectionName) {
    try {
        // Check existing collections
        const res = await axios.get(`${MILVUS_BASE_URL}/v1/collections`);
        const collections = res.data?.data || [];

        const exists = collections.some(col => col.name === collectionName);
        if (exists) {
            return; // Already exists, no need to create
        }

        console.log(`Collection '${collectionName}' not found. Creating...`);

        // Define the collection schema
        const createPayload = {
            collection_name: collectionName,
            fields: [
                {
                    name: "paper_id",
                    description: "Primary key",
                    data_type: "Int64",
                    is_primary_key: true,
                    auto_id: false
                },
                {
                    name: "title",
                    description: "Paper title",
                    data_type: "VarChar",
                    max_length: 512
                },
                {
                    name: "link",
                    description: "Paper link",
                    data_type: "VarChar",
                    max_length: 512
                },
                {
                    name: "abstract",
                    description: "Paper abstract",
                    data_type: "VarChar",
                    max_length: 2048
                },
                {
                    name: "vector",
                    description: "Embedding vector",
                    data_type: "FloatVector",
                    type_params: {
                        dim: 768
                    }
                }
            ]
        };

        // Create the collection
        await axios.post(`${MILVUS_BASE_URL}/v1/collections`, createPayload);
        console.log(`Collection '${collectionName}' created successfully.`);
    } catch (err) {
        console.error('Failed to ensure collection:', err.message);
        throw err;
    }
}
