import { deleteById } from '../services/milvusService.js';

const testId = '23245.3234';

async function main() {
    try {
        const result = await deleteById(testId);
        console.log(`✅ Paper with ID "${testId}" deleted. Raw result:`);
        console.log(result);
    } catch (error) {
        console.error('❌ Error during deletion:', error.message);
    }
}

main();