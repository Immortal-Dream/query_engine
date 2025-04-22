// File: test.js
import { getRowCount } from '../services/milvusService.js';

async function main() {
    const collection = 'essay_768_v2';
    try {
        const count = await getRowCount(collection);
        console.log(`✅ Collection "${collection}" has ${count} rows.`);
    } catch (error) {
        console.error(`❌ Failed to fetch row count:`, error.message);
    }
}

main();
