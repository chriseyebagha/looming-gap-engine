const google = require('googlethis');

(async () => {
    const query = "ETL detailed tutorial implementation guide -pricing -sales";
    console.log("Querying:", query);
    try {
        const response = await google.search(query, { page: 0, safe: true });
        console.log("Response keys:", Object.keys(response));
        console.log("Results count:", response.results?.length);
        if (response.results?.length > 0) {
            console.log("First result:", response.results[0]);
        } else {
            console.log("Full response:", JSON.stringify(response, null, 2));
        }
    } catch (e) {
        console.error("Error:", e);
    }
})();
