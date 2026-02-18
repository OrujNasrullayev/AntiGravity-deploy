/**
 * DataLoader - Manages fetching and storing Notion data dynamically
 */
const DataLoader = {
    data: null,
    loading: false,
    promise: null,

    /**
     * Fetch data from the Netlify Function
     */
    fetchData: async function (force = false) {
        if (this.data && !force) return this.data;
        if (this.loading) return this.promise;

        this.loading = true;
        this.promise = (async () => {
            try {
                console.log('📡 Fetching dynamic data...');
                const response = await fetch('/.netlify/functions/get-notion-data');
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch data');
                }

                const payload = await response.json();
                this.data = payload;

                // Polyfill global variables for compatibility with existing scripts
                window.NOTION_STUDENTS = payload.students;
                window.NOTION_GROUPS = payload.groups;
                window.NOTION_LESSONS = payload.lessons;
                window.NOTION_TEACHERS = payload.teachers;
                window.NOTION_SUBMISSIONS = payload.submissions;
                window.NOTION_FEEDBACKS = payload.feedbacks;
                window.NOTION_ASSIGNMENTS = payload.assignments;

                console.log('✅ Data loaded successfully:', payload.updatedAt);

                // Dispatch a custom event to notify listeners that data is ready
                document.dispatchEvent(new CustomEvent('portalDataReady', { detail: payload }));

                return payload;
            } catch (error) {
                console.error('❌ DataLoader Error:', error);
                alert('Connection Error: Unable to load data from Notion. Please ensure you are connected to the internet.');
                throw error;
            } finally {
                this.loading = false;
            }
        })();

        return this.promise;
    },

    /**
     * Get data immediately if available, otherwise return null
     */
    getData: function () {
        return this.data;
    },

    /**
     * Helper to wait for data specifically
     */
    waitForData: async function () {
        if (this.data) return this.data;
        return this.fetchData();
    }
};

// Start fetching immediately if we're on a dashboard page
if (window.location.pathname !== '/' && !window.location.pathname.includes('login')) {
    DataLoader.fetchData();
}
