import { useEffect, useRef, useState } from "react";

const MQTT_URL = "wss://cd85c0f44f5e4b4c94e522b103e76ee7.s1.eu.hivemq.cloud:8884/mqtt";
const TOPIC_TELEMETRY_BASE = "bioreactor/telemetry";
const TOPIC_TELEMETRY_WILDCARD = `${TOPIC_TELEMETRY_BASE}/#`;
const TOPIC_SETPOINTS = "bioreactor/setpoints";

const username = "hivemq.webclient.1764949276934"
const pw = ";!N@HJ0afyLs5mAX$n48"

export function useHardwareBioreactorStream(subsystem = null, options = {}) {
  const clientRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [telemetry, setTelemetry] = useState(null);
  const [lastSetpoints, setLastSetpoints] = useState({
    temp: 30,
    rpm: 600,
    pH: 5,
  });
  const lastSetpointsRef = useRef(lastSetpoints);

  useEffect(() => {
    lastSetpointsRef.current = lastSetpoints;
  }, [lastSetpoints]);

  useEffect(() => {
    let mounted = true;

    async function setupMqtt() {
      // indicate we're attempting to connect so UI doesn't always show 'disconnected'
      setConnectionStatus("connecting");
      try {
        // dynamic import so Vite/browser doesn't evaluate node-only parts at module-load
        const { default: mqtt } = await import("mqtt/dist/mqtt.esm");
        if (!mounted) return;

        const client = mqtt.connect(MQTT_URL, {
          clean: true,
              clientId: 'nodejs-' + Math.random().toString(16).slice(2),
            username: username,
            password: pw,
          connectTimeout: 4000,
          reconnectPeriod: 2000,
        });

        clientRef.current = client;

        client.on("connect", () => {
          console.log("Dashboard connected to MQTT");
          setConnectionStatus("connected");
          // subscribe to subsystem-specific topic if provided, otherwise use default
          try {
            const topic = subsystem
              ? `${TOPIC_TELEMETRY_BASE}/${subsystem}`
              : TOPIC_TELEMETRY_WILDCARD;
            client.subscribe(topic, (err) => {
              if (err) console.error("Telemetry subscribe error:", err);
            });
          } catch (e) {
            console.error('Subscribe failed', e);
          }
        });

        client.on("reconnect", () => setConnectionStatus("reconnecting"));
        client.on("close", () => setConnectionStatus("disconnected"));
        client.on("error", (err) => {
          console.error("MQTT error:", err);
          setConnectionStatus("error");
        });

        const normalizeTimestamp = (rawTimestamp) => {
          if (rawTimestamp === undefined || rawTimestamp === null) {
            return Date.now();
          }

          const numeric = Number(rawTimestamp);
          if (Number.isNaN(numeric)) {
            return Date.now();
          }

          // If timestamp looks like seconds (10 digits), convert to ms.
          return numeric < 1e12 ? numeric * 1000 : numeric;
        };

        client.on("message", (topic, message) => {
          // handle messages from telemetry topics; parse JSON loosely
          try {
            const data = JSON.parse(message.toString());
            const normalized = {
              ...data,
              timestamp: normalizeTimestamp(data.timestamp ?? data.time),
              receivedAt: Date.now(),
            };
            setTelemetry(normalized);
          } catch (err) {
            console.error("Bad telemetry JSON:", err);
          }
        });
      } catch (err) {
        // If mqtt can't be imported or throws (common in some browser setups),
        // don't let the whole app crash — log and keep the hook functional.
        // The UI will show disconnected state and the hardware tester can
        // still work in a simulated mode.
        // eslint-disable-next-line no-console
        console.warn("MQTT client failed to load or initialize:", err);
        setConnectionStatus("disconnected");
      }
    }

    setupMqtt();

    return () => {
      mounted = false;
      if (clientRef.current) {
        try {
          if (typeof clientRef.current.end === 'function') {
            clientRef.current.end(true);
          }
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const sendSetpoints = (partial) => {
    setLastSetpoints((prev) => {
      const merged = { ...prev, ...partial };

      const setpointTopic = subsystem ? `bioreactor/${subsystem}/setpoints` : TOPIC_SETPOINTS;
      if (clientRef.current?.connected) {
        try {
          clientRef.current.publish(setpointTopic, JSON.stringify(merged));
        } catch (e) {
          console.warn('Failed to publish setpoints', e);
        }
      } else {
        // silently accept updates when not connected; dashboard shows lastSetpoints
        console.warn("Tried to send setpoints while MQTT not connected");
      }

      return merged;
    });
  };

  return { telemetry, lastSetpoints, sendSetpoints, connectionStatus };
}
