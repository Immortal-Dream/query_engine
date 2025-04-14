// query_actor/config/config.js
export const config = {
    services: {
        vectorSearch: {
            baseUrl: 'http://39.101.70.173:10086',
            endpoints: {
                search: '/vectorSearch'
            }
        }
    }
};

export default config;
