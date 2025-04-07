// app.js
const express = require('express');
const { MilvusClient, DataType } = require('@zilliz/milvus2-sdk-node');

const app = express();
app.use(express.json());

// Milvus gRPC 地址（Milvus 服务默认监听 19530）
const MILVUS_ADDRESS = '127.0.0.1:19530';
const COLLECTION_NAME = 'papers';
const VECTOR_DIM = 768;

// Initialize Milvus client
const client = new MilvusClient({
    address: MILVUS_ADDRESS,
});

// Dummy function to compute an embedding vector for a given text.
// In production, replace this with a call to your embedding service/model.
function computeEmbedding(text) {
    const vector = [];
    for (let i = 0; i < VECTOR_DIM; i++) {
        vector.push(Math.random());
    }
    return vector;
}

// Ensure the collection exists; if not, create it.
async function ensureCollectionExists() {
    try {
        const hasColl = await client.hasCollection({ collection_name: COLLECTION_NAME });
        if (!hasColl.value) {
            console.log(`Collection "${COLLECTION_NAME}" not found. Creating...`);
            await client.createCollection({
                collection_name: COLLECTION_NAME,
                fields: [
                    {
                        name: 'paper_id',
                        description: 'Primary key',
                        data_type: DataType.Int64,
                        is_primary_key: true,
                        autoID: false,
                    },
                    {
                        name: 'title',
                        description: 'Paper title',
                        data_type: DataType.VarChar,
                        max_length: 512,
                    },
                    {
                        name: 'link',
                        description: 'Paper link',
                        data_type: DataType.VarChar,
                        max_length: 512,
                    },
                    {
                        name: 'abstract',
                        description: 'Paper abstract',
                        data_type: DataType.VarChar,
                        max_length: 2048,
                    },
                    {
                        name: 'vector',
                        description: 'Embedding vector',
                        data_type: DataType.FloatVector,
                        dim: VECTOR_DIM,
                    },
                ],
                shard_num: 2,
            });
            console.log(`Collection "${COLLECTION_NAME}" created successfully.`);
        } else {
            console.log(`Collection "${COLLECTION_NAME}" already exists.`);
        }
    } catch (err) {
        console.error('Error in ensureCollectionExists:', err);
        throw err;
    }
}

// POST /insert endpoint: Inserts a new paper document into Milvus.
// Expects JSON body with paper_id, title, link, abstract.
app.post('/insert', async (req, res) => {
    try {
        const { paper_id, title, link, abstract } = req.body;
        if (!paper_id || !title || !link || !abstract) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Compute embedding vector from title + abstract.
        const embedding = computeEmbedding(`${title} ${abstract}`);

        // Prepare record for insertion.
        // 将 paper_id 转换为 Number 避免 JSON.stringify 无法序列化 BigInt
        const records = [
            {
                paper_id: Number(paper_id),
                title,
                link,
                abstract,
                vector: embedding,
            },
        ];

        const insertResult = await client.insert({
            collection_name: COLLECTION_NAME,
            data: records,
        });

        res.json({
            message: 'Insert successful',
            insert_count: insertResult.insert_count,
            insert_ids: insertResult.insert_ids,
        });
    } catch (err) {
        console.error('Insert error:', err);
        res.status(500).json({ error: 'Insert failed', details: err.message });
    }
});

// GET /search endpoint: Searches for papers similar to the provided query.
// Expects query parameter "query". 返回前 5 条最相似的记录。
app.get('/search', async (req, res) => {
    try {
        const queryText = req.query.query;
        if (!queryText) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }
        // Compute embedding vector for the query.
        const queryVector = computeEmbedding(queryText);

        const searchResult = await client.search({
            collection_name: COLLECTION_NAME,
            data: [queryVector],
            anns_field: 'vector',
            param: {
                metric_type: 'L2',
                params: JSON.stringify({ nprobe: 10 }),
            },
            limit: 5,
            output_fields: ['paper_id', 'title', 'link', 'abstract'],
        });

        res.json({ message: 'Search successful', results: searchResult.results });
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Search failed', details: err.message });
    }
});

// Start HTTP server on port 10086 and initialize Milvus connection.
const PORT = process.env.PORT || 10086;
app.listen(PORT, async () => {
    try {
        await client.connect();
        console.log(`Connected to Milvus at ${MILVUS_ADDRESS}`);
        await ensureCollectionExists();
        console.log(`Server is running on port ${PORT}`);
    } catch (err) {
        console.error('Initialization error:', err);
    }
});
