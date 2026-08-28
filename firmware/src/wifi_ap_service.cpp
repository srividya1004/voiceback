/**
 * VoiceBack Smart Neckband - Wi-Fi SoftAP Hotspot & Telemetry Server Implementation
 */

#include "wifi_ap_service.h"
#include <ArduinoJson.h>

// Embedded HTML/JS Live EMG Dashboard served at http://192.168.4.1/
static const char INDEX_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>VoiceBack Hotspot Telemetry Dashboard</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; text-align: center; }
        .card { background: #1e293b; border-radius: 16px; padding: 24px; max-width: 640px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        h1 { color: #38bdf8; margin-top: 0; font-size: 22px; }
        .status { color: #4ade80; font-size: 13px; margin-bottom: 20px; font-weight: 600; }
        .val-container { display: flex; justify-content: space-around; margin: 20px 0; }
        .val-box { background: #334155; padding: 12px 8px; border-radius: 10px; flex: 1; margin: 0 4px; }
        .val-title { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        .val-num { font-size: 22px; font-weight: bold; color: #38bdf8; margin-top: 4px; }
        canvas { background: #020617; border-radius: 10px; width: 100%; height: 220px; display: block; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>VoiceBack Smart Neckband</h1>
        <div class="status">&#9679; Wi-Fi Hotspot Telemetry Stream (192.168.4.1)</div>
        <div class="val-container">
            <div class="val-box"><div class="val-title">Raw EMG</div><div class="val-num" id="rawVal">--</div></div>
            <div class="val-box"><div class="val-title">Filtered</div><div class="val-num" id="fltVal">--</div></div>
            <div class="val-box"><div class="val-title">Voltage</div><div class="val-num" id="vltVal">--</div></div>
        </div>
        <canvas id="emgChart"></canvas>
    </div>
    <script>
        const canvas = document.getElementById('emgChart');
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        const dataPoints = [];
        const maxPoints = 100;

        function drawGraph() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const step = canvas.width / (maxPoints - 1);
            for (let i = 0; i < dataPoints.length; i++) {
                const y = canvas.height - ((dataPoints[i] / 4095) * canvas.height);
                if (i === 0) ctx.moveTo(0, y);
                else ctx.lineTo(i * step, y);
            }
            ctx.stroke();
        }

        async function fetchTelemetry() {
            try {
                const res = await fetch('/api/emg');
                if (res.ok) {
                    const data = await res.json();
                    document.getElementById('rawVal').innerText = data.raw;
                    document.getElementById('fltVal').innerText = data.flt;
                    document.getElementById('vltVal').innerText = data.vlt + ' V';
                    dataPoints.push(data.flt);
                    if (dataPoints.length > maxPoints) dataPoints.shift();
                    drawGraph();
                }
            } catch(e) {}
            setTimeout(fetchTelemetry, 40);
        }
        fetchTelemetry();
    </script>
</body>
</html>
)rawliteral";

static WiFiEMGDataPacket latestEMGPacket = {0, 0.0f, 0.0f};

WiFiAPServiceManager::WiFiAPServiceManager()
    : server(80), apStarted(false), connectedClientsCount(0),
      wifiTaskHandle(nullptr), wifiQueue(nullptr) {}

void WiFiAPServiceManager::begin() {
    // 1. Configure Wi-Fi Access Point (SoftAP)
    WiFi.mode(WIFI_AP);
    apStarted = WiFi.softAP(WIFI_AP_SSID, WIFI_AP_PASSWORD, WIFI_AP_CHANNEL, 0, WIFI_AP_MAX_CONN);

    if (apStarted) {
        IPAddress apIP = WiFi.softAPIP();
        Serial.println("==================================================");
        Serial.printf("[Wi-Fi Hotspot] SoftAP Created Successfully!\n");
        Serial.printf("[Wi-Fi Hotspot] Network SSID: %s\n", WIFI_AP_SSID);
        Serial.printf("[Wi-Fi Hotspot] Password    : %s\n", WIFI_AP_PASSWORD);
        Serial.printf("[Wi-Fi Hotspot] Server IP   : %s\n", apIP.toString().c_str());
        Serial.printf("[Wi-Fi Hotspot] Web Dashboard: http://%s/\n", apIP.toString().c_str());
        Serial.printf("[Wi-Fi Hotspot] JSON API    : http://%s/api/emg\n", apIP.toString().c_str());
        Serial.println("==================================================");

        server.begin();

        // 2. Create FreeRTOS Queue for Wi-Fi Telemetry (holds up to 16 packets)
        wifiQueue = xQueueCreate(16, sizeof(WiFiEMGDataPacket));

        // 3. Spawn dedicated FreeRTOS Wi-Fi Task pinned to Core 0 (PRO_CPU)
        xTaskCreatePinnedToCore(
            WiFiAPServiceManager::wifiTaskWrapper,
            "WiFi_AP_Task",
            4096,
            this,
            1,                  // Priority 1
            &wifiTaskHandle,
            0                   // Pin to Core 0
        );

        Serial.println("[Wi-Fi Hotspot] Dedicated FreeRTOS Wi-Fi Task spawned on Core 0.");
    } else {
        Serial.println("[Wi-Fi Hotspot Error] Failed to create SoftAP network.");
    }
}

void WiFiAPServiceManager::wifiTaskWrapper(void *parameter) {
    WiFiAPServiceManager *instance = static_cast<WiFiAPServiceManager*>(parameter);
    instance->wifiTaskLoop();
}

void WiFiAPServiceManager::wifiTaskLoop() {
    WiFiEMGDataPacket packet;
    while (true) {
        // Read newest EMG packet from FreeRTOS queue
        if (wifiQueue != nullptr && xQueueReceive(wifiQueue, &packet, pdMS_TO_TICKS(10)) == pdTRUE) {
            latestEMGPacket = packet;
        }

        // Process incoming HTTP clients on Port 80
        WiFiClient client = server.available();
        if (client) {
            handleClientConnection(client);
        }

        vTaskDelay(pdMS_TO_TICKS(5));
    }
}

void WiFiAPServiceManager::handleClientConnection(WiFiClient &client) {
    String req = client.readStringUntil('\r');
    client.flush();

    if (req.indexOf("GET /api/emg") != -1) {
        // JSON API Endpoint for EMG Telemetry
        StaticJsonDocument<128> doc;
        doc["raw"] = latestEMGPacket.rawValue;
        doc["flt"] = round(latestEMGPacket.filteredValue * 100.0f) / 100.0f;
        doc["vlt"] = round(latestEMGPacket.voltageVolts * 1000.0f) / 1000.0f;

        char payload[128];
        serializeJson(doc, payload);

        client.println("HTTP/1.1 200 OK");
        client.println("Content-Type: application/json");
        client.println("Access-Control-Allow-Origin: *");
        client.println("Connection: close");
        client.println();
        client.println(payload);
    } else {
        // Serve Web Dashboard at http://192.168.4.1/
        client.println("HTTP/1.1 200 OK");
        client.println("Content-Type: text/html");
        client.println("Connection: close");
        client.println();
        client.println(FPSTR(INDEX_HTML));
    }
    client.stop();
}

bool WiFiAPServiceManager::queueEMGData(int rawValue, float filteredValue, float voltageVolts) {
    if (wifiQueue == nullptr) {
        return false;
    }

    WiFiEMGDataPacket packet = { rawValue, filteredValue, voltageVolts };

    // Non-blocking queue send
    if (xQueueSend(wifiQueue, &packet, 0) != pdTRUE) {
        WiFiEMGDataPacket dropped;
        xQueueReceive(wifiQueue, &dropped, 0);
        xQueueSend(wifiQueue, &packet, 0);
    }
    return true;
}

bool WiFiAPServiceManager::isStarted() const {
    return apStarted;
}

int WiFiAPServiceManager::getClientCount() const {
    return WiFi.softAPgetStationNum();
}
