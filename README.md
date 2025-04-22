# SciSearch: A Distributed Search Engine for arXiv Research Paper Retrieval

This project implements a two-service microservice architecture for semantic paper retrieval using vector search powered by **Milvus 2.4**. It consists of:

- A **Load Balancer / Gateway** for request routing, embedding generation, and hybrid search fan-out.
- A **Vector Service** providing RESTful APIs for inserting, searching, and managing paper data with dual-vector embeddings (title+abstract and fulltext).

---

## Repository Structure

```
.
├── load_balancer/
│   ├── config/servers.config.yaml  # Backend node list (address, weight)
│   ├── hashRing.js                 # Consistent hashing logic
│   ├── idUtils.js                  # Utility functions
│   ├── index.js                    # Load balancer server entrypoint
│   └── package.json                # Dependencies
├── vector_service/
│   ├── app.js                      # Express server startup (port-based)
│   ├── controllers/
│   │   └── milvusController.js     # Embedding generation + Milvus operations
│   ├── routes/
│   │   └── paperRouter.js          # Routes binding REST endpoints to controllers
│   ├── services/
│   │   └── milvusService.js        # Milvus SDK operations (insert, search, hybrid search)
│   ├── utils/
│   │   ├── Embedding.cjs           # Embedding generation using fastembed (BAAI/bge-base-en)
│   │   └── logger.js               # Timestamped logging utility
│   ├── tests/                      # Testing files (CountTest.js, DeleteTest.js)
│   ├── setup.sh                    # Optional startup helper script
│   └── package.json                # Dependencies
└── README.md                       # Project documentation
```

---

## 1. Load Balancer (`load_balancer/`)

### Purpose
- Routes incoming client requests based on **consistent hashing**.
- Embedding generation is handled by **one selected node**.
- Performs **fan-out hybrid search** across **all backend nodes**.
- Aggregates and ranks the results (returns the global top 5 by score).

### How It Works
1. **HashRing Initialization**  
   Reads `servers.config.yaml` to build the consistent hash ring.
2. **`/metaSearch?query=`**
    - Uses hash to select one node → calls `/getEmbedding`.
    - Sends the generated embeddings to `/hybridSearch` on **all nodes**.
    - Collects all responses, globally sorts by ascending `score`, returns the best 5.
3. **Other Requests**  
   Transparent proxy based on hash selection.

### Start Load Balancer
```bash
cd load_balancer
npm install
node index.js    # Runs on port 8080
```

## 2️. Vector Service (`vector_service/`)

### Purpose
Handles the following functionalities:
- Insert papers with single or dual embeddings.
- Search papers via title+abstract, fulltext, or hybrid embeddings.
- Compute embeddings via fastembed (BAAI/bge-base-en).
- Interact with Milvus 2.4 backend.

### Major Components

| File | Purpose |
|------|---------|
| utils/Embedding.cjs | Initializes the embedding model (fastembed), computes 768-dimensional embeddings for queries or papers. |
| services/milvusService.js | Handles Milvus operations: collection creation, insert, batch insert, search, hybrid search, deletion. |
| controllers/milvusController.js | API handlers that validate input, call embeddings, interact with Milvus service. |
| routes/paperRouter.js | Maps API endpoints to controller methods. |

### Embedding Computation
- Embedding Model: BAAI/bge-base-en (768-dimensional)
- Embedding Computation Utility: Located at utils/Embedding.cjs
- Supports automatic local caching for model weights (local_cache/).

### Vector Service APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| /insert | POST | Insert a single paper (title+abstract only). |
| /insertFulltext | POST | Insert a paper with fulltext and dual embeddings. |
| /batchInsert | POST | Batch insert papers (title+abstract only). |
| /fulltextBatch | POST | Batch insert papers with fulltext. |
| /search | GET | Search by title+abstract vector. |
| /searchFulltext | GET | Search by fulltext vector. |
| /hybridSearch | POST | Hybrid search with two precomputed embeddings. |
| /vectorSearch | POST | Search with a provided embedding vector. |
| /getEmbedding | GET | Compute embeddings for a query string. |

Example call for hybrid search:
```bash
POST /hybridSearch
{
  "titleAbstractEmbedding": [...],
  "fulltextEmbedding": [...]
}
```

### Load Balancer API (`/metaSearch`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| /metaSearch?query= | GET | Uses one node to compute embedding, fan-out hybrid search to all nodes, and returns the top 5 global results. |

## How to Run Locally (Single Node Example)

1. Start Milvus Standalone
```bash
docker compose -f deployments/milvus-standalone-cn.yml up -d
```

2. Start Vector Service Node
```bash
cd vector_service
npm install
node app.js 10087   # Runs on port 10087
```

3. Start Load Balancer (Optional)
```bash
cd load_balancer
npm install
node index.js      # Runs on port 8080
```

## Configurable Parameters

Backend nodes are defined in:
```
load_balancer/config/servers.config.yaml
```

Embedding cache location:
```bash
vector_service/local_cache/
```