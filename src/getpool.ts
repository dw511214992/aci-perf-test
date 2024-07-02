import axios from 'axios';
import * as fs from "fs";

interface InstanceCount {
    state: string;
    count: number;
}

interface InstanceCountSummary {
    instanceCountsByState: InstanceCount[];
}

interface ApiResponse {
    id: string;
    name: string;
    type: string;
    properties: {
        instanceCountSummary: InstanceCountSummary[];
        provisioningState: string;
    };
}

let lastRunningCount: number | null = null;
const TOKEN = '';
const logFilePath = 'running_count_log.txt'; // Specify the path to your log file

async function fetchAndRecord() {
    try {
        const response = await axios.get<ApiResponse>('https://management.azure.com/subscriptions/7cc3e30a-740e-4682-9103-1f2c11f3f76d/resourceGroups/weidong-aci/providers/Microsoft.StandbyPool/standbyContainerGroupPools/weidong-standby-ai/runtimeViews/latest?api-version=2024-03-01-preview',
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`
                }});
        const instanceCounts = response.data.properties.instanceCountSummary[0].instanceCountsByState;
        const runningInstance = instanceCounts.find(instance => instance.state === 'Running');

        if (runningInstance) {
            const runningCount = runningInstance.count;
            const currentTime = new Date().toISOString();

            if (lastRunningCount !== runningCount) {
                console.log(`Time: ${currentTime}, Running Count: ${runningCount}`);
                fs.appendFile(logFilePath, `Time: ${currentTime}, Running Count: ${runningCount}\n`, (err) => {
                    if (err) {
                        console.error('Error writing to log file:', err);
                    }
                });
                lastRunningCount = runningCount;
                // You can also save the count to a file or database here if needed.
            }
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Call fetchAndRecord every second
setInterval(fetchAndRecord, 1000);
