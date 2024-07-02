import axios from 'axios';
import * as fs from 'fs';

// URL and subscription details
const URL_BASE = 'https://management.azure.com/subscriptions/7cc3e30a-740e-4682-9103-1f2c11f3f76d/resourceGroups/weidong-aci/providers/Microsoft.ContainerInstance/containerGroups/weidongstandbycg-ai';
const API_VERSION = '2023-05-01';
const LOG_FILE = 'curl_time_log.txt';
const TOKEN = '';

interface ApiResponse {
    properties: {
        provisioningState: string;
    };
}

const runCurl = async (index: number) => {
    const url = `${URL_BASE}${index}?api-version=${API_VERSION}`;
    const startTime = new Date().getTime();

    try {
        let response = await axios.put<ApiResponse>(url, {
            location: 'westus3',
            properties: {
                standByPoolProfile: {
                    id: '/subscriptions/7cc3e30a-740e-4682-9103-1f2c11f3f76d/resourceGroups/weidong-aci/providers/Microsoft.StandbyPool/standbyContainerGroupPools/weidong-standby-ai'
                },
                containerGroupProfile: {
                    id: '/subscriptions/7cc3e30a-740e-4682-9103-1f2c11f3f76d/resourceGroups/weidong-aci/providers/Microsoft.ContainerInstance/containerGroupProfiles/weidong-aciprofile-ai',
                    revision: 1
                },
                containers: [
                    {
                        name: 'dynamicendpoint-app',
                        properties: {}
                    }
                ],
                "subnetIds": [
                    {
                        "id": "/subscriptions/7cc3e30a-740e-4682-9103-1f2c11f3f76d/resourcegroups/weidong-aci/providers/Microsoft.Network/virtualNetworks/weidong-aci-vnet-ai/subnets/default"
                    }
                ]
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            }
        });

        let provisioningState = response.data.properties.provisioningState;

        while (provisioningState === 'Pending') {
            console.log(`Request ${index} is still Pending, checking again...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before checking again
            response = await axios.get<ApiResponse>(url, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`
                }
            });
            provisioningState = response.data.properties.provisioningState;
        }

        const endTime = new Date().getTime();
        const timeCost = endTime - startTime;
        fs.appendFileSync(LOG_FILE, `Request ${index}: ${timeCost} ms\n`);
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error(`Request ${index} failed:`, err.message);
        } else {
            console.error(`Request ${index} failed with unknown error`);
        }
    }
};

// Clear the log file if it exists
fs.writeFileSync(LOG_FILE, '');

// Generate indices from 1 to 300 and run the curl command concurrently
const indices = Array.from({length: 400}, (_, i) => i + 1);

const promises = indices.map(index => runCurl(index));

Promise.all(promises)
    .then(() => {
        console.log('All requests have completed.');
    })
    .catch(error => {
        console.error('An error occurred:', error.message);
    });
