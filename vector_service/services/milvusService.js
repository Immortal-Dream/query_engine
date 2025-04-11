import {MilvusClient, DataType} from '@zilliz/milvus2-sdk-node';

const COLLECTION_NAME = 'essay_768';
// Vector dimension
const VECTOR_DIM = 768;
const client = new MilvusClient({address: '127.0.0.1:19530'});

export async function init() {
    await client.connect();
    const has = await client.hasCollection({collection_name: COLLECTION_NAME});
    if (!has.value) {
        await client.createCollection({
            collection_name: COLLECTION_NAME,
            fields: [
                {name: 'paper_id', data_type: DataType.Int64, is_primary_key: true, autoID: false},
                {name: 'title', data_type: DataType.VarChar, max_length: 512},
                {name: 'link', data_type: DataType.VarChar, max_length: 512},
                {name: 'abstract', data_type: DataType.VarChar, max_length: 2048},
                {name: 'vector', data_type: DataType.FloatVector, dim: VECTOR_DIM},
            ],
        });
        await client.createIndex({
            collection_name: COLLECTION_NAME,
            field_name: 'vector',
            index_type: 'IVF_FLAT',
            metric_type: 'L2',
            params: {nlist: 128},
        });
    }
    await client.loadCollection({collection_name: COLLECTION_NAME});
}

init();

export async function insert(paper_id, title, link, abstract, vector) {
    return await client.insert({
        collection_name: COLLECTION_NAME,
        data: [
            {paper_id: Number(paper_id), title, link, abstract, vector},
        ],
    });
}

export async function search(queryVector) {
    const result = await client.search({
        collection_name: COLLECTION_NAME,
        data: [queryVector],
        anns_field: 'vector',
        param: {metric_type: 'L2', params: JSON.stringify({nprobe: 10})},
        limit: 5,
        output_fields: ['paper_id', 'title', 'link', 'abstract'],
    });
    return result.results;
}

/**
 * Batch insert multiple paper documents into Milvus.
 * Each paper is expected to contain paper_id, title, link, abstract, and precomputed vector.
 *
 * @param {Array<Object>} papers - Array of papers with { paper_id, title, link, abstract, vector }
 * @returns {Promise<Object>} - Milvus insert response
 */
export async function batchInsert(papers) {
    if (!Array.isArray(papers) || papers.length === 0) {
        throw new Error('Input must be a non-empty array of papers');
    }
    return await client.insert({
        collection_name: COLLECTION_NAME,
        data: papers
    });
}


