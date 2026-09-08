/**
 * Boat Race Realtime Network Engine
 * Hybrid Multi-Channel: MQTT over WebSockets + WebRTC PeerJS + BroadcastChannel
 * Thiết kế tối ưu độ trễ thấp (<30ms) cho các nhịp bấm chèo thuyền liên tục
 */

class BoatNetwork {
  constructor() {
    this.isHost = false;
    this.pin = null;
    this.playerId = "racer_" + Math.random().toString(36).substring(2, 8);
    this.playerInfo = {
      id: this.playerId,
      name: "Tay Chèo " + Math.floor(Math.random() * 900 + 100),
      avatar: "🚣‍♂️",
      color: "#3b82f6",
      boatStyle: "classic"
    };

    // Channels & Connections
    this.peer = null;
    this.peerId = null;
    this.connections = new Map(); // Host: Map<playerId, DataConnection>
    this.hostConn = null;         // Player: DataConnection to Host
    this.broadcastChannel = null;
    this.mqttClient = null;
    this.mqttConnected = false;

    // Listeners & State
    this.listeners = new Map();
    this.status = "disconnected"; // disconnected, connecting, connected, error
    this.transportType = "none";
    this.seenMsgIds = new Set();
    this.seenTimer = null;
  }

  // ==========================================
  // EVENT EMITTER
  // ==========================================
  on(event, callback) {
    const ev = event.toLowerCase();
    if (!this.listeners.has(ev)) {
      this.listeners.set(ev, new Set());
    }
    this.listeners.get(ev).add(callback);
    return () => this.off(ev, callback);
  }

  off(event, callback) {
    const ev = event.toLowerCase();
    if (this.listeners.has(ev)) {
      this.listeners.get(ev).delete(callback);
    }
  }

  emit(event, data) {
    const ev = event.toLowerCase();
    if (this.listeners.has(ev)) {
      this.listeners.get(ev).forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[BoatNetwork] Lỗi trong callback ${ev}:`, err);
        }
      });
    }
  }

  // ==========================================
  // HOST INITIALIZATION
  // ==========================================
  initHost(pin) {
    this.isHost = true;
    this.pin = String(pin).trim();
    this.status = "connecting";
    this.emit("status_change", { status: "connecting" });

    console.log(`[BoatNetwork Host] Khởi tạo phòng đua PIN: ${this.pin}`);

    // 1. Kênh BroadcastChannel (cùng trình duyệt)
    this._initBroadcastChannel(this.pin);

    // 2. MQTT over WebSocket (Cloud Realtime Relay)
    this._initMqttHost(this.pin);

    // 3. WebRTC PeerJS (P2P trực tiếp)
    this._initPeerJsHost(this.pin);
  }

  // ==========================================
  // PLAYER INITIALIZATION
  // ==========================================
  initPlayer(pin, playerInfo = {}) {
    this.isHost = false;
    this.pin = String(pin).trim();
    this.playerInfo = Object.assign(this.playerInfo, playerInfo);
    this.playerId = this.playerInfo.id || this.playerId;
    this.status = "connecting";
    this.emit("status_change", { status: "connecting" });

    console.log(`[BoatNetwork Player] Người chơi ${this.playerId} kết nối PIN: ${this.pin}`);

    // 1. BroadcastChannel
    this._initBroadcastChannel(this.pin);

    // 2. MQTT
    this._initMqttPlayer(this.pin);

    // 3. PeerJS
    this._initPeerJsPlayer(this.pin);
  }

  // ==========================================
  // BROADCAST CHANNEL (Same-origin tabs)
  // ==========================================
  _initBroadcastChannel(pin) {
    if (typeof BroadcastChannel === "undefined") return;

    try {
      if (this.broadcastChannel) this.broadcastChannel.close();
      this.broadcastChannel = new BroadcastChannel(`boat_room_${pin}`);
      this.broadcastChannel.onmessage = (e) => {
        this._handleIncomingMessage(e.data, null, "broadcast");
      };
      console.log(`[BoatNetwork] Đã kích hoạt BroadcastChannel: boat_room_${pin}`);
    } catch (err) {
      console.warn("[BoatNetwork] Không thể tạo BroadcastChannel:", err);
    }
  }

  // ==========================================
  // MQTT IMPLEMENTATION
  // ==========================================
  _initMqttHost(pin) {
    if (typeof Paho === "undefined" || !Paho.MQTT) {
      console.warn("[BoatNetwork] Paho MQTT SDK chưa nạp.");
      return;
    }

    const hostClientId = "boathost_" + pin + "_" + Math.random().toString(36).substring(2, 6);
    const hostTopic = `boatrace/room/${pin}/host`;

    this._connectMqtt(hostClientId, (client) => {
      client.subscribe(hostTopic, { qos: 0 });
      console.log(`[BoatNetwork Host] Đã subscribe MQTT: ${hostTopic}`);
      this.status = "connected";
      this.transportType = "mqtt";
      this.emit("status_change", { status: "connected", transport: "mqtt" });
      this.emit("host_ready", { pin: this.pin });
    });
  }

  _initMqttPlayer(pin) {
    if (typeof Paho === "undefined" || !Paho.MQTT) {
      console.warn("[BoatNetwork] Paho MQTT SDK chưa nạp.");
      return;
    }

    const playerClientId = "boatp_" + pin + "_" + this.playerId;
    const globalTopic = `boatrace/room/${pin}/players`;
    const directTopic = `boatrace/room/${pin}/p/${this.playerId}`;

    this._connectMqtt(playerClientId, (client) => {
      client.subscribe(globalTopic, { qos: 0 });
      client.subscribe(directTopic, { qos: 0 });
      console.log(`[BoatNetwork Player] Đã subscribe MQTT: ${globalTopic}`);
      this.status = "connected";
      this.transportType = "mqtt";
      this.emit("status_change", { status: "connected", transport: "mqtt" });

      // Gửi sự kiện JOIN ngay khi kết nối
      this.sendToHost({
        type: "JOIN",
        playerId: this.playerId,
        name: this.playerInfo.name,
        avatar: this.playerInfo.avatar,
        color: this.playerInfo.color,
        boatStyle: this.playerInfo.boatStyle
      });
    });
  }

  _connectMqtt(clientId, onConnectCallback) {
    const brokers = [
      { host: "broker.hivemq.com", port: 8884, path: "/mqtt", useSSL: true },
      { host: "broker.emqx.io", port: 8084, path: "/mqtt", useSSL: true }
    ];

    let currentIdx = 0;

    const tryConnect = () => {
      if (currentIdx >= brokers.length) {
        console.warn("[BoatNetwork] Hết danh sách MQTT broker. Chạy chế độ WebRTC/BroadcastChannel.");
        return;
      }

      const cfg = brokers[currentIdx];
      try {
        const client = new Paho.MQTT.Client(cfg.host, Number(cfg.port), cfg.path, clientId);
        this.mqttClient = client;

        client.onConnectionLost = (resp) => {
          this.mqttConnected = false;
          if (resp.errorCode !== 0) {
            console.warn("[BoatNetwork MQTT] Mất kết nối:", resp.errorMessage);
            setTimeout(() => tryConnect(), 3000);
          }
        };

        client.onMessageArrived = (message) => {
          try {
            this._handleIncomingMessage(message.payloadString, null, "mqtt");
          } catch (e) {
            console.error("[BoatNetwork MQTT] Lỗi xử lý tin nhắn:", e);
          }
        };

        client.connect({
          useSSL: cfg.useSSL,
          timeout: 5,
          keepAliveInterval: 30,
          cleanSession: true,
          onSuccess: () => {
            this.mqttConnected = true;
            console.log(`[BoatNetwork MQTT] Kết nối thành công tới ${cfg.host}:${cfg.port}`);
            if (onConnectCallback) onConnectCallback(client);
          },
          onFailure: (err) => {
            console.warn(`[BoatNetwork MQTT] Thất bại với ${cfg.host}:`, err.errorMessage);
            currentIdx++;
            setTimeout(tryConnect, 1000);
          }
        });
      } catch (err) {
        console.warn("[BoatNetwork MQTT] Lỗi khởi tạo client:", err);
        currentIdx++;
        setTimeout(tryConnect, 1000);
      }
    };

    tryConnect();
  }

  // ==========================================
  // WEBRTC PEERJS IMPLEMENTATION
  // ==========================================
  _initPeerJsHost(pin) {
    if (typeof Peer === "undefined") return;

    const hostPeerId = `boatrace-host-${pin}`;
    try {
      this.peer = new Peer(hostPeerId, {
        debug: 0,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun.cloudflare.com:3478" }
          ]
        }
      });

      this.peer.on("open", (id) => {
        this.peerId = id;
        console.log(`[BoatNetwork PeerJS Host] Sẵn sàng ID: ${id}`);
        this.emit("host_ready", { pin: this.pin, peerId: id });
      });

      this.peer.on("connection", (conn) => {
        conn.on("open", () => {
          this.connections.set(conn.peer, conn);
          console.log(`[BoatNetwork Host] Đã kết nối WebRTC tới: ${conn.peer}`);
        });
        conn.on("data", (data) => {
          this._handleIncomingMessage(data, conn, "webrtc");
        });
        conn.on("close", () => {
          this.connections.delete(conn.peer);
        });
      });

      this.peer.on("error", (err) => {
        console.warn("[BoatNetwork PeerJS Host Error]:", err);
      });
    } catch (e) {
      console.warn("[BoatNetwork] Lỗi khởi tạo PeerJS Host:", e);
    }
  }

  _initPeerJsPlayer(pin) {
    if (typeof Peer === "undefined") return;

    const playerPeerId = `boatrace-p-${pin}-${this.playerId}`;
    try {
      this.peer = new Peer(playerPeerId, {
        debug: 0,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun.cloudflare.com:3478" }
          ]
        }
      });

      this.peer.on("open", () => {
        const hostPeerId = `boatrace-host-${pin}`;
        const conn = this.peer.connect(hostPeerId, { reliable: false });
        if (conn) {
          conn.on("open", () => {
            this.hostConn = conn;
            console.log(`[BoatNetwork Player] Đã kết nối WebRTC tới Host: ${hostPeerId}`);
            this.sendToHost({
              type: "JOIN",
              playerId: this.playerId,
              name: this.playerInfo.name,
              avatar: this.playerInfo.avatar,
              color: this.playerInfo.color,
              boatStyle: this.playerInfo.boatStyle
            });
          });
          conn.on("data", (data) => {
            this._handleIncomingMessage(data, conn, "webrtc");
          });
        }
      });

      this.peer.on("error", (err) => {
        console.warn("[BoatNetwork PeerJS Player Error]:", err);
      });
    } catch (e) {
      console.warn("[BoatNetwork] Lỗi khởi tạo PeerJS Player:", e);
    }
  }

  // ==========================================
  // SENDING MESSAGES
  // ==========================================
  sendToHost(payload) {
    const msg = this._prepareMessage(payload);
    const jsonStr = JSON.stringify(msg);

    // 1. BroadcastChannel
    if (this.broadcastChannel) {
      try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }

    // 2. WebRTC
    if (this.hostConn && this.hostConn.open) {
      try { this.hostConn.send(msg); } catch (e) {}
    }

    // 3. MQTT
    if (this.mqttClient && this.mqttConnected) {
      try {
        const topic = `boatrace/room/${this.pin}/host`;
        const mqttMsg = new Paho.MQTT.Message(jsonStr);
        mqttMsg.destinationName = topic;
        mqttMsg.qos = 0;
        this.mqttClient.send(mqttMsg);
      } catch (e) {}
    }
  }

  sendToAllPlayers(payload) {
    if (!this.isHost) return;
    const msg = this._prepareMessage(payload);
    const jsonStr = JSON.stringify(msg);

    // 1. BroadcastChannel
    if (this.broadcastChannel) {
      try { this.broadcastChannel.postMessage(msg); } catch (e) {}
    }

    // 2. WebRTC to all connected players
    this.connections.forEach((conn) => {
      if (conn.open) {
        try { conn.send(msg); } catch (e) {}
      }
    });

    // 3. MQTT
    if (this.mqttClient && this.mqttConnected) {
      try {
        const topic = `boatrace/room/${this.pin}/players`;
        const mqttMsg = new Paho.MQTT.Message(jsonStr);
        mqttMsg.destinationName = topic;
        mqttMsg.qos = 0;
        this.mqttClient.send(mqttMsg);
      } catch (e) {}
    }
  }

  sendToPlayer(targetPlayerId, payload) {
    if (!this.isHost) return;
    const msg = this._prepareMessage(payload);
    const jsonStr = JSON.stringify(msg);

    // 1. BroadcastChannel
    if (this.broadcastChannel) {
      try { this.broadcastChannel.postMessage({ ...msg, targetPlayerId }); } catch (e) {}
    }

    // 2. WebRTC
    const conn = this.connections.get(`boatrace-p-${this.pin}-${targetPlayerId}`);
    if (conn && conn.open) {
      try { conn.send(msg); } catch (e) {}
    }

    // 3. MQTT
    if (this.mqttClient && this.mqttConnected) {
      try {
        const topic = `boatrace/room/${this.pin}/p/${targetPlayerId}`;
        const mqttMsg = new Paho.MQTT.Message(jsonStr);
        mqttMsg.destinationName = topic;
        mqttMsg.qos = 0;
        this.mqttClient.send(mqttMsg);
      } catch (e) {}
    }
  }

  // ==========================================
  // MESSAGE PROCESSING & DEDUPLICATION
  // ==========================================
  _prepareMessage(payload) {
    return {
      _msgId: "m_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
      _senderId: this.playerId,
      _time: Date.now(),
      ...payload
    };
  }

  _handleIncomingMessage(rawData, conn, transport) {
    let msg = rawData;
    if (typeof rawData === "string") {
      try {
        msg = JSON.parse(rawData);
      } catch (e) {
        return;
      }
    }

    if (!msg || typeof msg !== "object") return;

    // Không xử lý tin nhắn do chính mình gửi đi
    if (msg._senderId === this.playerId) return;

    // Lọc nếu tin nhắn chỉ dành cho một player đích
    if (msg.targetPlayerId && msg.targetPlayerId !== this.playerId) return;

    // Khử trùng lặp (Deduplication)
    if (msg._msgId) {
      if (this.seenMsgIds.has(msg._msgId)) return;
      this.seenMsgIds.add(msg._msgId);
      if (this.seenMsgIds.size > 2000) {
        this.seenMsgIds.clear();
      }
    }

    // Phát sự kiện nhận gói tin
    const type = (msg.type || "").toLowerCase();
    this.emit("message", msg);
    if (type) {
      this.emit(type, msg);
    }
  }
}

// Gắn vào window
if (typeof window !== "undefined") {
  window.BoatNetwork = BoatNetwork;
}
