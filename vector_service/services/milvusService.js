import {MilvusClient, DataType} from '@zilliz/milvus2-sdk-node';

const COLLECTION_NAME = 'paper_dual_embeddings';
// Vector dimensions
const VECTOR_DIM = 768;
const client = new MilvusClient({address: '127.0.0.1:19530'});

export async function init() {
    await client.connect();
    const has = await client.hasCollection({collection_name: COLLECTION_NAME});
    if (!has.value) {
        // Create collection with two vector fields
        await client.createCollection({
            collection_name: COLLECTION_NAME,
            fields: [
                {name: 'paper_id', data_type: DataType.VarChar, is_primary_key: true, max_length: 20},
                {name: 'title', data_type: DataType.VarChar, max_length: 512},
                {name: 'link', data_type: DataType.VarChar, max_length: 512},
                {name: 'abstract', data_type: DataType.VarChar, max_length: 2048},
                {name: 'fulltext', data_type: DataType.VarChar, max_length: 10000}, // Added fulltext field
                {name: 'title_abstract_vector', data_type: DataType.FloatVector, dim: VECTOR_DIM}, // For title+abstract
                {name: 'fulltext_vector', data_type: DataType.FloatVector, dim: VECTOR_DIM}, // For fulltext
            ],
        });

        // Create index for title+abstract vector field
        await client.createIndex({
            collection_name: COLLECTION_NAME,
            field_name: 'title_abstract_vector',
            index_type: 'IVF_FLAT',
            metric_type: 'L2',
            params: {nlist: 128},
        });

        // Create index for fulltext vector field
        await client.createIndex({
            collection_name: COLLECTION_NAME,
            field_name: 'fulltext_vector',
            index_type: 'IVF_FLAT',
            metric_type: 'L2',
            params: {nlist: 128},
        });
    }
    await client.loadCollection({collection_name: COLLECTION_NAME});
}

init();

// Regular insert with only title+abstract vector
export async function insert(paper_id, title, link, abstract, vector) {
    return await client.insert({
        collection_name: COLLECTION_NAME,
        data: [
            {
                paper_id,
                title,
                link,
                abstract,
                title_abstract_vector: vector,
                fulltext: "", // Empty fulltext
                fulltext_vector: new Array(VECTOR_DIM).fill(0) // Zero vector as placeholder
            },
        ],
    });
}

// Insert paper with both title+abstract and fulltext vectors
export async function fulltextInsert(paper_id, title, link, abstract, fulltext, title_abstract_vector, fulltext_vector) {
    return await client.insert({
        collection_name: COLLECTION_NAME,
        data: [
            {
                paper_id,
                title,
                link,
                abstract,
                fulltext,
                title_abstract_vector,
                fulltext_vector
            },
        ],
    });
}

// Search by title+abstract vector
export async function searchByTitleAbstract(queryVector) {
    const result = await client.search({
        collection_name: COLLECTION_NAME,
        data: [queryVector],
        anns_field: 'title_abstract_vector',
        param: {metric_type: 'L2', params: JSON.stringify({nprobe: 10})},
        limit: 5,
        output_fields: ['paper_id', 'title', 'link', 'abstract'],
    });
    return result.results;
}

// Search by fulltext vector
export async function searchByFulltext(queryVector) {
    const result = await client.search({
        collection_name: COLLECTION_NAME,
        data: [queryVector],
        anns_field: 'fulltext_vector',
        param: {metric_type: 'L2', params: JSON.stringify({nprobe: 10})},
        limit: 5,
        output_fields: ['paper_id', 'title', 'link', 'abstract'],
    });
    return result.results;
}

// Hybrid search using both vectors
export async function hybridSearch(titleAbstractVector, fulltextVector) {
    // Create requests for both vector fields
    const titleAbstractRequest = {
        data: [titleAbstractVector],
        anns_field: 'title_abstract_vector',
        param: {
            metric_type: 'L2',
            params: JSON.stringify({nprobe: 10})
        },
        limit: 5
    };

    const fulltextRequest = {
        data: [fulltextVector],
        anns_field: 'fulltext_vector',
        param: {
            metric_type: 'L2',
            params: JSON.stringify({nprobe: 10})
        },
        limit: 5
    };

    const result = await client.hybridSearch({
        collection_name: COLLECTION_NAME,
        reqs: [titleAbstractRequest, fulltextRequest],
        ranker: {
            type: 'WeightedRanker',
            params: {weights: [0.6, 0.4]} // 60% weight to title+abstract, 40% to fulltext
        },
        limit: 5,
        output_fields: ['paper_id', 'title', 'link', 'abstract']
    });

    return result.results;
}

// Batch insert with only title+abstract vectors
export async function batchInsert(papers) {
    if (!Array.isArray(papers) || papers.length === 0) {
        throw new Error('Input must be a non-empty array of papers');
    }

    // Transform data to use title_abstract_vector
    const transformedPapers = papers.map(paper => ({
        paper_id: paper.paper_id,
        title: paper.title,
        link: paper.link,
        abstract: paper.abstract,
        title_abstract_vector: paper.vector,
        fulltext: "",
        fulltext_vector: new Array(VECTOR_DIM).fill(0) // Zero vector as placeholder
    }));

    return await client.insert({
        collection_name: COLLECTION_NAME,
        data: transformedPapers
    });
}

// Batch insert with both title+abstract and fulltext vectors
export async function batchFulltextInsert(papers) {
    if (!Array.isArray(papers) || papers.length === 0) {
        throw new Error('Input must be a non-empty array of papers');
    }

    return await client.insert({
        collection_name: COLLECTION_NAME,
        data: papers
    });
}

export async function getRowCount(collectionName = COLLECTION_NAME) {
    const stats = await client.getCollectionStatistics({ collection_name: collectionName });

    if (stats.status.error_code === 'Success') {
        const rowCountStr = stats.data.row_count || '0';
        return parseInt(rowCountStr, 10);
    } else {
        throw new Error(`Failed to get collection statistics: ${stats.status.reason}`);
    }
}

export async function deleteById(paper_id) {
    if (!paper_id) {
        throw new Error('paper_id is required for deletion');
    }

    const filterExpr = `paper_id in ["${paper_id}"]`;
    console.log(`🧪 Delete filter: ${filterExpr}`);

    try {
        await client.loadCollection({ collection_name: COLLECTION_NAME }); // Ensure loaded
        const result = await client.delete({
            collection_name: COLLECTION_NAME,
            filter: filterExpr
        });

        console.log(`Deleted count: ${result.delete_cnt}`);
        return result;
    } catch (error) {
        throw new Error(`Failed to delete paper with ID ${paper_id}: ${error.message}`);
    }
}