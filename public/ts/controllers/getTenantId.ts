export default (params: URLSearchParams) => {
    return {
        tenant_id: params.get('tenant_id')
    };
};
